import { readFileSync } from "fs";
import { Network as LucidNetwork } from "@lucid-evolution/lucid";
import { type } from "arktype";
import { mnemonicToEntropy } from "bip39";

const KeyRegex = /^(mainnet|preview)\w{32}$/;
const BlockfrostApiKey = type(KeyRegex);
type BlockfrostApiKey = typeof BlockfrostApiKey.infer;
type Network = "mainnet" | "preview";
const KeyToNetwork = type(KeyRegex).pipe(
  (key) => key.match(KeyRegex)![1] as Network,
);

const Seed = type(/^(\w+ )+\w+$/).narrow((seed, ctx) => {
  try {
    mnemonicToEntropy(seed);
    return true;
  } catch {
    return ctx.mustBe("valid mnemonic");
  }
});
type Seed = typeof Seed.infer;

type ConfigParams = {
  blockfrostApiKey?: BlockfrostApiKey;
  readyPath?: string;
  walletMnemonic?: Seed;
  configPath?: string;
};

const load = (config: ConfigParams = {}) => {
  // Try to load from config.json
  let fileConfig: Partial<ConfigParams> = {};
  const configPath = config.configPath || "config.json";

  try {
    const configFile = readFileSync(configPath, "utf-8");
    fileConfig = JSON.parse(configFile);
  } catch (error) {
    if (config.configPath) {
      // If a specific config path was provided but couldn't be read, that's an error
      console.error(`Failed to read config file at ${configPath}:`, error);
      process.exit(1);
    }
    // If default config.json doesn't exist, that's fine - continue with env vars
  }

  const blockfrostApiKey = BlockfrostApiKey(
    config.blockfrostApiKey ||
      fileConfig.blockfrostApiKey ||
      process.env["BLOCKFROST_API_KEY"],
  );
  if (blockfrostApiKey instanceof type.errors)
    logExit("BLOCKFROST_API_KEY", blockfrostApiKey);

  const walletMnemonic = Seed(
    config.walletMnemonic ||
      fileConfig.walletMnemonic ||
      process.env["WALLET_MNEMONIC"],
  );
  if (walletMnemonic instanceof type.errors)
    logExit("WALLET_MNEMONIC", walletMnemonic);

  const network = KeyToNetwork.assert(blockfrostApiKey);
  const lucidNetwork: LucidNetwork =
    network === "mainnet" ? "Mainnet" : "Preview";

  return {
    blockfrostApiKey,
    lucidNetwork,
    network,
    readyPath: config.readyPath || fileConfig.readyPath || ".ready",
    walletMnemonic,
  };
};

function logExit(name: string, message: { summary: string }): never {
  console.error(name, message.summary);
  process.exit(1);
}

type Config = ReturnType<typeof load>;

export default load;
export { BlockfrostApiKey, Config, ConfigParams, KeyToNetwork, Seed };
