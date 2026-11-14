import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { logout } from '@/actions/auth';
import type { CurrentUser } from '@/lib/auth/dal';
import { Avatar } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { PlanBadge } from '@/components/ui/plan-badge';

export function UserMenu({ user }: { user: CurrentUser }) {
  return (
    <div data-testid="user-menu" className="flex items-center gap-2">
      <Link
        data-testid="user-dashboard-link"
        href="/app"
        className={buttonVariants({ variant: 'secondary', size: 'sm' })}
      >
        Painel
      </Link>
      <Link
        href="/app/perfil"
        data-testid="user-profile-link"
        className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 hover:bg-slate-100"
        title="Meu perfil"
      >
        <Avatar name={user.name} className="size-8 text-xs" />
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-slate-800 lg:block">
          {user.name}
        </span>
        <PlanBadge plan={user.plan} />
      </Link>
      <form data-testid="logout-form" action={logout}>
        <Button
          data-testid="logout-button"
          type="submit"
          variant="ghost"
          size="sm"
          aria-label="Sair da conta"
        >
          <LogOut className="size-4" aria-hidden />
          <span className="hidden lg:inline">Sair</span>
        </Button>
      </form>
    </div>
  );
}
