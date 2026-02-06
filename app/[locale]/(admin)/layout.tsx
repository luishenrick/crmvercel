import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Building, LogOut, ShieldAlert, CreditCard, Palette } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-16 items-center px-6 border-b">
          <ShieldAlert className="h-6 w-6 text-orange-600 mr-2" />
          <span className="font-bold">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Overview
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Users
            </Button>
          </Link>
          <Link href="/admin/teams">
            <Button variant="ghost" className="w-full justify-start">
              <Building className="mr-2 h-4 w-4" />
              Teams
            </Button>
          </Link>
          <Link href="/admin/plans">
            <Button variant="ghost" className="w-full justify-start">
              <CreditCard className="mr-2 h-4 w-4" />
              Plans
            </Button>
          </Link>
          <Link href="/admin/branding">
            <Button variant="ghost" className="w-full justify-start">
              <Palette className="mr-2 h-4 w-4" />
              Branding
            </Button>
          </Link>
          <div className="mt-auto">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-start">
                <LogOut className="mr-2 h-4 w-4" />
                Exit to App
              </Button>
            </Link>
          </div>
        </nav>
      </aside>
      <main className="flex flex-1 flex-col sm:pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}