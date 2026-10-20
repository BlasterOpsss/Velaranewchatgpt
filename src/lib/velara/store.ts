import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Asset,
  type Balances,
  emptyBalances,
  makeRef,
  roundAmount,
} from "@/lib/velara/model";

export type ActivityKind = "shield" | "send";

export type Activity = {
  id: string;
  kind: ActivityKind;
  asset: Asset;
  amount: number;
  at: number;
  to?: string;
  ref: string;
};

export type Book = {
  signed: boolean;
  privateBal: Balances;
  activity: Activity[];
};

type VelaraState = {
  books: Record<string, Book>;
  sign: (address: string) => void;
  shield: (address: string, asset: Asset, amount: number, available: number) => string | null;
  send: (address: string, asset: Asset, amount: number, to: string) => string | null;
  noteTransfer: (address: string, asset: Asset, amount: number, to: string, signature: string) => void;
  forget: (address: string) => void;
};

export function emptyBook(): Book {
  return { signed: false, privateBal: emptyBalances(), activity: [] };
}

export function bookFor(books: Record<string, Book>, address: string) {
  return books[address] ?? emptyBook();
}

export const useVelara = create<VelaraState>()(
  persist(
    (set, get) => ({
      books: {},
      sign: (address) => {
        const current = bookFor(get().books, address);
        set({ books: { ...get().books, [address]: { ...current, signed: true } } });
      },
      shield: (address, asset, amount, available) => {
        const current = bookFor(get().books, address);
        if (!current.signed) return "Open the private account first.";
        const moved = roundAmount(asset, amount);
        if (!(moved > 0)) return "Enter an amount greater than zero.";
        if (moved > available + 1e-9) return "That is more than the wallet holds.";
        const item: Activity = {
          id: crypto.randomUUID(),
          kind: "shield",
          asset,
          amount: moved,
          at: Date.now(),
          ref: makeRef(),
        };
        set({
          books: {
            ...get().books,
            [address]: {
              ...current,
              privateBal: {
                ...current.privateBal,
                [asset]: roundAmount(asset, current.privateBal[asset] + moved),
              },
              activity: [item, ...current.activity].slice(0, 30),
            },
          },
        });
        return null;
      },
      send: (address, asset, amount, to) => {
        const current = bookFor(get().books, address);
        if (!current.signed) return "Open the private account first.";
        const moved = roundAmount(asset, amount);
        if (!(moved > 0)) return "Enter an amount greater than zero.";
        if (moved > current.privateBal[asset] + 1e-9) return "That is more than the private balance.";
        const item: Activity = {
          id: crypto.randomUUID(),
          kind: "send",
          asset,
          amount: moved,
          at: Date.now(),
          to: to.trim(),
          ref: makeRef(),
        };
        set({
          books: {
            ...get().books,
            [address]: {
              ...current,
              privateBal: {
                ...current.privateBal,
                [asset]: roundAmount(asset, current.privateBal[asset] - moved),
              },
              activity: [item, ...current.activity].slice(0, 30),
            },
          },
        });
        return null;
      },
      noteTransfer: (address, asset, amount, to, signature) => {
        const current = bookFor(get().books, address);
        const item: Activity = {
          id: crypto.randomUUID(),
          kind: "send",
          asset,
          amount: roundAmount(asset, amount),
          at: Date.now(),
          to: to.trim(),
          ref: signature,
        };
        set({
          books: {
            ...get().books,
            [address]: {
              ...current,
              activity: [item, ...current.activity].slice(0, 30),
            },
          },
        });
      },
      forget: (address) => {
        const next = { ...get().books };
        delete next[address];
        set({ books: next });
      },
    }),
    {
      name: "velara-demo",
      skipHydration: true,
      partialize: (state) => ({ books: state.books }),
    },
  ),
);

export function HydrateVelara() {
  useEffect(() => {
    void useVelara.persist.rehydrate();
  }, []);
  return null;
}
