import { type } from "arktype";
import loadConfig from "../config.js";
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

  const wallet = await createWallet(loadConfig());
  if (!wallet) return;
  const { lucid, network } = wallet;
  const { tx } = await mintSingleton(
    options.singletonName,
    options.adminPolicyId,
    options.adminAssetName,
    options.ipfsCid,
    options.treeRoot,
    lucid,
    network,
  );

  if (options.submit) {
    const txHash = TxHash.assert(await tx.submit());
    console.log("Merkle Oracle Genesis tx submitted:", txHash);
    return;
  }

  console.log("Built Merkle Oracle Genesis tx:", tx.toHash());
};

export { genesis };
