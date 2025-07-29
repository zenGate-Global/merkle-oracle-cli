import { Lucid } from "@lucid-evolution/lucid";
import pRetry from "p-retry";
import { Config } from "../config.js";
import { loadProvider } from "../inputs.js";
import { invariant } from "../invariant.js";

const retry = {
  retries: 3,
  minTimeout: 20_000,
  maxTimeout: 20_000,
  factor: 1,
};

const submit = async (tx: string, amount: bigint, config: Config) => {
  const provider = loadProvider(config);
  invariant(provider);
  const lucid = await Lucid(provider.provider, provider.network);
  lucid.selectWallet.fromSeed(config.walletMnemonic);
  const signed = await lucid.fromTx(tx).sign.withWallet().complete();
  console.debug(`Submitting ${signed.toHash()} on-chain`);

  try {
    await pRetry(() => signed.submit(), retry);
    console.log(
      `Submitted ${signed.toHash()} on-chain to mint ${amount} tokens`,
    );
  } catch (error) {
    if (error && typeof error === "object" && "message" in error) {
      const message = String(error.message);

      if (message.includes("BadInputsUTxO")) {
        console.error(
          `Cannot submit ${signed.toHash()} because state has changed`,
        );
        return;
      }

      if (message.includes("OutsideValidityIntervalUTxO")) {
        console.error(`Cannot submit ${signed.toHash()} because it's expired`);
        return;
      }

      console.error(error.message);
      return;
    }

    console.error(error);
  }
};

export { submit };
