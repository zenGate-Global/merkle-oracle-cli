import { type } from "arktype";
import loadConfig from "../config.js";
import {
  AssetName,
  createWallet,
  logExit,
  PolicyId,
  TxHash,
  VerificationKey,
} from "../inputs.js";
import { changeAdmin } from "../merkle-oracle/change_admin.js";

const ChangeAdminOptions = type({
  genesisTxHash: TxHash,
  newAdminPolicyId: PolicyId,
  newAdminAssetName: AssetName,
  requiredSigners: VerificationKey.array(),
  submit: "boolean",
});

const changeAdminCommand = async ($options: object) => {
  const options = ChangeAdminOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const wallet = await createWallet(loadConfig());
  if (!wallet) return;
  const { lucid } = wallet;

  const result = await changeAdmin(
    options.genesisTxHash,
    options.newAdminPolicyId,
    options.newAdminAssetName,
    options.requiredSigners,
    lucid,
    loadConfig(),
  );

  if (result && options.submit) {
    const txHash = await result.tx.submit();
    console.log(`Transaction submitted: ${txHash}`);
  }
};

export { changeAdminCommand };
