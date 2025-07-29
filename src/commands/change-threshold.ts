import { type } from "arktype";
import loadConfig from "../config.js";
import {
  ByteArray,
  createWallet,
  logExit,
  TxHash,
  Uint,
  VerificationKey,
} from "../inputs.js";
import { changeThreshold } from "../multisig/index.js";

const ChangeThresholdOptions = type({
  genesisTxHash: ByteArray,
  requiredSigners: VerificationKey.array(),
  threshold: Uint,
  submit: "boolean",
});

const changeThresholdCommand = async ($options: object) => {
  const options = ChangeThresholdOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const wallet = await createWallet(loadConfig());
  if (!wallet) return;
  const { lucid } = wallet;

  const genesisTxHash = TxHash.assert(options.genesisTxHash);

  const result = await changeThreshold(
    genesisTxHash,
    options.requiredSigners,
    options.threshold,
    lucid,
    loadConfig(),
  );

  if (!result) {
    console.log(
      "Partial signature created. Collect additional signatures before submission.",
    );
    return;
  }

  const { singleton, tx } = result;

  if (options.submit) {
    const txHash = TxHash.assert(await tx.submit());
    console.log("Changed threshold for singleton:", singleton);
    console.log("Transaction hash:", txHash);
    return;
  }

  console.log("Built change threshold tx:", tx.toHash());
};

export { changeThresholdCommand };
