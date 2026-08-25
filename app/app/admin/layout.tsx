import { AdminShell } from './components/AdminShell';
import { AdminGuard } from './components/AdminGaurd';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
