import { type } from "arktype";
import loadConfig from "../config.js";
import { consumerSpend } from "../consumer/spend.js";
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

  const wallet = await createWallet(loadConfig());
  if (!wallet) return;
  const { lucid } = wallet;

  const result = await consumerSpend(
    genesisTxHash,
    options.withdrawAddress,
    itemKeyHash,
    itemValue,
    membershipProof,
    lucid,
    loadConfig(),
  );

  if (!result) return;
  const { tx } = result;

  if (options.submit) {
    const txHash = TxHash.assert(await tx.submit());
    console.log("Transaction hash:", txHash);
    return;
  }

  console.log("Built consumer spend tx:", tx.toHash());
};

export { spendAuto };
