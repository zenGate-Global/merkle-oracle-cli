import { LucidEvolution, Network } from "@lucid-evolution/lucid";
import { ConsumerDeployDatum } from "../blockchain/datums.js";
import { AssetName, PolicyId, Uint } from "../inputs.js";
import { invariant } from "../invariant.js";
import { Consumer } from "../validators/consumer.js";

const deploy = async (
  oraclePolicyId: PolicyId,
  oracleSingletonName: AssetName,
  threshold: Uint,
  lovelaceToLock: Uint,
  shouldDeployScript: boolean,
  lucid: LucidEvolution,
  network: Network,
) => {
  const consumer = await Consumer.create(
    oraclePolicyId,
    oracleSingletonName,
    BigInt(threshold),
    network,
  );

  const txBuilder = lucid.newTx().pay.ToContract(consumer.address, undefined, {
    lovelace: BigInt(lovelaceToLock),
  });

  if (shouldDeployScript) {
    txBuilder.pay.ToContract(
      consumer.address,
      ConsumerDeployDatum(
        consumer.oraclePolicyId,
        consumer.oracleAssetName,
        consumer.threshold,
      ),
      undefined,
      consumer.script,
    );
  }

  const [walletUtxos, outputs, tx] = await txBuilder.chain();

  const signed = await tx.sign.withWallet().complete();
  lucid.overrideUTxOs(walletUtxos);

  const utxo = outputs.find((output) => output.address === consumer.address);

  invariant(utxo, "contract utxo missing");

  invariant(outputs.length > 0, "outputs are missing");

  return {
    tx: signed,
    utxo,
  };
};

export { deploy };
