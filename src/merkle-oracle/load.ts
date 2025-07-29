import { type } from "arktype";
import { Err, isProblem, Ok } from "ts-handling";
import { parseMerkleOracleDatumSafe } from "../blockchain/index.js";
import type { ConfigParams } from "../config.js";
import loadConfig from "../config.js";
import { loadProvider, TxHash } from "../inputs.js";
import { MerkleOracle } from "../validators/index.js";

const loadFromTx = async (txHash: TxHash, config: ConfigParams) => {
  const validatedTxHash = TxHash(txHash);
  if (validatedTxHash instanceof type.errors)
    return Err(`tx-hash ${validatedTxHash.summary}`);

  const validatedConfig = loadConfig(config);
  const provider = loadProvider(validatedConfig);

  const merkleOracle = await MerkleOracle.read(
    validatedTxHash,
    validatedConfig,
  );
  const genesisUtxo = await provider.provider.getUtxosByOutRef([
    { txHash: validatedTxHash, outputIndex: 0 },
  ]);

  const singletonEntry = Object.entries(genesisUtxo[0].assets).find(
    ([_unit, quantity]) => quantity === 1n,
  );
  const singleton = singletonEntry
    ? { asset: singletonEntry[0], quantity: singletonEntry[1] }
    : undefined;
  if (!singleton) return Err("could not find singleton");

  return Ok({
    merkleOracle,
    singleton: {
      name: singleton.asset.substring(56),
      policy: singleton.asset.substring(0, 56),
      unit: singleton.asset,
    },
    genesisUtxo: genesisUtxo[0],
  });
};

const loadStateFromTx = async (txHash: TxHash, config: ConfigParams) => {
  const data = (await loadFromTx(txHash, config)).unwrap();
  if (isProblem(data)) return Err(data.error);

  const validatedConfig = loadConfig(config);
  const { provider } = loadProvider(validatedConfig);
  const utxo = await provider.getUtxoByUnit(data.singleton.unit);
  if (!utxo.datum) return Err("UTXO is missing datum");
  const state = parseMerkleOracleDatumSafe(utxo.datum);
  if (state instanceof type.errors)
    return Err(`invalid datum: ${state.summary}`);

  return Ok({ ...data, utxo, ...state });
};

export { loadFromTx, loadStateFromTx };
