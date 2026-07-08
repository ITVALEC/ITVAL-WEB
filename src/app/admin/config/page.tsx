import { Suspense } from "react";
import AdminConfigPage from "./page.client";

export default function AdminConfigRoute() {
  return (
    <Suspense fallback={null}>
      <AdminConfigPage />
    </Suspense>
  );
}
