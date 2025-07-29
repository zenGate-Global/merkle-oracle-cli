import { Constr, Data } from "@lucid-evolution/lucid";
import { Uint, VerificationKey } from "../inputs.js";

const genesisAction = new Constr(0, []);
const recreateAction = new Constr(1, []);
const changeAdminAction = new Constr(2, []);

const GenesisRedeemer = Data.to(new Constr(0, [genesisAction]));
const RecreateRedeemer = Data.to(new Constr(0, [recreateAction]));
const ChangeAdminRedeemer = Data.to(new Constr(0, [changeAdminAction]));
const SingletonWithdrawRedeemer = ($withdrawVk: VerificationKey) =>
  Data.to(
    new Constr(0, [new Constr(3, [VerificationKey.assert($withdrawVk)])]),
  );

const MultisigGenesisRedeemer = (
  $threshold: Uint,
  $signatures: Array<VerificationKey>,
) => {
  return Data.to(
    new Constr(0, [
      new Constr(0, [
        Uint.assert($threshold),
        $signatures.map((s) => new Constr(0, [VerificationKey.assert(s)])),
      ]),
    ]),
  );
};

const MultisigChangeSignaturesRedeemer = Data.to(
  new Constr(0, [recreateAction]),
);

const MultisigChangeThresholdRedeemer = Data.to(
  new Constr(0, [changeAdminAction]),
);

export {
  GenesisRedeemer,
  RecreateRedeemer,
  ChangeAdminRedeemer,
  SingletonWithdrawRedeemer,
  MultisigGenesisRedeemer,
  MultisigChangeSignaturesRedeemer,
  MultisigChangeThresholdRedeemer,
};
