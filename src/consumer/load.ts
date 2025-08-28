import { type } from "arktype";
import { Err, isProblem, Ok } from "ts-handling";
import type { ConfigParams } from "../config.js";
import loadConfig from "../config.js";
import { loadProvider, TxHash } from "../inputs.js";
import { Consumer } from "../validators/consumer.js";

const loadFromTx = async (txHash: TxHash, config: ConfigParams) => {
  const validatedTxHash = TxHash(txHash);
  if (validatedTxHash instanceof type.errors)
    return Err(`tx-hash ${validatedTxHash.summary}`);

  const validatedConfig = loadConfig(config);
  const { utxo, consumer } = await Consumer.read(
    validatedTxHash,
    validatedConfig,
  );

  return Ok({
    consumer,
    referenceUtxo: utxo,
  });
};

const loadStateFromTx = async (txHash: TxHash, config: ConfigParams) => {
  const data = (await loadFromTx(txHash, config)).unwrap();
  if (isProblem(data)) return Err(data.error);

  const validatedConfig = loadConfig(config);
  const { provider } = loadProvider(validatedConfig);
  const utxo = await provider.getUtxosByOutRef([{ txHash, outputIndex: 0 }]);

  if (utxo.length !== 1) return Err("Couldn't find UTXO");

  return Ok({ ...data, utxo: utxo[0] });
};

export { loadFromTx, loadStateFromTx };
