import { type } from "arktype";
import loadConfig from "../config.js";
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

  const wallet = await createWallet(loadConfig());
  if (!wallet) return;
  const { lucid } = wallet;

  const result = await singletonWithdraw(
    options.genesisTxHash,
    options.withdrawAddress,
    options.requiredSigners,
    lucid,
    loadConfig(),
  );

  if (result && options.submit) {
    const txHash = await result.tx.submit();
    console.log(`Transaction submitted: ${txHash}`);
  } else if (result) {
    console.log(`Singleton withdraw transaction built: ${result.tx.toHash()}`);
  }
};

export { singletonWithdrawCommand };
