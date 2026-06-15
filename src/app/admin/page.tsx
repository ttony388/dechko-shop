import { AdminDashboard } from "@/components/admin-dashboard";
import { getAdminAnalytics } from "@/lib/admin-analytics";

export default async function AdminPage() {
  return <AdminDashboard initialData={await getAdminAnalytics("7d")} />;
}
