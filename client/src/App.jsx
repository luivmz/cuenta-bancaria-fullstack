import Navbar from "./components/Navbar.jsx";
import AccountSelector from "./components/AccountSelector.jsx";
import SaldoCard from "./components/SaldoCard.jsx";
import OperationForm from "./components/OperationForm.jsx";
import HistorialTransacciones from "./components/HistorialTransacciones.jsx";
import Alert from "./components/Alert.jsx";
import Icon from "./components/Icon.jsx";
import { useBanking } from "./hooks/useBanking.js";
export default function App() {
  const bank = useBanking();
  const disabled =
    bank.loading || Boolean(bank.busy) || bank.needsRefresh || !bank.account;
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:rounded-lg focus:bg-white focus:p-3"
      >
        Ir al contenido
      </a>
      <Navbar />
      <main
        id="main"
        className="mx-auto max-w-7xl space-y-7 px-5 py-8 sm:px-8 sm:py-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
              Panel de cuenta
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Tu dinero, en claro.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Consulta tu saldo y gestiona tus movimientos en un solo lugar.
            </p>
          </div>
          <button
            onClick={bank.refresh}
            disabled={bank.loading || Boolean(bank.busy)}
            className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            <Icon name="refresh" className="h-4 w-4" />
            Actualizar
          </button>
        </div>
        <Alert type="error">{bank.error}</Alert>
        <Alert type="success">{bank.success}</Alert>
        <div className="grid gap-5 md:grid-cols-[1.5fr_1fr]">
          <SaldoCard
            account={bank.account}
            balanceCents={bank.balanceCents}
            loading={bank.loading}
          />
          <AccountSelector
            value={bank.selectedAccount}
            onChange={bank.selectAccount}
            disabled={bank.loading || Boolean(bank.busy)}
          />
        </div>
        <section aria-labelledby="operations-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2
              id="operations-title"
              className="text-lg font-semibold tracking-tight text-slate-900"
            >
              Realiza una operación
            </h2>
            <p className="text-xs text-slate-500">
              Montos en soles · Hasta 2 decimales
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {["deposit", "withdraw", "transfer"].map((type) => (
              <OperationForm
                key={`${bank.selectedAccount}-${type}`}
                type={type}
                selectedAccount={bank.selectedAccount}
                disabled={disabled}
                processing={bank.busy === type}
                onSubmit={bank.operate}
              />
            ))}
          </div>
        </section>
        <HistorialTransacciones
          transactions={bank.history}
          accountNumber={bank.selectedAccount}
          loading={bank.loading}
        />
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-5 pb-8 text-xs leading-relaxed text-slate-500 sm:px-8">
        <p>Cuenta Clara · Sistema de Gestión de Cuenta Bancaria Simplificada</p>
        <p>Proyecto académico · Sin dinero real</p>
      </footer>
    </>
  );
}
