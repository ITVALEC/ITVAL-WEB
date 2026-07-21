import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { MANIFEST_PATHS, readJsonFile } from "@/lib/admin/manifests";
import { listAllMedia } from "@/lib/admin/media-service";
import { listCatalogTree } from "@/lib/admin/catalog-service";
import { AdminPanel, AdminShell } from "@/components/admin/AdminShell";

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const projects = readJsonFile<{ projects: { featured?: boolean }[] }>(MANIFEST_PATHS.projects);
  const allMedia = await listAllMedia();
  const catalog = await listCatalogTree();
  const subcategoryCount = catalog.reduce((n, c) => n + c.subcategories.length, 0);

  return (
    <AdminShell title="Inicio">
      <AdminPanel
        title="¿Qué quieres hacer?"
        description="Elige una sección. Cada parte del panel tiene una tarea concreta."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard
            href="/admin/projects"
            title="Gestionar obras"
            desc={`${projects.projects.length} proyectos en el portafolio. Edita nombre, categoría, fotos y portada.`}
            stat={String(projects.projects.length)}
          />
          <ActionCard
            href="/admin/catalogo"
            title="Editar catálogo"
            desc={`${catalog.length} categorías y ${subcategoryCount} líneas de producto. Cambia nombes y descripciones.`}
            stat={String(catalog.length)}
          />
          <ActionCard
            href="/admin/imagenes"
            title="Administrar fotos"
            desc="Sube, reemplaza o elimina imágenes. Busca por obra o producto."
            stat={String(allMedia.length)}
          />
          <ActionCard
            href="/admin/config"
            title="Ajustes del sitio"
            desc="Teléfono, correo, textos del footer e imágenes que no deben publicarse."
            stat="Contacto"
          />
        </div>
      </AdminPanel>

      <div className="mt-4 rounded-xl border border-cornflower/20 bg-cornflower/5 p-4 text-sm text-navy">
        <p className="font-semibold">Guía rápida</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-grey-dark">
          <li><strong>Obras</strong> — proyectos terminados (edificios, ciudades, galería de fotos).</li>
          <li><strong>Catálogo</strong> — tipos de producto ITVAL (fachadas, puertas, ventanas…).</li>
          <li><strong>Fotos</strong> — todas las imágenes del sitio en un solo lugar.</li>
        </ul>
      </div>
    </AdminShell>
  );
}

function ActionCard({
  href,
  title,
  desc,
  stat,
}: {
  href: string;
  title: string;
  desc: string;
  stat: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-xl border border-grey/20 bg-white p-4 shadow-sm transition hover:border-cornflower/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-navy">{title}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-navy">
          {stat}
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm text-grey-dark">{desc}</p>
      <span className="mt-3 text-sm font-semibold text-cornflower-ink">Abrir →</span>
    </Link>
  );
}
