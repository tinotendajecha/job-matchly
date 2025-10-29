import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { AdminGuard } from './components/AdminGaurd';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex h-screen bg-background overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 w-full">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
