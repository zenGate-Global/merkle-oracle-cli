import { LucidEvolution, paymentCredentialOf } from "@lucid-evolution/lucid";
import { isProblem } from "ts-handling";
import { MultisigDatum } from "../blockchain/datums.js";
import { MultisigChangeSignaturesRedeemer } from "../blockchain/redeemers.js";
import { Config } from "../config.js";
import { logExit, TxHash, VerificationKey } from "../inputs.js";
import { invariant } from "../invariant.js";
import { loadStateFromTx } from "./load.js";

const changeSignatures = async (
  genesisTxHash: TxHash,
  requiredSigners: Array<VerificationKey>,
  signatures: Array<VerificationKey>,
  lucid: LucidEvolution,
  config: Config,
) => {
  const tryState = await loadStateFromTx(genesisTxHash, config);
  const state = tryState.unwrap();
  if (isProblem(state)) return logExit(state.error);

  invariant(
    requiredSigners.length >= state.threshold,
    "required signers must be greater than or equal to the threshold",
  );

  const requiredSignersSet = new Set(requiredSigners);
  invariant(
    requiredSignersSet.size === requiredSigners.length,
    "required signers must be unique",
  );

  const signaturesSet = new Set(state.signatures);
  const missingSigners = requiredSigners.filter(
    (signer) => !signaturesSet.has(signer),
  );
  invariant(
    missingSigners.length === 0,
    `The following signers are not in the state.signatures: ${missingSigners.join(", ")}`,
  );

  invariant(
    signatures.length > 0,
    "signatures must be an array of at least 1 signature",
  );
  invariant(
    BigInt(signatures.length) >= BigInt(state.threshold),
    "signatures must be greater than or equal to the current threshold, found: " +
      state.threshold +
      " signatures",
  );

  const selfAddress = await lucid.wallet().address();
  const selfPaymentCredential = paymentCredentialOf(selfAddress).hash;

  const txBuilder = lucid
    .newTx()
    .collectFrom([state.utxo], MultisigChangeSignaturesRedeemer)
    .pay.ToContract(
      state.utxo.address,
      MultisigDatum(state.threshold, signatures),
      state.utxo.assets,
    )
    .attach.SpendingValidator(state.genesisUtxo.scriptRef!);

  for (const signer of requiredSigners) {
    txBuilder.addSignerKey(signer);
  }

  const [walletUtxos, outputs, tx] = await txBuilder.chain();

  if (!state.signatures.includes(selfPaymentCredential)) {
    console.log(
      `connected wallet ${selfAddress} is not a signer, expected one of ${state.signatures.join(", ")}`,
    );
    console.log(`tx cbor hex: ${tx.toCBOR()}`);
    return;
  }

  if (state.threshold === BigInt(1)) {
    const signed = await tx.sign.withWallet().complete();
    lucid.overrideUTxOs(walletUtxos);
    const utxo = outputs.find((output) =>
      Object.entries(output.assets).some(
        ([unit, _amount]) =>
          unit === state.singleton.policy + state.singleton.name,
      ),
    );
    invariant(utxo, "token is missing");

    return {
      singleton: state.singleton.policy + state.singleton.name,
      tx: signed,
      utxo,
    };
  } else {
    const txHex = tx.toCBOR();
    const witness = await lucid.fromTx(txHex).partialSign.withWallet();
    console.log(`tx cbor hex: ${txHex}`);
    console.log(`Signer: ${selfPaymentCredential}`);
    console.log(`Tx Witness: ${witness}`);
    return;
  }
};

export { changeSignatures };
