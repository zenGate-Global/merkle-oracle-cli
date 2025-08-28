import { type } from "arktype";
import loadConfig from "../config.js";
import { deploy } from "../consumer/index.js";
import {
  AssetName,
  createWallet,
  logExit,
  PolicyId,
  TxHash,
  Uint,
} from "../inputs.js";

const DeployConsumerOptions = type({
  oraclePolicyId: PolicyId,
  oracleAssetName: AssetName,
  lovelaceToLock: Uint,
  threshold: Uint,
  shouldDeployScript: "boolean",
  submit: "boolean",
});

const deployConsumer = async ($options: object) => {
  const options = DeployConsumerOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const oraclePolicyId = PolicyId.assert(options.oraclePolicyId);
  const oracleAssetName = AssetName.assert(options.oracleAssetName);
  const threshold = Uint.assert(options.threshold);
  const lovelaceToLock = Uint.assert(options.lovelaceToLock);

  const wallet = await createWallet(loadConfig());
  if (!wallet) return;
  const { lucid, network } = wallet;

  const { tx } = await deploy(
    oraclePolicyId,
    oracleAssetName,
    threshold,
    lovelaceToLock,
    options.shouldDeployScript,
    lucid,
    network,
  );

  if (options.submit) {
    const txHash = TxHash.assert(await tx.submit());
    console.log("Transaction hash:", txHash);
    return;
  }

  console.log("Built consumer deploy tx:", tx.toHash());
};

export { deployConsumer };
