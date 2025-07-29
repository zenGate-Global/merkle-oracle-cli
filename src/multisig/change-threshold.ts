import { LucidEvolution, paymentCredentialOf } from "@lucid-evolution/lucid";
import { isProblem } from "ts-handling";
import { MultisigDatum } from "../blockchain/datums.js";
import { MultisigChangeThresholdRedeemer } from "../blockchain/redeemers.js";
import { Config } from "../config.js";
import { logExit, TxHash, Uint, VerificationKey } from "../inputs.js";
import { invariant } from "../invariant.js";
import { loadStateFromTx } from "./load.js";

const changeThreshold = async (
  genesisTxHash: TxHash,
  requiredSigners: Array<VerificationKey>,
  threshold: Uint,
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

  invariant(BigInt(threshold) > BigInt(0), "threshold must be greater than 0");
  invariant(
    BigInt(threshold) <= BigInt(state.signatures.length),
    "threshold must be less than or equal to the number of signatures, found: " +
      state.signatures.length +
      " signatures",
  );

  const selfAddress = await lucid.wallet().address();
  const selfPaymentCredential = paymentCredentialOf(selfAddress).hash;

  const txBuilder = lucid
    .newTx()
    .collectFrom([state.utxo], MultisigChangeThresholdRedeemer)
    .pay.ToContract(
      state.utxo.address,
      MultisigDatum(threshold, state.signatures),
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

export { changeThreshold };
