import { type } from "arktype";
import loadConfig from "../config.js";
import { saveSubmittedTxArtifact } from "../deployments.js";
import {
  AssetName,
  ByteArray,
  createWallet,
  logExit,
  PolicyId,
  TxHash,
} from "../inputs.js";
import { mintSingleton } from "../merkle-oracle/index.js";

const GenesisOptions = type({
  singletonName: AssetName,
  adminPolicyId: PolicyId,
  adminAssetName: AssetName,
  ipfsCid: ByteArray,
  treeRoot: ByteArray,
  submit: "boolean",
});

const genesis = async ($options: object) => {
  const options = GenesisOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const config = loadConfig();
  const wallet = await createWallet(config);
  if (!wallet) return;
  const { lucid, network, address } = wallet;

  const { token, tx, reference } = await mintSingleton(
    options.singletonName,
    options.adminPolicyId,
    options.adminAssetName,
    options.ipfsCid,
    options.treeRoot,
    lucid,
    network,
  );

  if (options.submit) {
    const txCbor = tx.toCBOR();
    const txHash = TxHash.assert(await tx.submit());
    console.log("Merkle Oracle Genesis tx submitted:", txHash);

    await saveSubmittedTxArtifact({
      category: "oracle",
      command: "genesis",
      network: config.network,
      walletAddress: address,
      txHash,
      txCbor,
      inputs: {
        singletonName: options.singletonName,
        adminPolicyId: options.adminPolicyId,
        adminAssetName: options.adminAssetName,
        ipfsCid: options.ipfsCid,
        treeRoot: options.treeRoot,
      },
      outputs: {
        singletonToken: token,
        referenceUtxos: reference,
      },
    });
    return;
  }

  console.log("Built Merkle Oracle Genesis tx:", tx.toHash());
};

export { genesis };
