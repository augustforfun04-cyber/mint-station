"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  inferAuthKind,
  type AuthKind,
  type WalletMe,
} from "@/lib/bankr";

const STORAGE_KEY = "bankr.deploy.apiKey";
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getKeySnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function getServerSnapshot() {
  return "";
}

function writeKey(key: string) {
  if (key) window.localStorage.setItem(STORAGE_KEY, key);
  else window.localStorage.removeItem(STORAGE_KEY);
  emit();
}

type Session = {
  apiKey: string;
  authKind: AuthKind;
  wallet: WalletMe | null;
  walletError: string | null;
  loadingWallet: boolean;
  setApiKey: (key: string) => void;
  refreshWallet: () => Promise<void>;
  authHeaders: Record<string, string>;
};

const SessionContext = createContext<Session | null>(null);

export function BankrSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = useSyncExternalStore(
    subscribe,
    getKeySnapshot,
    getServerSnapshot,
  );
  const [wallet, setWallet] = useState<WalletMe | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const setApiKey = useCallback((key: string) => {
    writeKey(key.trim());
  }, []);

  const authKind = inferAuthKind(apiKey);
  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["x-bankr-key"] = apiKey;
      headers["x-bankr-auth"] = authKind;
    }
    return headers;
  }, [apiKey, authKind]);

  const refreshWallet = useCallback(async () => {
    if (!apiKey) {
      setWallet(null);
      setWalletError(null);
      return;
    }
    setLoadingWallet(true);
    setWalletError(null);
    try {
      const res = await fetch("/api/bankr/wallet", { headers: authHeaders });
      const data = (await res.json()) as WalletMe & {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setWallet(null);
        setWalletError(
          data.error || data.message || "Gagal membaca wallet Bankr.",
        );
        return;
      }
      setWallet(data);
    } catch (error) {
      setWallet(null);
      setWalletError(
        error instanceof Error ? error.message : "Gagal terhubung ke Bankr.",
      );
    } finally {
      setLoadingWallet(false);
    }
  }, [apiKey, authHeaders]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshWallet();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshWallet]);

  const value = useMemo(
    () => ({
      apiKey,
      authKind,
      wallet,
      walletError,
      loadingWallet,
      setApiKey,
      refreshWallet,
      authHeaders,
    }),
    [
      apiKey,
      authKind,
      wallet,
      walletError,
      loadingWallet,
      setApiKey,
      refreshWallet,
      authHeaders,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useBankrSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useBankrSession must be used within provider");
  return ctx;
}
