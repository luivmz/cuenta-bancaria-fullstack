import Icon from "./Icon.jsx";
import { money } from "./SaldoCard.jsx";
const titles = {
  DEPOSIT: "Depósito",
  WITHDRAWAL: "Retiro",
  TRANSFER: "Transferencia",
};
const icons = {
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdraw",
  TRANSFER: "transfer",
};
export default function HistorialTransacciones({
  transactions,
  accountNumber,
  loading,
}) {
  return (
    <section
      aria-labelledby="history-title"
      aria-busy={loading}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
        <h2
          id="history-title"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900"
        >
          <Icon name="history" />
          Últimos movimientos
        </h2>
        <span className="text-xs text-slate-500">Hasta 100 movimientos</span>
      </div>
      {loading ? (
        <p role="status" className="p-8 text-center text-sm text-slate-500">
          Cargando movimientos…
        </p>
      ) : !transactions.length ? (
        <div className="px-6 py-12 text-center">
          <p className="font-medium text-slate-700">Aún no hay movimientos</p>
          <p className="mt-1 text-sm text-slate-500">
            Las operaciones de esta cuenta aparecerán aquí.
          </p>
        </div>
      ) : (
        <ul
          aria-label="Historial de movimientos"
          className="divide-y divide-slate-100"
        >
          {transactions.map((transaction) => {
            const incoming =
              transaction.destinationAccount?.accountNumber === accountNumber;
            const other = incoming
              ? transaction.sourceAccount
              : transaction.destinationAccount;
            return (
              <li
                key={transaction.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 px-5 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-6"
              >
                <span
                  className={`row-span-2 flex h-10 w-10 items-center justify-center rounded-full sm:row-span-1 ${incoming ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"}`}
                >
                  <Icon name={icons[transaction.type]} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {titles[transaction.type]}
                    {transaction.type === "TRANSFER"
                      ? incoming
                        ? " recibida"
                        : " enviada"
                      : ""}
                  </p>
                  <p className="mt-0.5 break-words text-xs text-slate-500">
                    {other
                      ? `${incoming ? "De" : "Para"} ${other.holderName} · ${other.accountNumber}`
                      : incoming
                        ? "Ingreso a tu cuenta"
                        : "Salida de tu cuenta"}
                  </p>
                  <time
                    dateTime={transaction.createdAt}
                    className="mt-1 block text-xs text-slate-500"
                  >
                    {new Intl.DateTimeFormat("es-PE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(transaction.createdAt))}
                  </time>
                </div>
                <p
                  className={`col-start-2 whitespace-nowrap text-sm font-semibold tabular-nums sm:col-start-auto ${incoming ? "text-teal-800" : "text-slate-700"}`}
                >
                  {incoming ? "+" : "−"} {money(transaction.amountCents)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
