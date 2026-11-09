const paths = {
  deposit: <path d="M12 4v12m-5-5 5 5 5-5M5 19h14" />,
  withdraw: <path d="M12 16V4m-5 5 5-5 5 5M5 19h14" />,
  transfer: <path d="M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4" />,
  account: <><path d="m3 9 9-6 9 6H3Zm2 3v6m7-6v6m7-6v6M3 21h18" /></>,
  history: <><path d="M4 5v5h5M4 10a8 8 0 1 1 0 5m8-8v5l3 2" /></>,
  refresh: <path d="M20 7v5h-5M4 17v-5h5m-5 0a8 8 0 0 1 13-6l3 6M4 12l3 6a8 8 0 0 0 13-6" />,
};
export default function Icon({ name, className = 'h-5 w-5' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name] || paths.account}</svg>;
}
