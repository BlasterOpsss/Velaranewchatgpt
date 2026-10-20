import {
  address,
  appendTransactionMessageInstructions,
  compileTransaction,
  createNoopSigner,
  createSolanaRpc,
  createTransactionMessage,
  getTransactionEncoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  type Instruction,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { type Asset, roundAmount } from "@/lib/velara/model";
import { MINTS, RPC_URL } from "@/lib/velara/network";

const RPC = RPC_URL;

/** Left in the wallet so a SOL transfer can still pay the network fee. */
export const SOL_FEE_RESERVE = 0.001;

export function baseUnits(asset: Asset, amount: number) {
  const whole = asset === "SOL" ? 1_000_000_000 : 1_000_000;
  return BigInt(Math.round(roundAmount(asset === "SOL" ? "SOL" : asset, amount) * whole));
}

export async function buildTransferTransaction(from: string, to: string, asset: Asset, amount: number) {
  const payer = createNoopSigner(address(from));
  const destination = address(to);
  const units = baseUnits(asset, amount);
  if (units <= 0n) throw new Error("Enter an amount greater than zero.");

  const instructions: Instruction[] = [];
  if (asset === "SOL") {
    instructions.push(
      getTransferSolInstruction({
        source: payer,
        destination,
        amount: units,
      }),
    );
  } else {
    const mint = address(MINTS[asset]);
    const [sourceAta] = await findAssociatedTokenPda({
      owner: payer.address,
      mint,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    const [destinationAta] = await findAssociatedTokenPda({
      owner: destination,
      mint,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    instructions.push(
      getCreateAssociatedTokenIdempotentInstruction({
        payer,
        ata: destinationAta,
        owner: destination,
        mint,
      }),
      getTransferCheckedInstruction({
        source: sourceAta,
        mint,
        destination: destinationAta,
        authority: payer,
        amount: units,
        decimals: 6,
      }),
    );
  }

  const rpc = createSolanaRpc(RPC);
  const { value: latest } = await rpc.getLatestBlockhash().send();
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (current) => setTransactionMessageFeePayerSigner(payer, current),
    (current) => setTransactionMessageLifetimeUsingBlockhash(latest, current),
    (current) => appendTransactionMessageInstructions(instructions, current),
  );
  return new Uint8Array(getTransactionEncoder().encode(compileTransaction(message)));
}

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function encodeBase58(bytes: Uint8Array) {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i += 1) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let out = "";
  for (const byte of bytes) {
    if (byte !== 0) break;
    out += "1";
  }
  for (let i = digits.length - 1; i >= 0; i -= 1) out += BASE58[digits[i]];
  return out;
}
