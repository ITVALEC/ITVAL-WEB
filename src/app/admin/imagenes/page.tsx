import { Suspense } from "react";
import AdminImagenesPage from "./page.client";

export default function AdminImagenesRoute() {
  return (
    <Suspense fallback={null}>
      <AdminImagenesPage />
    </Suspense>
  );
}
