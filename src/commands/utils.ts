import { Blockfrost, getAddressDetails, Lucid } from "@lucid-evolution/lucid";
import { type } from "arktype";
import loadConfig from "../config.js";
import { logExit } from "../inputs.js";

const AddressOptions = type({
  index: type("string.integer").pipe((v) => parseInt(v, 10)),
});

const address = async ($options: object) => {
  const options = AddressOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const config = loadConfig();

  const provider = new Blockfrost(
    `https://cardano-${config.network}.blockfrost.io/api/v0`,
    config.blockfrostApiKey,
  );

  const lucid = await Lucid(provider, config.lucidNetwork);
  lucid.selectWallet.fromSeed(config.walletMnemonic, {
    accountIndex: options.index,
  });

  const walletAddress = await lucid.wallet().address();
  console.log(`Address (index ${options.index}): ${walletAddress}`);
};

const addressInfo = async ($options: object) => {
  const options = AddressOptions($options);
  if (options instanceof type.errors) return logExit(options.summary);

  const config = loadConfig();

  const provider = new Blockfrost(
    `https://cardano-${config.network}.blockfrost.io/api/v0`,
    config.blockfrostApiKey,
  );

  const lucid = await Lucid(provider, config.lucidNetwork);
  lucid.selectWallet.fromSeed(config.walletMnemonic, {
    accountIndex: options.index,
  });

  const walletAddress = await lucid.wallet().address();
  const details = getAddressDetails(walletAddress);

  console.log(`\nAddress Info (index ${options.index}):`);
  console.log(`${"─".repeat(50)}`);
  console.log(`Address:            ${walletAddress}`);
  console.log(
    `Network ID:         ${details.networkId === 1 ? "Mainnet" : "Preview/Testnet"}`,
  );
  console.log(`Address Type:       ${details.type}`);

  if (details.paymentCredential) {
    console.log(`\nPayment Credential:`);
    console.log(`  Type:             ${details.paymentCredential.type}`);
    console.log(`  Hash:             ${details.paymentCredential.hash}`);
  }

  if (details.stakeCredential) {
    console.log(`\nStake Credential:`);
    console.log(`  Type:             ${details.stakeCredential.type}`);
    console.log(`  Hash:             ${details.stakeCredential.hash}`);
  }

  if (details.address.hex) {
    console.log(`\nRaw Address (hex):  ${details.address.hex}`);
  }
};

export { address, addressInfo };
