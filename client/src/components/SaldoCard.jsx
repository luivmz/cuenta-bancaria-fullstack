import Icon from "./Icon.jsx";
// Format the integer and fractional parts separately to preserve even the largest safe cent.
export const money = (cents) =>
  `S/\u00a0${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 }).format(Math.trunc(cents / 100))}.${String(cents % 100).padStart(2, "0")}`;
export default function SaldoCard({ account, balanceCents, loading }) {
  return (
    <section
      aria-label="Resumen de saldo"
      aria-busy={loading}
      className="flex min-h-60 flex-col justify-between gap-6 rounded-2xl bg-[#132b36] p-6 text-white shadow-sm sm:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal-100">
          Saldo actual
        </p>
        <Icon name="account" className="h-6 w-6 text-teal-200" />
      </div>
      <div>
        <p
          className="break-words text-4xl font-semibold tracking-tight sm:text-5xl"
          aria-live="polite"
        >
          {loading ? "Cargando…" : account ? money(balanceCents) : "—"}
        </p>
        <p className="mt-2 text-sm text-slate-300">
          Disponible en soles peruanos
        </p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-white/15 pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            Titular
          </p>
          <p className="mt-1 text-sm font-medium">
            {account?.holderName || "—"}
          </p>
        </div>
        <p className="font-mono text-sm tracking-wider text-teal-100">
          {account?.accountNumber || "•••-••••••"}
        </p>
      </div>
    </section>
  );
}
