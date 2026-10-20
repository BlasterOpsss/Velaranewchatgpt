import { type Asset, type Balances, emptyBalances } from "@/lib/velara/model";
import { MINTS, RPC_URL } from "@/lib/velara/network";

const RPC = RPC_URL;

type RpcResponse = { result?: unknown; error?: { message?: string } };

async function rpc(method: string, params: unknown[]) {
  const response = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("The wallet balance could not be read.");
  const body = (await response.json()) as RpcResponse;
  if (body.error) throw new Error(body.error.message || "The wallet balance could not be read.");
  return body.result;
}

function tokenAmount(result: unknown) {
  const value = (result as { value?: Array<{ account?: { data?: { parsed?: { info?: { tokenAmount?: { uiAmount?: number | null } } } } } }> })
    ?.value;
  if (!Array.isArray(value)) return 0;
  return value.reduce((sum, row) => sum + (row.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0), 0);
}

export async function fetchWalletBalances(address: string): Promise<Balances> {
  const [lamports, usdc, usdt] = await Promise.all([
    rpc("getBalance", [address]),
    rpc("getTokenAccountsByOwner", [address, { mint: MINTS.USDC }, { encoding: "jsonParsed" }]),
    rpc("getTokenAccountsByOwner", [address, { mint: MINTS.USDT }, { encoding: "jsonParsed" }]),
  ]);
  const sol = ((lamports as { value?: number })?.value ?? 0) / 1_000_000_000;
  return {
    ...emptyBalances(),
    SOL: sol,
    USDC: tokenAmount(usdc),
    USDT: tokenAmount(usdt),
  };
}
