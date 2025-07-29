import { type } from "arktype";
import { Err, isProblem, Ok } from "ts-handling";
import { parseMultisigDatumSafe } from "../blockchain/index.js";
import type { ConfigParams } from "../config.js";
import loadConfig from "../config.js";
import { loadProvider, TxHash } from "../inputs.js";
import { Multisig } from "../validators/multisig.js";

const loadFromTx = async (txHash: TxHash, config: ConfigParams) => {
  const validatedTxHash = TxHash(txHash);
  if (validatedTxHash instanceof type.errors)
    return Err(`tx-hash ${validatedTxHash.summary}`);

  const validatedConfig = loadConfig(config);
  const { utxo, multisig } = await Multisig.read(
    validatedTxHash,
    validatedConfig,
  );
  const singletonEntry = Object.entries(utxo.assets).find(
    ([_unit, amount]) => amount === BigInt(1),
  );
  if (!singletonEntry) return Err("could not find singleton");

  const [singletonUnit] = singletonEntry;
  return Ok({
    multisig,
    singleton: {
      name: singletonUnit.substring(56),
      policy: singletonUnit.substring(0, 56),
      token: singletonUnit,
    },
    genesisUtxo: utxo,
  });
};

const loadStateFromTx = async (txHash: TxHash, config: ConfigParams) => {
  const data = (await loadFromTx(txHash, config)).unwrap();
  if (isProblem(data)) return Err(data.error);

  const validatedConfig = loadConfig(config);
  const { provider } = loadProvider(validatedConfig);
  const utxo = await provider.getUtxoByUnit(data.singleton.token);

  if (!utxo.datum) return Err("UTXO is missing datum");
  const state = parseMultisigDatumSafe(utxo.datum);
  if (state instanceof type.errors)
    return Err(`invalid datum: ${state.summary}`);

  return Ok({ ...data, ...state, utxo });
};

const loadStateFromSingleton = async (unit: string, config: ConfigParams) => {
  const validatedConfig = loadConfig(config);
  const { provider } = loadProvider(validatedConfig);
  const utxo = await provider.getUtxoByUnit(unit);

  if (!utxo.datum) return Err("UTXO is missing datum");
  const state = parseMultisigDatumSafe(utxo.datum);
  if (state instanceof type.errors)
    return Err(`invalid datum: ${state.summary}`);

  return Ok({ ...state, utxo });
};

export { loadFromTx, loadStateFromTx, loadStateFromSingleton };
