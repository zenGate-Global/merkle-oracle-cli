import { LucidEvolution, paymentCredentialOf } from "@lucid-evolution/lucid";
import { isProblem } from "ts-handling";
import { SingletonWithdrawRedeemer } from "../blockchain/redeemers.js";
import { Config } from "../config.js";
import { logExit, TxHash, VerificationKey } from "../inputs.js";
import { invariant } from "../invariant.js";
import { loadStateFromSingleton } from "../multisig/load.js";
import { MerkleOracle } from "../validators/merkle-oracle.js";
import { loadStateFromTx } from "./index.js";

const singletonWithdraw = async (
  genesisTxHash: TxHash,
  withdrawAddress: string,
  requiredSigners: Array<VerificationKey>,
  lucid: LucidEvolution,
  config: Config,
) => {
  const result = (await loadStateFromTx(genesisTxHash, config)).unwrap();
  if (isProblem(result)) return logExit(result.error);

  const multisigStateResult = (
    await loadStateFromSingleton(
      result.adminSingletonPolicyId + result.adminSingletonAssetName,
      config,
    )
  ).unwrap();
  if (isProblem(multisigStateResult)) return logExit(multisigStateResult.error);

  invariant(
    requiredSigners.length >= multisigStateResult.threshold,
    "required signers must be greater than or equal to the threshold",
  );

  const requiredSignersSet = new Set(requiredSigners);
  invariant(
    requiredSignersSet.size === requiredSigners.length,
    "required signers must be unique",
  );

  const signaturesSet = new Set(multisigStateResult.signatures);
  const missingSigners = requiredSigners.filter(
    (signer) => !signaturesSet.has(signer),
  );
  invariant(
    missingSigners.length === 0,
    `The following signers are not in the state.signatures: ${missingSigners.join(", ")}`,
  );

  const selfAddress = await lucid.wallet().address();
  const selfPaymentCredential = paymentCredentialOf(selfAddress).hash;
  const withdrawVk = paymentCredentialOf(withdrawAddress).hash;

  const refInputs = await MerkleOracle.findReference(genesisTxHash, config);

  const msigUtxo = multisigStateResult.utxo;
  refInputs.push(msigUtxo);

  const walletUtxos = await lucid.wallet().getUtxos();

  const txBuilder = lucid
    .newTx()
    .collectFrom(walletUtxos)
    .collectFrom([result.utxo], SingletonWithdrawRedeemer(withdrawVk))
    .pay.ToAddress(withdrawAddress, result.utxo.assets)
    .readFrom(refInputs);

  for (const signer of requiredSigners) {
    txBuilder.addSignerKey(signer);
  }

  const [outputWalletUtxos, outputs, tx] = await txBuilder.chain();

  if (!multisigStateResult.signatures.includes(selfPaymentCredential)) {
    console.log(
      `connected wallet ${selfAddress} is not a signer, expected one of ${multisigStateResult.signatures.join(", ")}`,
    );
    console.log(`tx cbor hex: ${tx.toCBOR()}`);
    return;
  }

  if (multisigStateResult.threshold === BigInt(1)) {
    const signed = await tx.sign.withWallet().complete();
    lucid.overrideUTxOs(outputWalletUtxos);

    const utxo = outputs.find((output) =>
      Object.entries(output.assets).some(
        ([unit, _amount]) => unit === result.singleton.unit,
      ),
    );
    invariant(utxo, "oracle token is missing");

    return {
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

export { singletonWithdraw };
