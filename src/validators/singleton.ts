import { Constr, Data, getAddressDetails, UTxO } from "@lucid-evolution/lucid";
import { load, resolveContractPath } from "../blockchain/index.js";
import { AssetName } from "../inputs.js";
import { invariant } from "../invariant.js";
import { MintingValidator } from "./minting-validator.js";

type ContractParams = [AssetName, Constr<string | bigint>];

class Singleton extends MintingValidator<ContractParams> {
  get singletonAssetName() {
    return this.$params[0];
  }

  get outRef() {
    return this.$params[1];
  }

  static async create(singletonName: AssetName, input: UTxO) {
    const validatedSingletonName = AssetName.assert(singletonName);

    const outRef = new Constr(0, [input.txHash, BigInt(input.outputIndex)]);

    const oraclePlutusPath = await resolveContractPath("oracle");

    const params: ContractParams = [validatedSingletonName, outRef];
    const policy = await load(
      "merkle_oracle.merkle_oracle.mint",
      params,
      oraclePlutusPath,
    );
    return new this(
      getAddressDetails(input.address).networkId == 1 ? "Mainnet" : "Preview",
      policy,
      singletonName,
      params,
    );
  }

  static read(utxo: UTxO) {
    invariant(utxo.datum, "UTXO must have datum");
    const params = Data.from(utxo.datum) as ContractParams;

    if (!utxo.scriptRef) throw new Error("UTXO must have reference script");
    return new this(
      getAddressDetails(utxo.address).networkId == 1 ? "Mainnet" : "Preview",
      utxo.scriptRef,
      "", // unable to know the name of the token without lookup
      params,
    );
  }
}

export { Singleton };
