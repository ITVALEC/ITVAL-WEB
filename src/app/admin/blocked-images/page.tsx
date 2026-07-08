import { redirect } from "next/navigation";

export default function AdminBlockedRedirect() {
  redirect("/admin/config?tab=blocked");
}
