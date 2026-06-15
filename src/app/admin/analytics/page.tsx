import { AdminDashboard } from "@/components/admin-dashboard";
import { getAdminAnalytics } from "@/lib/admin-analytics";

export default async function AdminAnalyticsPage() {
  return <AdminDashboard analyticsOnly initialData={await getAdminAnalytics("30d")} />;
}
