import { Constr, getAddressDetails, UTxO } from "@lucid-evolution/lucid";
import { load, resolveContractPath } from "../blockchain/index.js";
import { AssetName } from "../inputs.js";
import { MintingValidator } from "./minting-validator.js";

type ContractParams = [AssetName, Constr<string | bigint>];

class MultisigSingleton extends MintingValidator<ContractParams> {
  get singletonAssetName() {
    return this.$params[0];
  }

  get outRef() {
    return this.$params[1];
  }

  static async create(singletonName: AssetName, input: UTxO) {
    const validatedSingletonName = AssetName.assert(singletonName);

    const outRef = new Constr(0, [input.txHash, BigInt(input.outputIndex)]);

    const params: ContractParams = [validatedSingletonName, outRef];

    // Dynamically resolve the path to the multisig plutus.json file
    const multisigPlutusPath = await resolveContractPath("multisig");

    const policy = await load(
      "palm_multisig.palm_multisig.mint",
      params,
      multisigPlutusPath,
    );
    return new this(
      getAddressDetails(input.address).networkId == 1 ? "Mainnet" : "Preview",
      policy,
      singletonName,
      params,
    );
  }
}

export { MultisigSingleton };
