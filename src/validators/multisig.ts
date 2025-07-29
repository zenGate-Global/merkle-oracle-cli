import {
  Constr,
  getAddressDetails,
  Network,
  UTxO,
} from "@lucid-evolution/lucid";
import { load, resolveContractPath } from "../blockchain/index.js";
import { Config } from "../config.js";
import { AssetName, loadProvider } from "../inputs.js";
import { Validator } from "./validator.js";

type ContractParams = [AssetName, Constr<string | bigint>];

class Multisig extends Validator<ContractParams> {
  get singletonAssetName() {
    return this.$params[0];
  }

  get outRef() {
    return this.$params[1];
  }

  static async create(singletonName: AssetName, input: UTxO, network: Network) {
    const validatedSingletonName = AssetName.assert(singletonName);
    const outRef = new Constr(0, [input.txHash, BigInt(input.outputIndex)]);

    const contractParams: ContractParams = [validatedSingletonName, outRef];

    const multisigPlutusPath = await resolveContractPath("multisig");

    const script = await load(
      "palm_multisig.palm_multisig.spend",
      contractParams,
      multisigPlutusPath,
    );
    return new this(network, script, contractParams);
  }

  static async read(
    txHash: string,
    config: Config,
  ): Promise<{ utxo: UTxO; multisig: Multisig }> {
    const [utxo] = await this.findReference(txHash, config);
    return {
      utxo,
      multisig: this.readFromUtxo(utxo),
    };
  }

  private static readFromUtxo(utxo: UTxO) {
    if (!utxo.scriptRef) throw new Error("UTXO must have reference script");
    return new this(
      getAddressDetails(utxo.address).networkId == 1 ? "Mainnet" : "Preview",
      utxo.scriptRef,
      [] as unknown as ContractParams, // we are NOT using reference utxo, rather than actual genesis utxo
    );
  }

  static async findReference(txHash: string, config: Config) {
    const provider = loadProvider(config);
    if (!provider) throw new Error("Couldn't load provider");
    const utxos = await provider.provider.getUtxosByOutRef([
      { txHash, outputIndex: 0 },
    ]);
    if (utxos.length !== 1) throw new Error("Couldn't find reference UTXO");
    return utxos as [UTxO];
  }
}

export { Multisig };
