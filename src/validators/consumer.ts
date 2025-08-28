import { getAddressDetails, Network, UTxO } from "@lucid-evolution/lucid";
import {
  load,
  parseConsumerDeployDatum,
  resolveContractPath,
} from "../blockchain/index.js";
import { Config } from "../config.js";
import { AssetName, loadProvider, PolicyId } from "../inputs.js";
import { Validator } from "./validator.js";

type ContractParams = [PolicyId, AssetName, bigint];

class Consumer extends Validator<ContractParams> {
  get oraclePolicyId() {
    return this.$params[0];
  }

  get oracleAssetName() {
    return this.$params[1];
  }

  get threshold() {
    return this.$params[2];
  }

  static async create(
    oraclePolicyId: PolicyId,
    oracleSingletonName: AssetName,
    threshold: bigint,
    network: Network,
  ) {
    const validatedOraclePolicyId = PolicyId.assert(oraclePolicyId);
    const validatedOracleSingletonName = AssetName.assert(oracleSingletonName);

    const contractParams: ContractParams = [
      validatedOraclePolicyId,
      validatedOracleSingletonName,
      threshold,
    ];

    const consumerPlutusPath = await resolveContractPath("consumer");

    const script = await load(
      "oracle_consumer.oracle_consumer_validator.spend",
      contractParams,
      consumerPlutusPath,
    );
    return new this(network, script, contractParams);
  }

  static async read(
    txHash: string,
    config: Config,
  ): Promise<{ utxo: UTxO; consumer: Consumer }> {
    const [utxo] = await this.findReference(txHash, config);
    return {
      utxo,
      consumer: this.readFromUtxo(utxo),
    };
  }

  private static readFromUtxo(utxo: UTxO) {
    if (!utxo.scriptRef) throw new Error("UTXO must have reference script");
    if (!utxo.datum) throw new Error("UTXO must have datum");

    const datum = parseConsumerDeployDatum(utxo.datum);

    return new this(
      getAddressDetails(utxo.address).networkId == 1 ? "Mainnet" : "Preview",
      utxo.scriptRef,
      [
        PolicyId.assert(datum.oraclePolicyId),
        AssetName.assert(datum.oracleAssetName),
        datum.threshold,
      ],
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

export { Consumer };
