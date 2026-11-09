export default function Alert({ type, children }) {
  if (!children) return null;
  return <div role={type === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-teal-200 bg-teal-50 text-teal-900'}`}>{children}</div>;
}
