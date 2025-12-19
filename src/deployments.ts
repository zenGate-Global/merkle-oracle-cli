import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

type DeploymentCategory = "oracle" | "multisig" | "consumer";

type DeploymentArtifact = {
  schemaVersion: 1;
  createdAt: string;
  category: DeploymentCategory;
  command: string;
  network: string;
  walletAddress: string;
  txHash: string;
  txCbor: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
};

/**
 * JSON.stringify replacer that converts bigint to string.
 */
const bigintReplacer = (_key: string, value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

/**
 * Safely stringify a value to JSON, handling bigint values.
 */
const safeJsonStringify = (value: unknown, indent = 2): string => {
  return JSON.stringify(value, bigintReplacer, indent);
};

/**
 * Saves a submitted transaction artifact to deployments/{category}/{txHash}.json.
 * Fails softly: logs a warning if writing fails but does not throw.
 */
const saveSubmittedTxArtifact = async (params: {
  category: DeploymentCategory;
  command: string;
  network: string;
  walletAddress: string;
  txHash: string;
  txCbor: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}): Promise<void> => {
  const {
    category,
    command,
    network,
    walletAddress,
    txHash,
    txCbor,
    inputs,
    outputs,
  } = params;

  const artifact: DeploymentArtifact = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    category,
    command,
    network,
    walletAddress,
    txHash,
    txCbor,
    inputs,
    outputs,
  };

  const deploymentDir = join(process.cwd(), "deployments", category);
  const filePath = join(deploymentDir, `${txHash}.json`);

  try {
    await mkdir(deploymentDir, { recursive: true });
    await writeFile(filePath, safeJsonStringify(artifact), "utf-8");
    console.log(`Deployment artifact saved to: ${filePath}`);
  } catch (error) {
    console.warn(
      `Warning: Failed to save deployment artifact to ${filePath}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
};

export { DeploymentCategory, saveSubmittedTxArtifact, safeJsonStringify };
