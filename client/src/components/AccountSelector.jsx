export const DEMO_ACCOUNTS = [
  { id: '001-000001', name: 'Luis' }, { id: '001-000002', name: 'Ana' }, { id: '001-000003', name: 'Carlos' },
];
export default function AccountSelector({ value, onChange, disabled }) {
  return <section className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
    <div><h2 className="text-base font-semibold text-slate-900">Tu cuenta</h2><p className="mt-1 text-sm text-slate-500">Selecciona una cuenta de demostración.</p></div>
    <div><label htmlFor="account" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Cuenta seleccionada</label>
      <select id="account" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm font-medium disabled:opacity-50">
        {DEMO_ACCOUNTS.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.id}</option>)}
      </select>
    </div>
    <p className="text-xs leading-relaxed text-slate-500">Los movimientos se guardan en MongoDB local. Las cuentas utilizan soles peruanos (PEN).</p>
  </section>;
}
