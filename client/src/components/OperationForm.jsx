import { useId, useState } from "react";
import { DEMO_ACCOUNTS } from "./AccountSelector.jsx";
import Icon from "./Icon.jsx";
const definitions = {
  deposit: {
    title: "Depositar",
    description: "Agrega fondos a tu cuenta.",
    button: "Depositar fondos",
    badge: "bg-teal-50 text-teal-800",
    buttonClass: "bg-teal-800 hover:bg-teal-900",
  },
  withdraw: {
    title: "Retirar",
    description: "Retira desde tu saldo disponible.",
    button: "Retirar fondos",
    badge: "bg-orange-50 text-orange-800",
    buttonClass: "bg-[#132b36] hover:bg-slate-800",
  },
  transfer: {
    title: "Transferir",
    description: "Envía dinero a otra cuenta.",
    button: "Transferir fondos",
    badge: "bg-indigo-50 text-indigo-800",
    buttonClass: "bg-[#132b36] hover:bg-slate-800",
  },
};
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 disabled:bg-slate-50 disabled:opacity-60";
export default function OperationForm({
  type,
  selectedAccount,
  disabled,
  processing,
  onSubmit,
}) {
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [validation, setValidation] = useState("");
  const id = useId();
  const definition = definitions[type];
  const submit = async (event) => {
    event.preventDefault();
    if (disabled) return;
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setValidation("Ingresa un monto mayor que cero.");
      return;
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(amount)) {
      setValidation("Usa un monto con hasta dos decimales.");
      return;
    }
    if (
      type === "transfer" &&
      (!destination || destination === selectedAccount)
    ) {
      setValidation("Selecciona otra cuenta de destino.");
      return;
    }
    setValidation("");
    if (await onSubmit(type, value, destination)) {
      setAmount("");
      setDestination("");
    }
  };
  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label={definition.title}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${definition.badge}`}
      >
        <Icon name={type} />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-slate-900">
        {definition.title}
      </h3>
      <p className="mt-1 text-sm text-slate-500">{definition.description}</p>
      <div className="mt-6 flex flex-1 flex-col gap-4">
        <div>
          <label
            htmlFor={`${id}-amount`}
            className="mb-2 block text-sm font-medium"
          >
            Monto (S/)
          </label>
          <input
            id={`${id}-amount`}
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setValidation("");
            }}
            disabled={disabled}
            required
            aria-invalid={Boolean(validation)}
            aria-describedby={validation ? `${id}-error` : undefined}
            className={inputClass}
          />
        </div>
        {type === "transfer" && (
          <div>
            <label
              htmlFor={`${id}-destination`}
              className="mb-2 block text-sm font-medium"
            >
              Cuenta de destino
            </label>
            <select
              id={`${id}-destination`}
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setValidation("");
              }}
              required
              disabled={disabled}
              className={inputClass}
            >
              <option value="">Selecciona una cuenta</option>
              {DEMO_ACCOUNTS.filter((a) => a.id !== selectedAccount).map(
                (a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · {a.id}
                  </option>
                ),
              )}
            </select>
          </div>
        )}
        {validation && (
          <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
            {validation}
          </p>
        )}
        <button
          type="submit"
          disabled={disabled}
          className={`mt-auto min-h-11 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-45 ${definition.buttonClass}`}
        >
          {processing ? "Procesando…" : definition.button}
        </button>
      </div>
    </form>
  );
}
