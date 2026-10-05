/** Contas criadas pelo seed, exibidas quando SHOW_DEMO_ACCOUNTS=true (útil em apresentações). */
export function DemoAccounts() {
  if (process.env.SHOW_DEMO_ACCOUNTS !== 'true') return null;

  const accounts = [
    { label: 'Startup (Premium)', email: 'startup@demo.local' },
    { label: 'Startup (Gratuita)', email: 'startup-free@demo.local' },
    { label: 'Investidor anjo', email: 'investidor@demo.local' },
    { label: 'Profissional', email: 'profissional@demo.local' },
  ];

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-600">
      <p className="font-semibold text-slate-700">Contas de demonstração (senha: Demo@123)</p>
      <ul className="mt-2 space-y-1">
        {accounts.map((account) => (
          <li key={account.email} className="flex justify-between gap-2">
            <span>{account.label}</span>
            <code className="font-mono text-slate-800">{account.email}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
