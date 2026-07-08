import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export default async function AdminConfigLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
  return children;
}
