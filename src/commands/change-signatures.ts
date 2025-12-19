import { type } from "arktype";
import loadConfig from "../config.js";
import { saveSubmittedTxArtifact } from "../deployments.js";
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

  const config = loadConfig();
  const wallet = await createWallet(config);
  if (!wallet) return;
  const { lucid, address } = wallet;

  const genesisTxHash = TxHash.assert(options.genesisTxHash);

  const result = await changeSignatures(
    genesisTxHash,
    options.requiredSigners,
    options.signatures,
    lucid,
    config,
  );

  if (!result) {
    console.log(
      "Partial signature created. Collect additional signatures before submission.",
    );
    return;
  }

  const { singleton, tx, utxo } = result;

  if (options.submit) {
    const txCbor = tx.toCBOR();
    const txHash = TxHash.assert(await tx.submit());
    console.log("Changed signatures for singleton:", singleton);
    console.log("Transaction hash:", txHash);

    await saveSubmittedTxArtifact({
      category: "multisig",
      command: "change-signatures",
      network: config.network,
      walletAddress: address,
      txHash,
      txCbor,
      inputs: {
        genesisTxHash: options.genesisTxHash,
        requiredSigners: options.requiredSigners,
        signatures: options.signatures,
      },
      outputs: {
        singleton,
        utxo,
      },
    });
    return;
  }

  console.log("Built change signatures tx:", tx.toHash());
};

export { changeSignaturesCommand };
