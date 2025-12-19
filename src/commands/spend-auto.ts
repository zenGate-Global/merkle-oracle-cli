import { type } from "arktype";
import loadConfig from "../config.js";
import { consumerSpend } from "../consumer/spend.js";
import { saveSubmittedTxArtifact } from "../deployments.js";
import { createWallet, logExit, TxHash } from "../inputs.js";

const SpendOptions = type({
  genesisTxHash: TxHash,
  withdrawAddress: "string",
  itemId: "string",
  itemKey: "string",
  apiBaseUrl: "string",
  submit: "boolean",
});

const spendAuto = async ($options: object) => {
  const options = SpendOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const genesisTxHash = TxHash.assert(options.genesisTxHash);
  const itemId = options.itemId;
  const itemKey = options.itemKey;
  const apiBaseUrl = options.apiBaseUrl;

  const response = await fetch(
    `${apiBaseUrl}/objects/${itemId}/keys/${itemKey}`,
  );
  const itemData = await response.json();
  const itemKeyHash = itemData["keyHash"];
  const itemValueStr = itemData["value"] as string;

  const proofResponse = await fetch(`${apiBaseUrl}/keys/${itemKeyHash}`);
  const proofData = await proofResponse.json();
  const membershipProof = proofData["proof"];

  // Parse fraction like "2311/100" into tuple of bigints
  const fractionParts = itemValueStr.split("/");
  if (fractionParts.length !== 2) {
    throw new Error(
      `Invalid fraction format: ${itemValueStr}. Expected format: "numerator/denominator"`,
    );
  }

  const itemValue: [bigint, bigint] = [
    BigInt(fractionParts[0]),
    BigInt(fractionParts[1]),
  ];

  const config = loadConfig();
  const wallet = await createWallet(config);
  if (!wallet) return;
  const { lucid, address } = wallet;

  const result = await consumerSpend(
    genesisTxHash,
    options.withdrawAddress,
    itemKeyHash,
    itemValue,
    membershipProof,
    lucid,
    config,
  );

  if (!result) return;
  const { tx } = result;

  if (options.submit) {
    const txCbor = tx.toCBOR();
    const txHash = TxHash.assert(await tx.submit());
    console.log("Transaction hash:", txHash);

    await saveSubmittedTxArtifact({
      category: "consumer",
      command: "spend-auto",
      network: config.network,
      walletAddress: address,
      txHash,
      txCbor,
      inputs: {
        genesisTxHash: options.genesisTxHash,
        withdrawAddress: options.withdrawAddress,
        itemId: options.itemId,
        itemKey: options.itemKey,
        apiBaseUrl: options.apiBaseUrl,
      },
      outputs: {
        resolvedItemKeyHash: itemKeyHash,
        resolvedItemValue: itemValueStr,
        resolvedMembershipProof: membershipProof,
      },
    });
    return;
  }

  console.log("Built consumer spend tx:", tx.toHash());
};

export { spendAuto };
