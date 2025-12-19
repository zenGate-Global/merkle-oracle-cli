import { type } from "arktype";
import loadConfig from "../config.js";
import { saveSubmittedTxArtifact } from "../deployments.js";
import { createWallet, logExit, TxHash, VerificationKey } from "../inputs.js";
import { singletonWithdraw } from "../merkle-oracle/singleton-withdraw.js";

const SingletonWithdrawOptions = type({
  genesisTxHash: TxHash,
  // TODO: make address type
  withdrawAddress: "string",
  requiredSigners: VerificationKey.array(),
  submit: "boolean",
});

const singletonWithdrawCommand = async ($options: object) => {
  const options = SingletonWithdrawOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const config = loadConfig();
  const wallet = await createWallet(config);
  if (!wallet) return;
  const { lucid, address } = wallet;

  const result = await singletonWithdraw(
    options.genesisTxHash,
    options.withdrawAddress,
    options.requiredSigners,
    lucid,
    config,
  );

  if (result && options.submit) {
    const txCbor = result.tx.toCBOR();
    const txHash = TxHash.assert(await result.tx.submit());
    console.log(`Transaction submitted: ${txHash}`);

    await saveSubmittedTxArtifact({
      category: "oracle",
      command: "singleton-withdraw",
      network: config.network,
      walletAddress: address,
      txHash,
      txCbor,
      inputs: {
        genesisTxHash: options.genesisTxHash,
        withdrawAddress: options.withdrawAddress,
        requiredSigners: options.requiredSigners,
      },
      outputs: {
        utxo: result.utxo,
      },
    });
  } else if (result) {
    console.log(`Singleton withdraw transaction built: ${result.tx.toHash()}`);
  }
};

export { singletonWithdrawCommand };
