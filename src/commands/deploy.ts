import { type } from "arktype";
import loadConfig from "../config.js";
import { saveSubmittedTxArtifact } from "../deployments.js";
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

  const config = loadConfig();
  const wallet = await createWallet(config);
  if (!wallet) return;
  const { lucid, network, address } = wallet;

  const { token, tx, utxo } = await deployAdmin(
    singletonName,
    options.threshold,
    options.signatures,
    lucid,
    network,
  );

  if (options.submit) {
    const txCbor = tx.toCBOR();
    const txHash = TxHash.assert(await tx.submit());
    console.log("Deployed multisig contract with singleton:", token);
    console.log("Transaction hash:", txHash);

    await saveSubmittedTxArtifact({
      category: "multisig",
      command: "deploy",
      network: config.network,
      walletAddress: address,
      txHash,
      txCbor,
      inputs: {
        singletonName: options.singletonName,
        threshold: options.threshold,
        signatures: options.signatures,
      },
      outputs: {
        singletonToken: token,
        utxo,
      },
    });
    return;
  }

  console.log("Built admin deploy tx:", tx.toHash());
};

export { deploy };
