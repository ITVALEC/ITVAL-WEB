"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AdminField,
  AdminPanel,
  AdminShell,
  adminInputClass,
} from "@/components/admin/AdminShell";
import {
  AdminBadge,
  AdminButton,
  AdminConfirmDialog,
  AdminCrudToolbar,
  AdminModal,
} from "@/components/admin/AdminCrud";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminMediaImage } from "@/components/admin/AdminMediaImage";
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminPagination,
  AdminSearchField,
  AdminStatusMessage,
  AdminTabList,
} from "@/components/admin/AdminUi";
import type { AdminMediaItem, MediaKind } from "@/app/api/admin/media/route";
import {
  getProductCategoryLabel,
  getSubcategoryLabel,
} from "@/lib/admin/product-labels";
import taxonomy from "@/lib/catalog/taxonomy.json";

type MediaResponse = {
  items: AdminMediaItem[];
  total: number;
  page: number;
  totalPages: number;
  from: number;
  to: number;
};

const KIND_TABS: { id: "all" | MediaKind; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "project", label: "Obras" },
  { id: "product", label: "Productos" },
  { id: "hero", label: "Portadas" },
];

const KIND_LABELS: Record<MediaKind, string> = {
  project: "Obra",
  product: "Producto",
  hero: "Portada",
  other: "Otro",
};

const CATEGORY_OPTIONS = Object.keys(taxonomy).map((key) => ({
  value: key,
  label: getProductCategoryLabel(key),
}));

function mediaBadgeLabel(item: AdminMediaItem): string {
  if (item.kind === "hero" && item.heroType === "subcategory") {
    return "Portada producto";
  }
  if (item.kind === "hero" && item.heroType === "category") {
    return "Portada categoría";
  }
  return KIND_LABELS[item.kind];
}

/** Nombre amigable sugerido (reemplaza códigos tipo DSC02839). */
function suggestPhotoName(item: AdminMediaItem): string {
  if (item.kind === "project") {
    return item.title.trim() || "Obra";
  }

  let productLabel = item.title;
  if (item.category && item.subcategory) {
    productLabel = getSubcategoryLabel(item.category, item.subcategory);
  } else if (item.subtitle.includes(" · ")) {
    productLabel = item.subtitle.split(" · ").pop()?.trim() || item.title;
  }

  if (item.kind === "product" && item.productIndex != null) {
    return `${productLabel} ${item.productIndex + 1}`;
  }
  return productLabel;
}

function associationLabel(item: AdminMediaItem): string | null {
  if (item.category && item.subcategory) {
    return `${getProductCategoryLabel(item.category)} · ${getSubcategoryLabel(item.category, item.subcategory)}`;
  }
  if (item.category) {
    return getProductCategoryLabel(item.category);
  }
  if (item.kind === "project") {
    return item.subtitle || null;
  }
  return item.subtitle || null;
}

