import { type } from "arktype";
import loadConfig from "../config.js";
import { consumerSpend } from "../consumer/spend.js";
import { ByteArray, createWallet, logExit, TxHash } from "../inputs.js";

const SpendOptions = type({
  genesisTxHash: TxHash,
  withdrawAddress: "string",
  itemKeyHash: ByteArray,
  itemValue: "string",
  membershipProof: "string",
  submit: "boolean",
});

const spend = async ($options: object) => {
  const options = SpendOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const genesisTxHash = TxHash.assert(options.genesisTxHash);
  const itemKeyHash = ByteArray.assert(options.itemKeyHash);

  // Parse itemValue as two bigints (e.g., "123,456")
  const itemValueParts = options.itemValue.split(",");
  if (itemValueParts.length !== 2) {
    return logExit("itemValue must be in format 'value1,value2'");
  }
  const itemValue: [bigint, bigint] = [
    BigInt(itemValueParts[0].trim()),
    BigInt(itemValueParts[1].trim()),
  ];

  const wallet = await createWallet(loadConfig());
  if (!wallet) return;
  const { lucid } = wallet;

  const result = await consumerSpend(
    genesisTxHash,
    options.withdrawAddress,
    itemKeyHash,
    itemValue,
    options.membershipProof,
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

export { spend };
