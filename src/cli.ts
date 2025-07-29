import { Command } from "commander";
import {
  addSignatureCommand,
  changeAdminCommand,
  changeSignaturesCommand,
  changeThresholdCommand,
  deploy,
  genesis,
  recreate,
  singletonWithdrawCommand,
} from "./commands/index.js";

const program = new Command();
program.description("CLI for merkle oracle");

program
  .command("genesis")
  .description("deploys merkle oracle")
  .option(
    "--singleton-name <name>",
    "The name of the singleton token",
    "merkle_oracle_singleton",
  )
  .option("--admin-policy-id <id>", "The policy ID of the admin token")
  .option("--admin-asset-name <name>", "The asset name of the admin token")
  .option("--ipfs-cid <cid>", "The IPFS CID")
  .option("--tree-root <root>", "The merkle tree root hash")
  .option("--submit", "Set flag to submit the tx on-chain", false)
  .action(genesis);

program
  .command("recreate")
  .description("Recreates merkle oracle contract")
  .option(
    "--required-signers <signers...>",
    "Array of required signer addresses for partial signing",
  )
  .option("--new-merkle-root-hash <hash>", "The new merkle root hash")
  .option("--new-ipfs-cid <cid>", "The new IPFS CID")
  .option("--genesis-tx-hash <hash>", "The genesis TX hash")
  .option("--submit", "Set flag to submit the tx on-chain", false)
  .action(recreate);

program
  .command("change-admin")
  .description("Changes admin for merkle oracle")
  .option("--genesis-tx-hash <hash>", "The genesis TX hash")
  .option("--new-admin-policy-id <id>", "The new admin policy ID")
  .option("--new-admin-asset-name <name>", "The new admin asset name")
  .option(
    "--required-signers <signers...>",
    "Array of required signer addresses for partial signing",
  )
  .option("--submit", "Set flag to submit the tx on-chain", false)
  .action(changeAdminCommand);

program
  .command("deploy")
  .description("Deploys multisig contract")
  .option(
    "--singleton-name <name>",
    "The name of the singleton token",
    "multisig_singleton",
  )
  .option("--threshold <number>", "The threshold number of signatures required")
  .option("--signatures <signatures...>", "Array of signature addresses")
  .option("--submit", "Set flag to submit the tx on-chain", false)
  .action(deploy);

program
  .command("change-signatures")
  .description("Changes the signatures for multisig contract")
  .option("--genesis-tx-hash <hash>", "The genesis TX hash")
  .option(
    "--required-signers <signers...>",
    "Array of required signer addresses for partial signing",
  )
  .option("--signatures <signatures...>", "Array of new signature addresses")
  .option("--submit", "Set flag to submit the tx on-chain", false)
  .action(changeSignaturesCommand);

program
  .command("change-threshold")
  .description("Changes the threshold for multisig contract")
  .option("--genesis-tx-hash <hash>", "The genesis TX hash")
  .option(
    "--required-signers <signers...>",
    "Array of required signer addresses for partial signing",
  )
  .option(
    "--threshold <number>",
    "The new threshold number of signatures required",
  )
  .option("--submit", "Set flag to submit the tx on-chain", false)
  .action(changeThresholdCommand);

program
  .command("add-signature")
  .description(
    "Adds a signature to a multisig transaction and submits if all signatures are met",
  )
  .option("--multisig-file <path>", "Path to the multisig JSON file")
  .option("--submit", "Set flag to submit the tx on-chain", false)
  .action(addSignatureCommand);

program
  .command("singleton-withdraw")
  .description("Withdraws a singleton token to a specified address")
  .option("--genesis-tx-hash <hash>", "The genesis TX hash")
  .option(
    "--withdraw-address <address>",
    "The address to withdraw the singleton to",
  )
  .option(
    "--required-signers <signers...>",
    "Array of required signer addresses for partial signing",
  )
  .option("--submit", "Set flag to submit the tx on-chain", false)
  .action(singletonWithdrawCommand);

export default program;
