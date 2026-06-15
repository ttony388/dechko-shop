import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getAdminAnalytics, type AnalyticsPeriod } from "@/lib/admin-analytics";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Нямате достъп." }, { status: 403 });
  }
  const period = new URL(request.url).searchParams.get("period") as AnalyticsPeriod | null;
  const safePeriod: AnalyticsPeriod = ["7d", "30d", "6m", "1y"].includes(period || "")
    ? period!
    : "7d";
  return NextResponse.json(await getAdminAnalytics(safePeriod));
}
