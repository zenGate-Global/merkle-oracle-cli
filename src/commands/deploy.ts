import { type } from "arktype";
import loadConfig from "../config.js";
import {
  AssetName,
  createWallet,
  logExit,
  TxHash,
  Uint,
  VerificationKey,
} from "../inputs.js";
import { deployAdmin } from "../multisig/index.js";

const DeployOptions = type({
  singletonName: AssetName,
  threshold: Uint,
  signatures: VerificationKey.array(),
  submit: "boolean",
});

const deploy = async ($options: object) => {
  const options = DeployOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const singletonName = AssetName.assert(options.singletonName);

  const wallet = await createWallet(loadConfig());
  if (!wallet) return;
  const { lucid, network } = wallet;

  const { token, tx } = await deployAdmin(
    singletonName,
    options.threshold,
    options.signatures,
    lucid,
    network,
  );

  if (options.submit) {
    const txHash = TxHash.assert(await tx.submit());
    console.log("Deployed multisig contract with singleton:", token);
    console.log("Transaction hash:", txHash);
    return;
  }

  console.log("Built admin deploy tx:", tx.toHash());
};

export { deploy };
