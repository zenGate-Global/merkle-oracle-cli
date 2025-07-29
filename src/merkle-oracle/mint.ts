import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import {
  Blockfrost,
  LucidEvolution,
  Network,
  UTxO,
} from "@lucid-evolution/lucid";
import { MerkleOracleDatum } from "../blockchain/datums.js";
import { GenesisRedeemer } from "../blockchain/redeemers.js";
import { getValidityRange } from "../blockchain/time.js";
import loadConfig from "../config.js";
import { TOLERANCE_MS } from "../contracts/index.js";
import { AssetName, ByteArray, loadProvider, PolicyId } from "../inputs.js";
import { invariant } from "../invariant.js";
import { MerkleOracle } from "../validators/merkle-oracle.js";
import { Singleton } from "../validators/singleton.js";

const mintSingleton = async (
  singletonName: AssetName,
  adminPolicyId: PolicyId,
  adminAssetName: AssetName,
  ipfsCid: ByteArray,
  treeRoot: ByteArray,
  lucid: LucidEvolution,
  network: Network,
) => {
  const provider = loadProvider(loadConfig()).provider;
  invariant(provider, "provider must be set for lucid");

  invariant(provider instanceof Blockfrost);
  const blockfrost = new BlockFrostAPI({ projectId: provider.projectId });

  const utxos = await lucid.wallet().getUtxos();
  const input = utxos[0];
  const singleton = await Singleton.create(singletonName, input);
  const merkeOracle = await MerkleOracle.create(singletonName, input, network);

  console.log(`Merkle Oracle Address: ${merkeOracle.address}`);
  console.log(`Merkle Oracle Datum: ${merkeOracle.params.value}`);

  const latestSlot = (await blockfrost.blocksLatest()).slot!;

  const validityRange = getValidityRange(latestSlot, TOLERANCE_MS, network);

  const [walletUtxos, outputs, tx] = await lucid
    .newTx()
    .collectFrom([input])
    .mintAssets({ [singleton.token]: BigInt(1) }, GenesisRedeemer)
    .attach.MintingPolicy(singleton.policy)
    .pay.ToContract(
      merkeOracle.address,
      MerkleOracleDatum(
        adminPolicyId,
        adminAssetName,
        treeRoot,
        ipfsCid,
        validityRange.midSlotUnix,
      ),
      {
        [singleton.token]: BigInt(1),
      },
      singleton.policy,
    )
    .pay.ToContract(
      singleton.address,
      singleton.params,
      undefined,
      singleton.policy,
    )
    .validFrom(validityRange.currentSlotUnix)
    .validTo(validityRange.futureSlotUnix)
    .chain();
  const signed = await tx.sign.withWallet().complete();
  lucid.overrideUTxOs(walletUtxos);

  const utxo = outputs.find((output) =>
    Object.keys(output.assets).includes(singleton.token),
  );
  invariant(utxo, "token is missing");

  invariant(outputs.length > 1, "outputs are missing");
  const reference: [UTxO, UTxO] = [outputs[0], outputs[1]];
  invariant(
    reference[0].address === merkeOracle.address,
    "contract utxo is missing",
  );

  invariant(
    reference[1].address === merkeOracle.address,
    "reference script is missing",
  );

  return {
    reference,
    token: singleton.token,
    tx: signed,
    utxo,
  };
};

export { mintSingleton };
