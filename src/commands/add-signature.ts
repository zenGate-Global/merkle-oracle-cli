import { readFileSync } from "fs";
import { type } from "arktype";
import loadConfig from "../config.js";
import {
  createWallet,
  logExit,
  MultisigSignSchema,
  TxHash,
} from "../inputs.js";
import { addSignature } from "../multisig/add-signature.js";

const AddSignatureOptions = type({
  multisigFile: "string",
  submit: "boolean",
});

const addSignatureCommand = async ($options: object) => {
  const options = AddSignatureOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  let multisigData;
  try {
    const fileContent = readFileSync(options.multisigFile, "utf-8");
    multisigData = JSON.parse(fileContent);
  } catch (error) {
    return logExit(
      `Failed to read or parse multisig file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const multiSigSignConfig = MultisigSignSchema(multisigData);
  if (multiSigSignConfig instanceof type.errors) {
    return logExit(
      `Invalid multisig file format: ${multiSigSignConfig.summary}`,
    );
  }

  const wallet = await createWallet(loadConfig());
  if (!wallet) return;
  const { lucid } = wallet;

  const result = await addSignature(lucid, multiSigSignConfig);

  if (!result) {
    return;
  }

  const { tx } = result;

  if (tx && options.submit) {
    const txHash = TxHash.assert(await tx.submit());
    console.log("Transaction submitted successfully!");
    console.log("Transaction hash:", txHash);
    return;
  }

  if (tx) {
    console.log("All signatures collected. Transaction ready for submission.");
    console.log("Transaction hash:", tx.toHash());
    return;
  }

  console.log(
    "Signature added. Transaction ready for additional signatures or submission.",
  );
};

export { addSignatureCommand };
