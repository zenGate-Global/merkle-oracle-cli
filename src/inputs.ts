import { Blockfrost, fromText, Lucid, Provider } from "@lucid-evolution/lucid";
import { type } from "arktype";
import { Config } from "./config.js";

const Uint = type("number.integer > 0 | bigint | string.integer")
  .pipe((v, ctx) => {
    try {
      return BigInt(v);
    } catch {
      return ctx.error("valid integer");
    }
  })
  .narrow((v, ctx) => v >= 0n || ctx.mustBe("positive"));
type Uint = typeof Uint.inferIn;

const TxHash = type(/^[a-f0-9]{0,64}$/);
type TxHash = typeof TxHash.infer;

const ByteArray = type(/^[a-f0-9]{0,64}$/);
type ByteArray = typeof ByteArray.infer;

const AssetName = type("string")
  .pipe((v, ctx) => {
    if (/^[a-f0-9]+$/.test(v)) return v;

    try {
      return fromText(v);
    } catch {
      return ctx.error("valid text");
    }
  })
  .narrow((v, ctx) => v.length <= 64 || ctx.mustBe("no more than 32 bytes"));
type AssetName = typeof AssetName.infer;

const Token = type("string.hex")
  .pipe((v) => v.toLowerCase())
  .narrow((v, ctx) => v.length >= 56 || ctx.mustBe("at least 56 characters"))
  .narrow(
    (v, ctx) => v.length <= 120 || ctx.mustBe("at less than 121 characters"),
  );
type Token = typeof Token.infer;

const Hash224 = type("string.hex")
  .pipe((v) => v.toLowerCase())
  .narrow((v, ctx) => v.length === 56 || ctx.mustBe("56 characters"));

const VerificationKey = Hash224;
type VerificationKey = typeof VerificationKey.infer;

const PolicyId = Hash224;
type PolicyId = typeof PolicyId.infer;

const HexOrEmpty = type(/^([0-9a-fA-F]*|)$/);

const Hash56OrEmpty = type(/^([0-9a-fA-F]{56}|)$/);

const MultisigSignSchema = type({
  txHex: HexOrEmpty,
  requiredSigners: type(/^[0-9a-fA-F]{56}$/)
    .array()
    .narrow(
      (v, ctx) => v.length >= 1 || ctx.mustBe("at least one required signer"),
    ),
  signers: type({
    signer: Hash56OrEmpty,
    witness: "string",
  }).array(),
});
type MultisigSignSchema = typeof MultisigSignSchema.infer;

const loadProvider = (config: Config) => {
  const provider: Provider = new Blockfrost(
    `https://cardano-${config.network}.blockfrost.io/api/v0`,
    config.blockfrostApiKey,
  );
  return { provider, network: config.lucidNetwork };
};

const createWallet = async (config: Config) => {
  const { provider, network } = loadProvider(config);

  const lucid = await Lucid(provider, network);
  lucid.selectWallet.fromSeed(config.walletMnemonic);
  const address = await lucid.wallet().address();
  console.log(`connected wallet address: ${address}`);
  // const utxos = await lucid.wallet().getUtxos();
  // if (!utxos.length) return logExit(`Wallet is empty. Fund: ${address}`);

  return { lucid, network, address };
};

function logExit(message: string): void;
function logExit(name: string, message: { summary: string }): void;
function logExit(nameOrMessage: string, message?: { summary: string }): void {
  if (message) console.error(nameOrMessage, message.summary);
  else console.error(nameOrMessage);
  process.exitCode = 1;
}

export {
  AssetName,
  ByteArray,
  createWallet,
  loadProvider,
  VerificationKey,
  logExit,
  MultisigSignSchema,
  PolicyId,
  Token,
  TxHash,
  Uint,
};
