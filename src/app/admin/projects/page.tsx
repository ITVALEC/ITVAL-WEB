"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminMediaImage } from "@/components/admin/AdminMediaImage";
import {
  AdminField,
  AdminPanel,
  AdminShell,
} from "@/components/admin/AdminShell";
import {
  AdminBadge,
  AdminButton,
  AdminConfirmDialog,
  AdminCrudToolbar,
  AdminDataTable,
  AdminInfoBanner,
  AdminModal,
  adminInputClass,
} from "@/components/admin/AdminCrud";
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminPagination,
  AdminSearchField,
  AdminStatusMessage,
} from "@/components/admin/AdminUi";
import { adminErrorMessage, readAdminJson } from "@/lib/admin/api-client";
import { getCategoryLabel, PROJECT_CATEGORIES } from "@/lib/admin/categories";

type ProjectCategory = { value: string; label: string };

type AdminProject = {
  id: string;
  name: string;
  city: string;
  year: number | null;
  featured: boolean;
  productCategory: string;
  cover: string;
  gallery: string[];
  coverIndex?: number | null;
  coverFileMissing?: boolean;
  galleryFileMissing?: boolean[];
};

type ProjectsResponse = {
  projects: AdminProject[];
  total: number;
  page: number;
  totalPages: number;
  from: number;
  to: number;
};

type ProjectForm = {
  name: string;
  featured: boolean;
  productCategory: string;
  coverIndex: number;
};

function toForm(project: AdminProject): ProjectForm {
  return {
    name: project.name,
    featured: project.featured,
    productCategory: project.productCategory,
    coverIndex: project.coverIndex ?? 0,
  };
}

