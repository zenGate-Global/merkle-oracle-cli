# Merkle Oracle CLI

Command-line interface for deploying and managing merkle oracle contract, multisig contract, and the oracle consumer contract. 

- Merkle Oracle Contracts: https://github.com/zenGate-Global/merkle-oracle-contracts
- MultiSig Contract: https://github.com/zenGate-Global/palm-multisig-aiken
- Oracle Consumer Contract: https://github.com/zenGate-Global/oracle-consumer

## Overview

This CLI tool provides commands for:
- **Oracle Management**: Deploy and manage merkle oracle contracts
- **Multisig Operations**: Deploy and configure multisig contracts  
- **Consumer Contracts**: Deploy consumer contracts and spend from them

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# set up cli
pnpm link --global
# alternatively you can run pnpm exec merkle-oracle-cli <command> [options]
# if you dont want to make the command global

# Run CLI commands
merkle-oracle-cli <command> [options]
```

## Command Reference

Make sure you have a config.json file in the root of the project.
```json
{
  "blockfrostApiKey": "your_blockfrost_api_key",
  "walletMnemonic": "your_wallet_mnemonic"
}
```

This must be filled out!

### Oracle Management

#### `genesis`
Deploys a new merkle oracle contract.

```bash
merkle-oracle-cli genesis [options]
```

**Options:**
- `--singleton-name <name>` - Name of the singleton token (default: "merkle_oracle_singleton")
- `--admin-policy-id <id>` - Policy ID of the admin token
- `--admin-asset-name <name>` - Asset name of the admin token
- `--ipfs-cid <cid>` - IPFS CID for the oracle data (default: NULL_TRIE_HASH)
- `--tree-root <root>` - Merkle tree root hash (default: NULL_TRIE_HASH)
- `--submit` - Submit the transaction on-chain (default: false)

Note: currently the contract forces ipfs and tree root to be set to the null trie hash for genesis.

**Example:**
```bash
merkle-oracle-cli genesis \
  --admin-policy-id "abc123..." \
  --admin-asset-name "admin_token" \
  --ipfs-cid "QmHash..." \
  --tree-root "0x123abc..." \
  --submit
```

#### `recreate`
Recreates an existing merkle oracle contract with new data.

```bash
merkle-oracle-cli recreate [options]
```

**Options:**
- `--required-signers <signers...>` - Array of required signer addresses for partial signing
- `--new-merkle-root-hash <hash>` - New merkle root hash
- `--new-ipfs-cid <cid>` - New IPFS CID
- `--genesis-tx-hash <hash>` - Genesis transaction hash
- `--submit` - Submit the transaction on-chain (default: false)

**Example:**
```bash
merkle-oracle-cli recreate \
  --genesis-tx-hash "abc123..." \
  --new-merkle-root-hash "0x456def..." \
  --new-ipfs-cid "QmNewHash..." \
  --required-signers "addr1..." "addr2..." \
  --submit
```

#### `change-admin`
Changes the admin for a merkle oracle contract.

```bash
merkle-oracle-cli change-admin [options]
```

**Options:**
- `--genesis-tx-hash <hash>` - Genesis transaction hash
- `--new-admin-policy-id <id>` - New admin policy ID
- `--new-admin-asset-name <name>` - New admin asset name
- `--required-signers <signers...>` - Array of required signer vfks for partial signing
- `--submit` - Submit the transaction on-chain (default: false)

**Example:**
```bash
merkle-oracle-cli change-admin \
  --genesis-tx-hash "abc123..." \
  --new-admin-policy-id "def456..." \
  --new-admin-asset-name "new_admin_token" \
  --required-signers "vfk1..." \
  --submit
```

#### `singleton-withdraw`
Withdraws a singleton token to a specified address.

```bash
merkle-oracle-cli singleton-withdraw [options]
```

**Options:**
- `--genesis-tx-hash <hash>` - Genesis transaction hash
- `--withdraw-address <address>` - Address to withdraw the singleton to
- `--required-signers <signers...>` - Array of required signer vfks for partial signing
- `--submit` - Submit the transaction on-chain (default: false)

**Example:**
```bash
merkle-oracle-cli singleton-withdraw \
  --genesis-tx-hash "abc123..." \
  --withdraw-address "addr_withdraw..." \
  --required-signers "vfk1..." "vfk2..." \
  --submit
```

### Multisig Operations

#### `deploy`
Deploys a new multisig contract.

```bash
merkle-oracle-cli deploy [options]
```

**Options:**
- `--singleton-name <name>` - Name of the singleton token (default: "multisig_singleton")
- `--threshold <number>` - Threshold number of signatures required
- `--signatures <signatures...>` - Array of signature addresses
- `--submit` - Submit the transaction on-chain (default: false)

**Example:**
```bash
merkle-oracle-cli deploy \
  --threshold 2 \
  --signatures "vfk1..." "vfk2..." "vfk3..." \
  --submit
```

#### `change-signatures`
Changes the signatures for a multisig contract.

```bash
merkle-oracle-cli change-signatures [options]
```

**Options:**
- `--genesis-tx-hash <hash>` - Genesis transaction hash
- `--required-signers <signers...>` - Array of required signer vfks for partial signing
- `--signatures <signatures...>` - Array of new signature addresses
- `--submit` - Submit the transaction on-chain (default: false)

**Example:**
```bash
merkle-oracle-cli change-signatures \
  --genesis-tx-hash "abc123..." \
  --signatures "vfk1..." "vfk2..." "vfk3..." \
  --required-signers "vfk1..." "vfk2..." \
  --submit
