import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../services/api.js";
const messages = {
  deposit: "Depósito realizado correctamente.",
  withdraw: "Retiro realizado correctamente.",
  transfer: "Transferencia realizada correctamente.",
};
export function useBanking() {
  const [selectedAccount, setSelectedAccount] = useState("001-000001");
  const [account, setAccount] = useState(null);
  const [balanceCents, setBalanceCents] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const load = useCallback(async (id, signal) => {
    const [nextAccount, nextHistory] = await Promise.all([
      api.getAccount(id, signal),
      api.getHistory(id, signal),
    ]);
    if (!signal?.aborted && mounted.current) {
      setAccount(nextAccount);
      setBalanceCents(nextAccount.balanceCents);
      setHistory(nextHistory);
      setNeedsRefresh(false);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setAccount(null);
    setHistory([]);
    setError("");
    setSuccess("");
    load(selectedAccount, controller.signal)
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selectedAccount, load]);
  const selectAccount = (id) => {
    if (lock.current) return;
    setLoading(true);
    setAccount(null);
    setSelectedAccount(id);
  };
  const refresh = async () => {
    if (lock.current) return;
    lock.current = true;
    setLoading(true);
    setError("");
    try {
      await load(selectedAccount);
    } catch (cause) {
      setError(cause.message);
    } finally {
      lock.current = false;
      if (mounted.current) setLoading(false);
    }
  };
  const operate = async (operation, amount, destination) => {
    if (lock.current || loading || needsRefresh) return false;
    lock.current = true;
    setBusy(operation);
    setError("");
    setSuccess("");
    let completed = false;
    try {
      await api[operation](
        selectedAccount,
        ...(operation === "transfer" ? [destination, amount] : [amount]),
      );
      completed = true;
      await load(selectedAccount);
      if (mounted.current) setSuccess(messages[operation]);
      return true;
    } catch (cause) {
      if (completed && mounted.current) setNeedsRefresh(true);
      if (mounted.current)
        setError(
          completed
            ? `La operación se realizó, pero no se pudo actualizar la vista. Pulsa Actualizar antes de continuar. ${cause.message}`
            : cause.message,
        );
      return completed;
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(null);
    }
  };
  return {
    selectedAccount,
    selectAccount,
    account,
    balanceCents,
    history,
    loading,
    busy,
    error,
    success,
    needsRefresh,
    refresh,
    operate,
  };
}
