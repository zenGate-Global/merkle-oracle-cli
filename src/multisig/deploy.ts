import { LucidEvolution, Network } from "@lucid-evolution/lucid";
import { MultisigDatum } from "../blockchain/datums.js";
import { MultisigGenesisRedeemer } from "../blockchain/redeemers.js";
import { AssetName, Uint, VerificationKey } from "../inputs.js";
import { invariant } from "../invariant.js";
import { MultisigSingleton } from "../validators/multisig-singleton.js";
import { Multisig } from "../validators/multisig.js";

const deployAdmin = async (
  singletonName: AssetName,
  threshold: Uint,
  signatures: Array<VerificationKey>,
  lucid: LucidEvolution,
  network: Network,
) => {
  const utxos = await lucid.wallet().getUtxos();
  const input = utxos[0];
  const singleton = await MultisigSingleton.create(singletonName, input);
  const multisig = await Multisig.create(singletonName, input, network);

  const [walletUtxos, outputs, tx] = await lucid
    .newTx()
    .collectFrom([input])
    .mintAssets(
      { [singleton.token]: BigInt(1) },
      MultisigGenesisRedeemer(threshold, signatures),
    )
    .attach.MintingPolicy(singleton.policy)
    .pay.ToContract(
      multisig.address,
      MultisigDatum(threshold, signatures),
      {
        [singleton.token]: BigInt(1),
      },
      singleton.policy,
    )
    .chain();
  const signed = await tx.sign.withWallet().complete();
  lucid.overrideUTxOs(walletUtxos);

  const utxo = outputs.find((output) =>
    Object.keys(output.assets).includes(singleton.token),
  );
  invariant(utxo, "token is missing");

  invariant(outputs.length > 1, "outputs are missing");

  return {
    token: singleton.token,
    tx: signed,
    utxo,
  };
};

export { deployAdmin };