```

#### `change-threshold`
Changes the threshold for a multisig contract.

```bash
merkle-oracle-cli change-threshold [options]
```

**Options:**
- `--genesis-tx-hash <hash>` - Genesis transaction hash
- `--required-signers <signers...>` - Array of required signer vfks for partial signing
- `--threshold <number>` - New threshold number of signatures required
- `--submit` - Submit the transaction on-chain (default: false)

**Example:**
```bash
merkle-oracle-cli change-threshold \
  --genesis-tx-hash "abc123..." \
  --threshold 3 \
  --required-signers "vfk1..." "vfk2..." \
  --submit
```

#### `add-signature`
Adds a signature to a multisig transaction and submits if all signatures are met.

```bash
merkle-oracle-cli add-signature [options]
```

**Options:**
- `--multisig-file <path>` - Path to the multisig JSON file
- `--submit` - Submit the transaction on-chain (default: false)

**Example:**
```bash
merkle-oracle-cli add-signature \
  --multisig-file "./multisig.sign.json" \
  --submit
```

### Consumer Contract

#### `deploy-consumer`
Deploys a consumer contract that can interact with the oracle.

```bash
merkle-oracle-cli deploy-consumer [options]
```

**Options:**
- `--oracle-policy-id <id>` - Policy ID of the oracle token
- `--oracle-asset-name <name>` - Asset name of the oracle token
- `--lovelace-to-lock <amount>` - Amount of lovelace to lock
- `--threshold <number>` - Threshold number required
- `--should-deploy-script` - Deploy the consumer script on-chain (default: false)
- `--submit` - Submit the transaction on-chain (default: false)

**Example:**
```bash
merkle-oracle-cli deploy-consumer \
  --oracle-policy-id "abc123..." \
  --oracle-asset-name "oracle_token" \
  --lovelace-to-lock 2000000 \
  --threshold 1 \
  --should-deploy-script \
  --submit
```

#### `spend`
Spends from a consumer contract using merkle proof verification.

```bash
merkle-oracle-cli spend [options]
```

**Options:**
- `--genesis-tx-hash <hash>` - Genesis transaction hash
- `--withdraw-address <address>` - Address to withdraw funds to
- `--item-key-hash <hash>` - Item key hash
- `--item-value <value>` - Item value in format 'value1,value2'
- `--membership-proof <proof>` - Merkle membership proof hex string
- `--submit` - Submit the transaction on-chain (default: false)

**Example:**
```bash
merkle-oracle-cli spend \
  --genesis-tx-hash "abc123..." \
  --withdraw-address "addr_withdraw..." \
  --item-key-hash "0x789ghi..." \
  --item-value "100,200" \
  --membership-proof "deadbeef" \
  --submit
```

#### `spend-auto`
Automatically spends from consumer contract by fetching data from API.

```bash
merkle-oracle-cli spend-auto [options]
```

**Options:**
- `--genesis-tx-hash <hash>` - Genesis transaction hash
- `--withdraw-address <address>` - Address to withdraw funds to
- `--item-id <id>` - Item ID to fetch from the API
- `--item-key <key>` - Item key to fetch from the API
- `--api-base-url <url>` - Base URL of the API
- `--submit` - Submit the transaction on-chain (default: false)

**Example:**
```bash
merkle-oracle-cli spend-auto \
  --genesis-tx-hash "abc123..." \
  --withdraw-address "addr_withdraw..." \
  --item-id "item_001" \
  --item-key "price" \
  --api-base-url "https://api.example.com" \
  --submit
```

## Configuration

### Setup Configuration File

Copy the example configuration file and customize it:

```bash
cp config.json.example config.json
```

Edit `config.json` with your specific settings:
- Network configuration (mainnet/testnet)
- Node endpoints
- Wallet settings
- Contract addresses

### Multisig Configuration

For multisig operations, you may need a multisig configuration file:

```bash
cp multisig.sign.json.example multisig.sign.json
```

## Workflow Examples

### Basic Oracle Deployment Workflow

1. **Deploy Oracle Contract**
   ```bash
   merkle-oracle-cli genesis \
     --admin-policy-id "your_admin_policy_id" \
     --admin-asset-name "admin_token" \
     --submit
   ```

2. **Deploy Consumer Contract**
   ```bash
   merkle-oracle-cli deploy-consumer \
     --oracle-policy-id "oracle_policy_from_genesis" \
     --oracle-asset-name "merkle_oracle_singleton" \
     --lovelace-to-lock 5000000 \
     --threshold 1 \
     --submit
   ```

3. **Update Oracle Data**
   ```bash
   merkle-oracle-cli recreate \
     --genesis-tx-hash "genesis_tx_hash" \
     --new-merkle-root-hash "new_data_root" \
     --new-ipfs-cid "new_ipfs_hash" \
     --submit
   ```

4. **Spend from Consumer**
   ```bash
   merkle-oracle-cli spend-auto \
     --genesis-tx-hash "genesis_tx_hash" \
     --withdraw-address "your_address" \
     --item-id "data_item_id" \
     --item-key "price" \
     --api-base-url "https://your-api.com" \
     --submit
   ```

### Multisig Workflow

1. **Deploy Multisig**
   ```bash
   merkle-oracle-cli deploy \
     --threshold 2 \
     --signatures "vfk1" "vfk2" "vfk3" \
     --submit
   ```

2. **Change Threshold (requires signatures)**
   ```bash
   merkle-oracle-cli change-threshold \
     --genesis-tx-hash "multisig_genesis_hash" \
     --threshold 3 \
     --required-signers "vfk1" "vfk2"
   ```

3. **Add Signatures**
   ```bash
   merkle-oracle-cli add-signature \
     --multisig-file "./multisig.sign.json" \
     --submit
   ```