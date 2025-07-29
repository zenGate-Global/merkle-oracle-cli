import { LucidEvolution, paymentCredentialOf } from "@lucid-evolution/lucid";
import { logExit, MultisigSignSchema } from "../inputs.js";
import { invariant } from "../invariant.js";

const isHex = (value: string): boolean => {
  return /^[0-9a-fA-F]*$/.test(value);
};

const addSignature = async (
  lucid: LucidEvolution,
  multiSigSignConfig: typeof MultisigSignSchema.infer,
) => {
  const selfAddress = await lucid.wallet().address();
  const selfPaymentCredential = paymentCredentialOf(selfAddress).hash;

  const requiredSignersSet = new Set(multiSigSignConfig.requiredSigners);
  invariant(
    requiredSignersSet.size === multiSigSignConfig.requiredSigners.length,
    "required signers must be unique",
  );

  // check if all required signers have already signed
  const allSignersDone = multiSigSignConfig.requiredSigners.every((signer) =>
    multiSigSignConfig.signers.some((s) => s.signer === signer),
  );

  if (allSignersDone) {
    console.log("All required signers have already signed the transaction");

    const witnesses = multiSigSignConfig.signers.map(
      (signer) => signer.witness,
    );
    const txSigned = await lucid
      .fromTx(multiSigSignConfig.txHex)
      .assemble(witnesses)
      .complete();

    return { tx: txSigned };
  }

  // check if connected wallet is a required signer
  if (!multiSigSignConfig.requiredSigners.includes(selfPaymentCredential)) {
    return logExit("connected wallet is not a required signer");
  }

  if (
    multiSigSignConfig.signers.some(
      (signer) => signer.signer === selfPaymentCredential,
    )
  ) {
    return logExit("connected wallet has already signed the transaction");
  }

  if (multiSigSignConfig.txHex === "" || !isHex(multiSigSignConfig.txHex)) {
    return logExit("invalid transaction hex");
  }

  const tx = lucid.fromTx(multiSigSignConfig.txHex);
  const witness = await tx.partialSign.withWallet();

  const pendingSigners = multiSigSignConfig.requiredSigners.filter(
    (signer) =>
      !multiSigSignConfig.signers.some((s) => s.signer === signer) &&
      signer !== selfPaymentCredential,
  );

  if (pendingSigners.length > 0) {
    console.log(`Signer: ${selfPaymentCredential}`);
    console.log(`TX Witness: ${witness}`);
    console.log(
      `Signing needed from following signers: ${pendingSigners.join(", ")}`,
    );
    return;
  }

  console.log("All required signers have signed the transaction");

  const witnesses = multiSigSignConfig.signers.map((signer) => signer.witness);
  witnesses.push(witness);

  const txSigned = await lucid
    .fromTx(multiSigSignConfig.txHex)
    .assemble(witnesses)
    .complete();

  return { tx: txSigned };
};

export { addSignature };
