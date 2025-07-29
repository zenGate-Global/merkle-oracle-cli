import {
  Constr,
  Data,
  getAddressDetails,
  Network,
  UTxO,
} from "@lucid-evolution/lucid";
import { load, resolveContractPath } from "../blockchain/index.js";
import { Config } from "../config.js";
import { AssetName, loadProvider } from "../inputs.js";
import { invariant } from "../invariant.js";
import { Validator } from "./validator.js";

type ContractParams = [AssetName, Constr<string | bigint>];

class MerkleOracle extends Validator<ContractParams> {
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

    // Dynamically resolve the path to the oracle plutus.json file
    const oraclePlutusPath = await resolveContractPath("oracle");

    const script = await load(
      "merkle_oracle.merkle_oracle.spend",
      contractParams,
      oraclePlutusPath,
    );
    return new this(network, script, contractParams);
  }

  static async read(txHash: string, config: Config): Promise<MerkleOracle>;
  static async read(utxo: UTxO): Promise<MerkleOracle>;
  static async read(
    txHashOrUtxo: string | UTxO,
    config?: Config,
  ): Promise<MerkleOracle> {
    if (typeof txHashOrUtxo === "object")
      return this.readFromUtxo(txHashOrUtxo);

    invariant(config, "config must be set if txHash set");
    const [utxo] = await this.findReference(txHashOrUtxo, config);
    return this.readFromUtxo(utxo);
  }

  private static readFromUtxo(utxo: UTxO) {
    if (!utxo.datum) throw new Error("UTXO must have datum");
    const params = Data.from(utxo.datum) as ContractParams;

    if (!utxo.scriptRef) throw new Error("UTXO must have reference script");
    return new this(
      getAddressDetails(utxo.address).networkId == 1 ? "Mainnet" : "Preview",
      utxo.scriptRef,
      params,
    );
  }

  static async findReference(txHash: string, config: Config) {
    const provider = loadProvider(config);
    if (!provider) throw new Error("Couldn't load provider");
    const utxos = await provider.provider.getUtxosByOutRef([
      { txHash, outputIndex: 1 },
    ]);
    if (utxos.length !== 1) throw new Error("Couldn't find reference UTXO");
    return utxos as [UTxO];
  }
}

export { MerkleOracle };
