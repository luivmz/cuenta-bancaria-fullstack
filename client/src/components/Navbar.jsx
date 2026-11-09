import Icon from "./Icon.jsx";
export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <a
          href="#main"
          className="flex items-center gap-3 rounded-lg text-slate-900"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-white">
            <Icon name="account" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Cuenta Clara
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
              Gestión bancaria
            </span>
          </span>
        </a>
        <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800">
          Demo académica
        </span>
      </div>
    </header>
  );
}
