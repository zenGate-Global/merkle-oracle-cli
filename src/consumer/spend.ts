import { LucidEvolution } from "@lucid-evolution/lucid";
import { isProblem } from "ts-handling";
import { ConsumerSpendRedeemer } from "../blockchain/redeemers.js";
import { Config } from "../config.js";
import { ByteArray, loadProvider, logExit, TxHash } from "../inputs.js";
import { loadStateFromTx } from "./index.js";

const consumerSpend = async (
  genesisTxHash: TxHash,
  withdrawAddress: string,
  $itemKeyHash: ByteArray,
  $itemValue: [bigint, bigint],
  $membershipProof: string,
  lucid: LucidEvolution,
  config: Config,
) => {
  const result = (await loadStateFromTx(genesisTxHash, config)).unwrap();
  if (isProblem(result)) return logExit(result.error);

  const { provider } = loadProvider(config);

  const oraclePolicyId = result.consumer.oraclePolicyId;
  const oracleAssetName = result.consumer.oracleAssetName;
  const unit = oraclePolicyId + oracleAssetName;

  const oracleUtxo = await provider.getUtxoByUnit(unit);

  const redeemer = ConsumerSpendRedeemer(
    $itemKeyHash,
    $itemValue,
    $membershipProof,
  );

  const [walletUtxos, _outputs, tx] = await lucid
    .newTx()
    .collectFrom([result.utxo], redeemer)
    .pay.ToAddress(withdrawAddress, result.utxo.assets)
    .readFrom([result.referenceUtxo, oracleUtxo])
    .chain();

  const signed = await tx.sign.withWallet().complete();

  lucid.overrideUTxOs(walletUtxos);

  return {
    tx: signed,
  };
};

export { consumerSpend };