export default function AdminImagenesPage() {
  const searchParams = useSearchParams();
  const filterCategory = searchParams.get("category")?.trim() || undefined;
  const filterSubcategory = searchParams.get("subcategory")?.trim() || undefined;
  const urlKind = searchParams.get("kind") as MediaKind | "all" | null;

  const [data, setData] = useState<MediaResponse | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [kind, setKind] = useState<"all" | MediaKind>(
    urlKind && urlKind !== "all" ? urlKind : "all",
  );
  const [categoryFilter, setCategoryFilter] = useState(filterCategory ?? "");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editing, setEditing] = useState<AdminMediaItem | null>(null);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminMediaItem | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [kind, categoryFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    const params = new URLSearchParams({ page: String(page), pageSize: "24" });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (kind !== "all") params.set("kind", kind);
    const activeCategory = categoryFilter || filterCategory;
    if (activeCategory) params.set("category", activeCategory);
    if (filterSubcategory) params.set("subcategory", filterSubcategory);

    const res = await fetch(`/api/admin/media?${params.toString()}`);
    if (res.ok) {
      setData(await res.json());
    } else {
      setFeedback({ type: "error", message: "No se pudieron cargar las fotos." });
    }
    setLoading(false);
  }, [page, debouncedQuery, kind, categoryFilter, filterCategory, filterSubcategory]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(item: AdminMediaItem) {
    setEditing(item);
    setCaption(item.caption);
  }

  function closeEdit() {
    setEditing(null);
    setCaption("");
  }

  async function saveCaption(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    const res = await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, caption }),
    });
    setSaving(false);

    if (res.ok) {
      setFeedback({ type: "success", message: "Cambios guardados." });
      closeEdit();
      load();
    } else {
      setFeedback({ type: "error", message: "No se pudo guardar." });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    const res = await fetch(`/api/admin/media?id=${encodeURIComponent(deleteTarget.id)}`, {
      method: "DELETE",
    });
    setSaving(false);

    if (res.ok) {
      setDeleteTarget(null);
      setFeedback({ type: "success", message: "Foto eliminada." });
      closeEdit();
      load();
    } else {
      const body = await res.json();
      setFeedback({ type: "error", message: body.error ?? "No se pudo eliminar." });
      setDeleteTarget(null);
    }
  }

  return (
    <AdminShell title="Fotos del sitio">
      <AdminPanel>
        <AdminCrudToolbar
          title="Todas las fotos"
          description="Productos incluye fotos de producto y portadas de cada solución (por categoría). Obras = proyectos. Usa el filtro de categoría para acotar."
        />

        {(filterCategory || filterSubcategory) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-cornflower/30 bg-cornflower/5 px-3 py-2 text-sm text-navy">
            <span>
              Filtrado:{" "}
              {filterCategory ? getProductCategoryLabel(filterCategory) : "Todas"}
              {filterSubcategory && filterCategory
                ? ` · ${getSubcategoryLabel(filterCategory, filterSubcategory)}`
                : filterSubcategory
                  ? ` · ${filterSubcategory}`
                  : ""}
            </span>
            <Link href="/admin/imagenes" className="font-semibold text-cornflower-ink underline">
              Ver todas
            </Link>
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <Link
            href="/admin/projects"
            className="rounded-lg border border-grey/25 bg-slate-50 px-3 py-2 font-medium text-navy hover:bg-white"
          >
            Subir foto a una obra →
          </Link>
          <Link
            href="/admin/catalogo"
            className="rounded-lg border border-grey/25 bg-slate-50 px-3 py-2 font-medium text-navy hover:bg-white"
          >
            Subir foto de producto (por categoría) →
          </Link>
        </div>

        <div className="mb-4 space-y-4">
          <AdminTabList
            label="Tipo de foto"
            options={KIND_TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
            value={kind}
            onChange={(id) => setKind(id)}
          />

          {(kind === "product" || kind === "hero" || kind === "all") && !filterCategory ? (
            <AdminField label="Categoría de producto" htmlFor="media-category-filter">
              <select
                id="media-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={adminInputClass}
              >
                <option value="">Todas las categorías</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </AdminField>
          ) : null}

          <AdminSearchField
            id="admin-media-search"
            label="Buscar"
            hint="Por categoría, producto, obra o nombre de archivo."
            value={query}
            onChange={setQuery}
            placeholder="Ej: fachadas, muro cortina, Quito…"
            resultsCount={data?.total}
            resultsLabel={data?.total === 1 ? "foto" : "fotos"}
          />
          {feedback ? <AdminStatusMessage type={feedback.type} message={feedback.message} /> : null}
        </div>

        {loading ? (
          <AdminLoadingState label="Cargando fotos…" />
        ) : !data || data.items.length === 0 ? (
          <AdminEmptyState
            title="Sin fotos"
            description={
              debouncedQuery || categoryFilter
                ? "No hay coincidencias con la búsqueda o categoría."
                : kind === "product"
                  ? "Aún no hay fotos de producto. Sube desde Catálogo (elige la categoría y el producto)."
                  : "No hay fotos en esta sección."
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-xl border border-grey/20 bg-white shadow-sm transition hover:border-cornflower/50 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower"
                  >
                    <div className="relative aspect-[4/3] bg-slate-100">
                      <AdminMediaImage
                        src={item.src}
                        version={previewVersion}
                        className="object-cover"
                        sizes="25vw"
                      />
                    </div>
                    <div className="p-2.5">
                      <AdminBadge>{mediaBadgeLabel(item)}</AdminBadge>
                      <p className="mt-1 line-clamp-1 text-sm font-medium text-navy">
                        {item.caption?.trim() || item.title}
                      </p>
                      <p className="line-clamp-1 text-xs text-grey">
                        {associationLabel(item) ?? item.subtitle}
                      </p>
                    </div>
                  </button>
                  {item.kind !== "hero" ? (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-base font-bold text-white shadow hover:bg-red-700"
                      title="Eliminar"
                      aria-label={`Eliminar ${item.title}`}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <AdminPagination
              page={data.page}
              totalPages={data.totalPages}
              from={data.from}
              to={data.to}
              totalItems={data.total}
              itemLabel="fotos"
              onPageChange={setPage}
            />
          </>
        )}
      </AdminPanel>

      <AdminModal
        open={Boolean(editing)}
        title="Editar foto"
        description={editing ? associationLabel(editing) ?? editing.subtitle : undefined}
        onClose={closeEdit}
        footer={
          <>
            {editing?.kind !== "hero" ? (
              <AdminButton variant="danger" onClick={() => setDeleteTarget(editing)} disabled={saving}>
                Eliminar
              </AdminButton>
            ) : null}
            <AdminButton variant="secondary" onClick={closeEdit} disabled={saving}>
              Cerrar
            </AdminButton>
            {editing?.kind !== "hero" ? (
              <AdminButton type="submit" form="media-edit-form" disabled={saving}>
                {saving ? "Guardando…" : "Guardar nombre"}
              </AdminButton>
            ) : null}
          </>
        }
      >
        {editing ? (
          <div className="space-y-4">
            <div className="relative mx-auto h-52 w-full max-w-md overflow-hidden rounded-lg bg-slate-100">
              <AdminMediaImage
                src={editing.src}
                version={previewVersion}
                className="object-contain"
                sizes="448px"
              />
            </div>

            {associationLabel(editing) ? (
              <p className="rounded-lg border border-grey/20 bg-slate-50 px-3 py-2 text-sm text-navy">
                <span className="font-semibold">Asociación: </span>
                {associationLabel(editing)}
              </p>
            ) : null}

            <AdminImageUpload
              action="replace"
              mediaId={editing.id}
              label="Reemplazar con otra foto"
              variant="primary"
              onSuccess={() => {
                setPreviewVersion((v) => v + 1);
                setFeedback({ type: "success", message: "Foto reemplazada." });
                load();
              }}
              onError={(msg) => setFeedback({ type: "error", message: msg })}
            />

            {editing.kind !== "hero" ? (
              <form id="media-edit-form" onSubmit={saveCaption} className="space-y-2">
                <AdminField
                  label={editing.kind === "project" ? "Nombre de la foto (obra)" : "Nombre de la foto"}
                  htmlFor="edit-caption"
                  hint="Texto visible en el sitio. No cambia el archivo en disco."
                >
                  <input
                    id="edit-caption"
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className={adminInputClass}
                    placeholder="Ej: Muro cortina Stick 1"
                  />
                </AdminField>
                <AdminButton
                  type="button"
                  variant="secondary"
                  onClick={() => setCaption(suggestPhotoName(editing))}
                >
                  Sugerir nombre
                </AdminButton>
              </form>
            ) : (
              <p className="text-sm text-grey-dark">
                Portada de catálogo: solo puedes reemplazar el archivo. El nombre visible es el del producto o categoría.
              </p>
            )}
          </div>
        ) : null}
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar foto"
        message="¿Quitar esta foto del sitio? Se borrará del catálogo y del servidor."
        confirmLabel="Eliminar"
        danger
        loading={saving}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminShell>
  );
}
