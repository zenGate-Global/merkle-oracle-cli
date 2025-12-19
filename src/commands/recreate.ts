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
import { recreateContract } from "../merkle-oracle/index.js";

const RecreateOptions = type({
  requiredSigners: VerificationKey.array(),
  newMerkleRootHash: ByteArray,
  newIpfsCid: "string",
  genesisTxHash: TxHash,
  submit: "boolean",
});

const recreate = async ($options: object) => {
  const options = RecreateOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const config = loadConfig();
  const wallet = await createWallet(config);
  if (!wallet) return;
  const { lucid, network, address } = wallet;

  const result = await recreateContract(
    options.genesisTxHash,
    options.requiredSigners,
    options.newMerkleRootHash,
    options.newIpfsCid,
    lucid,
    config,
    network,
  );

  if (!result) {
    console.log(
      "Partial signature created. Collect additional signatures before submission.",
    );
    return;
  }

  const { tx, utxo } = result;

  if (options.submit) {
    const txCbor = tx.toCBOR();
    const txHash = TxHash.assert(await tx.submit());
    console.log("Recreated oracle with transaction:", txHash);

    await saveSubmittedTxArtifact({
      category: "oracle",
      command: "recreate",
      network: config.network,
      walletAddress: address,
      txHash,
      txCbor,
      inputs: {
        genesisTxHash: options.genesisTxHash,
        requiredSigners: options.requiredSigners,
        newMerkleRootHash: options.newMerkleRootHash,
        newIpfsCid: options.newIpfsCid,
      },
      outputs: {
        utxo,
      },
    });
    return;
  }

  console.log("Built recreate tx: ", tx.toHash());
};

export { recreate };
