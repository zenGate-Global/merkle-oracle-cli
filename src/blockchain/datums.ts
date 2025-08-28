import { Constr, Data, OutputDatum } from "@lucid-evolution/lucid";
import { type } from "arktype";
import { AssetName, ByteArray, PolicyId, Uint } from "../inputs.js";

const $MerkleOracleDatum = type({
  fields: [PolicyId, AssetName, ByteArray, 'string', Uint],
}).pipe((data) => {
  return {
    adminSingletonPolicyId: data.fields[0],
    adminSingletonAssetName: data.fields[1],
    merkleRoot: data.fields[2],
    ipfsCid: data.fields[3],
    createdAt: data.fields[4],
  };
});

const MerkleOracleDatum = (
  $adminSingletonPolicyId: PolicyId,
  $adminSingletonAssetName: AssetName,
  $merkleRoot: ByteArray,
  $ipfsCid: string,
  $createdAt: Uint,
): OutputDatum => {
  const value = Data.to(
    new Constr(0, [
      PolicyId.assert($adminSingletonPolicyId),
      AssetName.assert($adminSingletonAssetName),
      ByteArray.assert($merkleRoot),
      $ipfsCid,
      Uint.assert($createdAt),
    ]),
  );
  return { kind: "inline", value };
};

const parseMerkleOracleDatum = (datum: string) =>
  $MerkleOracleDatum.assert(Data.from(datum));

const parseMerkleOracleDatumSafe = (datum: string) =>
  $MerkleOracleDatum(Data.from(datum));

const $MultisigDatum = type({
  fields: [Uint, type({ fields: [ByteArray] }).array()],
}).pipe((data) => {
  return {
    threshold: data.fields[0],
    signatures: data.fields[1].map((sig) => sig.fields[0]),
  };
});

const MultisigDatum = (
  $threshold: Uint,
  $signatures: ByteArray[],
): OutputDatum => {
  const value = Data.to(
    new Constr(0, [
      Uint.assert($threshold),
      $signatures.map((s) => new Constr(0, [ByteArray.assert(s)])),
    ]),
  );
  return { kind: "inline", value };
};

const parseMultisigDatum = (datum: string) =>
  $MultisigDatum.assert(Data.from(datum));

const parseMultisigDatumSafe = (datum: string) =>
  $MultisigDatum(Data.from(datum));

export {
  parseMerkleOracleDatum,
  parseMerkleOracleDatumSafe,
  MerkleOracleDatum,
  parseMultisigDatum,
  parseMultisigDatumSafe,
  MultisigDatum,
};
