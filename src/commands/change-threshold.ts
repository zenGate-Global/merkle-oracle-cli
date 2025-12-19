import { type } from "arktype";
import loadConfig from "../config.js";
import { saveSubmittedTxArtifact } from "../deployments.js";
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

  const config = loadConfig();
  const wallet = await createWallet(config);
  if (!wallet) return;
  const { lucid, address } = wallet;

  const genesisTxHash = TxHash.assert(options.genesisTxHash);

  const result = await changeThreshold(
    genesisTxHash,
    options.requiredSigners,
    options.threshold,
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
    console.log("Changed threshold for singleton:", singleton);
    console.log("Transaction hash:", txHash);

    await saveSubmittedTxArtifact({
      category: "multisig",
      command: "change-threshold",
      network: config.network,
      walletAddress: address,
      txHash,
      txCbor,
      inputs: {
        genesisTxHash: options.genesisTxHash,
        requiredSigners: options.requiredSigners,
        threshold: options.threshold,
      },
      outputs: {
        singleton,
        utxo,
      },
    });
    return;
  }

  console.log("Built change threshold tx:", tx.toHash());
};

export { changeThresholdCommand };