export default function AdminProjectsPage() {
  const [data, setData] = useState<ProjectsResponse | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editing, setEditing] = useState<AdminProject | null>(null);
  const [form, setForm] = useState<ProjectForm | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [deletePhotoIndex, setDeletePhotoIndex] = useState<number | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>(
    [...PROJECT_CATEGORIES],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    fetch("/api/admin/catalog?meta=project-categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.categories?.length) setProjectCategories(data.categories);
      })
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (debouncedQuery) params.set("q", debouncedQuery);

    try {
      const res = await fetch(`/api/admin/projects?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        setFeedback({
          type: "error",
          message: await adminErrorMessage(res, "No se pudieron cargar los proyectos."),
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Error de red al cargar obras. Revisa la conexión.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(project: AdminProject) {
    setFeedback(null);
    setEditing(project);
    setForm(toForm(project));
  }

  function closeEdit() {
    setEditing(null);
    setForm(null);
  }

  async function saveProject(event: React.FormEvent) {
    event.preventDefault();
    if (!editing || !form || saving) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          name: form.name.trim() || editing.name,
          featured: form.featured,
          productCategory: form.productCategory,
          coverIndex: form.coverIndex,
        }),
      });

      if (res.ok) {
        const result = await readAdminJson<{ project?: AdminProject }>(res);
        if (result?.project) {
          setData((current) =>
            current
              ? {
                  ...current,
                  projects: current.projects.map((p) =>
                    p.id === editing.id ? { ...p, ...result.project } : p,
                  ),
                }
              : current,
          );
        } else {
          await load();
        }
        setFeedback({ type: "success", message: `"${form.name}" actualizado correctamente.` });
        closeEdit();
      } else {
        setFeedback({
          type: "error",
          message: await adminErrorMessage(res, "No se pudo guardar el proyecto."),
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Error de red al guardar. Revisa la conexión e inténtalo de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  }

  const editingProject = editing;

  async function refreshEditingProject() {
    if (!editingProject) return;
    await load();
    const params = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (debouncedQuery) params.set("q", debouncedQuery);
    const res = await fetch(`/api/admin/projects?${params.toString()}`);
    if (res.ok) {
      const refreshed = await res.json();
      const updated = refreshed.projects.find((p: AdminProject) => p.id === editingProject.id);
      if (updated) {
        setEditing(updated);
        setForm(toForm(updated));
      } else {
        closeEdit();
      }
    }
  }

  async function confirmDeletePhoto() {
    if (!editingProject || deletePhotoIndex == null || deletingPhoto) return;

    setDeletingPhoto(true);
    try {
      const mediaId = `project:${editingProject.id}:${deletePhotoIndex}`;
      const res = await fetch(`/api/admin/media?id=${encodeURIComponent(mediaId)}`, {
        method: "DELETE",
      });
      setDeletePhotoIndex(null);

      if (res.ok) {
        setPreviewVersion((v) => v + 1);
        setFeedback({ type: "success", message: "Foto eliminada del proyecto." });
        await refreshEditingProject();
      } else {
        setFeedback({
          type: "error",
          message: await adminErrorMessage(res, "No se pudo eliminar la foto."),
        });
      }
    } catch {
      setDeletePhotoIndex(null);
      setFeedback({
        type: "error",
        message: "Error de red al eliminar. Revisa la conexión e inténtalo de nuevo.",
      });
    } finally {
      setDeletingPhoto(false);
    }
  }

  return (
    <AdminShell title="Obras realizadas">
      <AdminPanel>
        <AdminCrudToolbar
          title="Obras por ciudad"
          description="Cada obra es una instalación real: se muestra su galería (no el catálogo de productos). Filtra por ciudad o nombre."
        />

        <AdminInfoBanner>
          Aquí gestionas las galerías de obras realizadas (Quito, Guayaquil, etc.). El catálogo de
          productos es otra sección. Edita nombre, categoría de solución y portada; sube fotos desde
          la galería al editar, o desde{" "}
          <Link href="/admin/imagenes?kind=project" className="font-semibold text-gold-deep underline">
            Fotos → Obras
          </Link>
          .
        </AdminInfoBanner>

        <div className="mb-4 space-y-4">
          <AdminSearchField
            id="admin-projects-search"
            label="Buscar"
            hint="Por nombre de obra, ciudad o código."
            value={query}
            onChange={setQuery}
            placeholder="Ej: Quito, Guayaquil, Kia…"
            resultsCount={data?.total}
            resultsLabel={data?.total === 1 ? "obra" : "obras"}
          />
          {feedback ? <AdminStatusMessage type={feedback.type} message={feedback.message} /> : null}
        </div>

        {loading ? (
          <AdminLoadingState label="Cargando obras…" />
        ) : !data || data.projects.length === 0 ? (
          <AdminEmptyState
            title="Sin obras"
            description={
              debouncedQuery
                ? "Prueba otro término o borra el filtro de búsqueda."
                : "No hay obras en el portafolio. Tras el próximo deploy se importarán desde el repositorio si la base estaba vacía."
            }
          />
        ) : (
          <>
            <AdminDataTable
              caption="Listado de obras (galerías por ciudad)"
              rows={data.projects}
              columns={[
                {
                  key: "cover",
                  header: "Portada",
                  className: "w-20",
                  cell: (row) => (
                    <div className="relative h-12 w-16 overflow-hidden rounded-md bg-surface-muted">
                      <AdminMediaImage
                        src={row.cover}
                        version={previewVersion}
                        sizes="64px"
                        fileMissing={row.coverFileMissing}
                        emptyLabel="Archivo ausente"
                      />
                    </div>
                  ),
                },
                {
                  key: "name",
                  header: "Proyecto",
                  cell: (row) => (
                    <div>
                      <p className="font-medium text-navy">{row.name}</p>
                      <p className="text-xs text-grey">{row.id}</p>
                    </div>
                  ),
                },
                {
                  key: "city",
                  header: "Ubicación",
                  hideOnMobile: true,
                  cell: (row) => (
                    <span className="text-grey-dark">
                      {row.city}
                      {row.year ? ` · ${row.year}` : ""}
                    </span>
                  ),
                },
                {
                  key: "category",
                  header: "Categoría",
                  hideOnMobile: true,
                  cell: (row) => (
                    <span className="text-grey-dark">{getCategoryLabel(row.productCategory)}</span>
                  ),
                },
                {
                  key: "featured",
                  header: "Estado",
                  cell: (row) =>
                    row.featured ? (
                      <AdminBadge tone="success">Destacado</AdminBadge>
                    ) : (
                      <AdminBadge>Publicado</AdminBadge>
                    ),
                },
                {
                  key: "actions",
                  header: "Acciones",
                  headerClassName: "text-right",
                  className: "text-right",
                  cell: (row) => (
                    <div className="flex justify-end gap-2">
                      <AdminButton variant="ghost" onClick={() => openEdit(row)}>
                        Editar
                      </AdminButton>
                      <Link
                        href={`/es/proyectos/${row.id}`}
                        target="_blank"
                        className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
                      >
                        Ver
                      </Link>
                    </div>
                  ),
                },
              ]}
              mobileCard={(row) => (
                <div className="flex gap-3">
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
                    <AdminMediaImage
                      src={row.cover}
                      version={previewVersion}
                      sizes="80px"
                      fileMissing={row.coverFileMissing}
                      emptyLabel="Archivo ausente"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy">{row.name}</p>
                    <p className="text-xs text-grey-dark">
                      {row.city}
                      {row.year ? ` · ${row.year}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {row.featured ? <AdminBadge tone="success">Destacado</AdminBadge> : null}
                      <AdminBadge>{getCategoryLabel(row.productCategory)}</AdminBadge>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <AdminButton variant="primary" onClick={() => openEdit(row)}>
                        Editar
                      </AdminButton>
                      <Link
                        href={`/es/proyectos/${row.id}`}
                        target="_blank"
                        className="inline-flex min-h-11 items-center rounded-xl border border-navy/20 px-3 text-sm font-medium text-navy"
                      >
                        Ver en sitio
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            />

            <AdminPagination
              page={data.page}
              totalPages={data.totalPages}
              from={data.from}
              to={data.to}
              totalItems={data.total}
              itemLabel="proyectos"
              onPageChange={setPage}
            />
          </>
        )}
      </AdminPanel>

      <AdminModal
        open={Boolean(editing && form)}
        title="Editar proyecto"
        description={editingProject ? editingProject.id : undefined}
        onClose={closeEdit}
        size="lg"
        footer={
          <>
            <AdminButton variant="secondary" onClick={closeEdit} disabled={saving}>
              Cancelar
            </AdminButton>
            <AdminButton type="submit" form="project-edit-form" disabled={saving}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </AdminButton>
          </>
        }
      >
        {editingProject && form ? (
          <form id="project-edit-form" onSubmit={saveProject} className="space-y-4">
            {feedback ? <AdminStatusMessage type={feedback.type} message={feedback.message} /> : null}
            <div>
              <p className="mb-2 text-sm font-medium text-navy">
                Galería — clic para portada · botón × para eliminar
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {editingProject.gallery.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className={`group relative aspect-square overflow-hidden rounded-xl border-2 bg-surface-muted ${
                      form.coverIndex === index ? "border-gold ring-2 ring-gold/30" : "border-transparent"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, coverIndex: index })}
                      className="absolute inset-0 z-0"
                      title={`Imagen ${index + 1} — elegir como portada`}
                    >
                      <AdminMediaImage
                        src={src}
                        version={previewVersion}
                        sizes="96px"
                        fileMissing={editingProject.galleryFileMissing?.[index]}
                        emptyLabel="Archivo ausente"
                      />
                    </button>
                    {editingProject.gallery.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setDeletePhotoIndex(index)}
                        className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white opacity-90 shadow hover:bg-red-700 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Eliminar esta foto"
                        aria-label={`Eliminar imagen ${index + 1}`}
                      >
                        ×
                      </button>
                    ) : null}
                    {form.coverIndex === index ? (
                      <span className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 bg-navy/90 py-0.5 text-center text-[10px] font-semibold text-gold">
                        Portada
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <AdminImageUpload
              action="add-project"
              projectId={editingProject.id}
              label="Subir nueva foto"
              variant="secondary"
              onSuccess={async (result) => {
                const nextSrc =
                  typeof result.src === "string" && result.src.trim()
                    ? result.src.trim()
                    : null;
                if (nextSrc) {
                  setEditing((current) =>
                    current
                      ? {
                          ...current,
                          gallery: [...current.gallery, nextSrc],
                          galleryFileMissing: [
                            ...(current.galleryFileMissing ??
                              current.gallery.map(() => false)),
                            false,
                          ],
                        }
                      : current,
                  );
                }
                setPreviewVersion((v) => v + 1);
                setFeedback({ type: "success", message: "Foto agregada al proyecto." });
                await refreshEditingProject();
              }}
              onError={(msg) => setFeedback({ type: "error", message: msg })}
            />

            <AdminField label="Nombre del proyecto" htmlFor="edit-name" hint="Título visible en el sitio. Puedes dejarlo igual y guardar otros cambios.">
              <input
                id="edit-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={adminInputClass}
                placeholder="Nombre del proyecto"
              />
            </AdminField>

            <label className="flex min-h-11 items-center gap-3 rounded-xl border border-navy/10 bg-surface px-3 text-sm">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              Mostrar como destacado en la página de inicio
            </label>

            <AdminField label="Categoría" htmlFor="edit-category">
              <select
                id="edit-category"
                value={form.productCategory}
                onChange={(e) => setForm({ ...form, productCategory: e.target.value })}
                className={adminInputClass}
              >
                {projectCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </AdminField>

            <p className="text-xs text-grey">
              {editingProject.gallery.length} fotos · Portada: imagen {form.coverIndex + 1}
            </p>
          </form>
        ) : null}
      </AdminModal>

      <AdminConfirmDialog
        open={deletePhotoIndex != null}
        title="Eliminar foto"
        message={
          editingProject && deletePhotoIndex != null
            ? `¿Eliminar la imagen ${deletePhotoIndex + 1} de "${editingProject.name}"? Se borrará del sitio y del servidor.`
            : "¿Eliminar esta foto?"
        }
        confirmLabel="Eliminar"
        danger
        loading={deletingPhoto}
        onConfirm={confirmDeletePhoto}
        onCancel={() => setDeletePhotoIndex(null)}
      />
    </AdminShell>
  );
}
