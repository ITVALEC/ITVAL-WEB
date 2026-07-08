import { redirect } from "next/navigation";

export default function AdminFooterRedirect() {
  redirect("/admin/config");
}
