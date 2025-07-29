import { access, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  applyParamsToScript,
  Data,
  Exact,
  Script,
} from "@lucid-evolution/lucid";
import { type } from "arktype";

const here = path.dirname(fileURLToPath(import.meta.url));

const Json = type("string").pipe((json, ctx) => {
  try {
    return JSON.parse(json);
  } catch {
    return ctx.error("valid JSON");
  }
});

const Validator = type({
  title: "string",
  compiledCode: "string.hex",
});

const Plutus = type({
  validators: Validator.array(),
});

const PlutusJson = Json.pipe(Plutus);

const load = async <T extends unknown[] = Data[]>(
  name: string,
  params: Exact<[...T]>,
  plutusPath?: string,
) => {
  const resolvedPath = plutusPath || (await resolvePlutusPath());
  const contents = await readFile(resolvedPath, "utf-8");
  const plutus = PlutusJson.assert(contents);
  const validator = plutus.validators.find(
    (validator) => validator.title === name,
  );
  if (!validator) throw new Error("Validator not found");
  const code = validator.compiledCode;

  const script: Script = {
    type: "PlutusV3",
    script: applyParamsToScript(code, params),
  };

  return script;
};

const resolvePlutusPath = async () => {
  const localPath = path.join(here, "..", "plutus.json");

  try {
    await access(localPath);
    return localPath;
  } catch {
    return path.join(here, "..", "..", "plutus.json");
  }
};

/**
 * Resolves the path to a contract's plutus.json file, working in both
 * development (src/) and production (dist/) environments.
 */
const resolveContractPath = async (
  contractName: "oracle" | "multisig",
): Promise<string> => {
  // try the dist path
  const distPath = path.join(
    here,
    "..",
    "contracts",
    contractName,
    "plutus.json",
  );

  try {
    await access(distPath);
    return distPath;
  } catch {
    // try the src path
    const srcPath = path.join(
      here,
      "..",
      "..",
      "contracts",
      contractName,
      "plutus.json",
    );
    return srcPath;
  }
};

export { load, resolveContractPath };
