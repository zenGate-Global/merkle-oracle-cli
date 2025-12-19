import { type } from "arktype";
import loadConfig from "../config.js";
import { saveSubmittedTxArtifact } from "../deployments.js";
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

  const config = loadConfig();
  const wallet = await createWallet(config);
  if (!wallet) return;
  const { lucid, address } = wallet;

  const result = await changeAdmin(
    options.genesisTxHash,
    options.newAdminPolicyId,
    options.newAdminAssetName,
    options.requiredSigners,
    lucid,
    config,
  );

  if (result && options.submit) {
    const txCbor = result.tx.toCBOR();
    const txHash = TxHash.assert(await result.tx.submit());
    console.log(`Transaction submitted: ${txHash}`);

    await saveSubmittedTxArtifact({
      category: "oracle",
      command: "change-admin",
      network: config.network,
      walletAddress: address,
      txHash,
      txCbor,
      inputs: {
        genesisTxHash: options.genesisTxHash,
        newAdminPolicyId: options.newAdminPolicyId,
        newAdminAssetName: options.newAdminAssetName,
        requiredSigners: options.requiredSigners,
      },
      outputs: {
        utxo: result.utxo,
      },
    });
  }
};

export { changeAdminCommand };
