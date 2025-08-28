import { type } from "arktype";
import loadConfig from "../config.js";
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
  newIpfsCid: 'string',
  genesisTxHash: TxHash,
  submit: "boolean",
});

const recreate = async ($options: object) => {
  const options = RecreateOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const wallet = await createWallet(loadConfig());
  if (!wallet) return;
  const { lucid, network } = wallet;

  const result = await recreateContract(
    options.genesisTxHash,
    options.requiredSigners,
    options.newMerkleRootHash,
    options.newIpfsCid,
    lucid,
    loadConfig(),
    network,
  );

  if (!result) {
    console.log(
      "Partial signature created. Collect additional signatures before submission.",
    );
    return;
  }

  const { tx } = result;

  if (options.submit) {
    const txHash = TxHash.assert(await tx.submit());
    console.log("Recreated oracle with transaction:", txHash);
    return;
  }

  console.log("Built recreate tx: ", tx.toHash());
};

export { recreate };
