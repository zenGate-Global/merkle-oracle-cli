import { type } from "arktype";
import loadConfig from "../config.js";
import {
  ByteArray,
  createWallet,
  logExit,
  TxHash,
  VerificationKey,
} from "../inputs.js";
import { changeSignatures } from "../multisig/index.js";

const ChangeSignaturesOptions = type({
  genesisTxHash: ByteArray,
  requiredSigners: VerificationKey.array(),
  signatures: VerificationKey.array(),
  submit: "boolean",
});

const changeSignaturesCommand = async ($options: object) => {
  const options = ChangeSignaturesOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const wallet = await createWallet(loadConfig());
  if (!wallet) return;
  const { lucid } = wallet;

  const genesisTxHash = TxHash.assert(options.genesisTxHash);

  const result = await changeSignatures(
    genesisTxHash,
    options.requiredSigners,
    options.signatures,
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
    console.log("Changed signatures for singleton:", singleton);
    console.log("Transaction hash:", txHash);
    return;
  }

  console.log("Built change signatures tx:", tx.toHash());
};

export { changeSignaturesCommand };
