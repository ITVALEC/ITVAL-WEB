"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
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
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminPagination,
  AdminSearchField,
  AdminStatusMessage,
  AdminTabList,
} from "@/components/admin/AdminUi";
import type { AdminMediaItem, MediaKind } from "@/app/api/admin/media/route";

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

function cacheBust(src: string, version: number) {
  return version ? `${src}?v=${version}` : src;
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
  }, [kind]);

  const load = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    const params = new URLSearchParams({ page: String(page), pageSize: "24" });
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (kind !== "all") params.set("kind", kind);
    if (filterCategory) params.set("category", filterCategory);
    if (filterSubcategory) params.set("subcategory", filterSubcategory);

    const res = await fetch(`/api/admin/media?${params.toString()}`);
    if (res.ok) {
      setData(await res.json());
    } else {
      setFeedback({ type: "error", message: "No se pudieron cargar las fotos." });
    }
    setLoading(false);
  }, [page, debouncedQuery, kind, filterCategory, filterSubcategory]);

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
          description="Haz clic en una imagen para reemplazarla, editar el texto o eliminarla."
        />

        {(filterCategory || filterSubcategory) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-cornflower/30 bg-cornflower/5 px-3 py-2 text-sm text-navy">
            <span>
              Filtro: {filterCategory}
              {filterSubcategory ? ` / ${filterSubcategory}` : ""}
            </span>
            <Link href="/admin/imagenes" className="font-semibold text-cornflower underline">
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
            Subir foto a un producto →
          </Link>
        </div>

        <div className="mb-4 space-y-4">
          <AdminTabList
            label="Tipo de foto"
            options={KIND_TABS.map((tab) => ({ value: tab.id, label: tab.label }))}
            value={kind}
            onChange={(id) => setKind(id)}
          />
          <AdminSearchField
            id="admin-media-search"
            label="Buscar"
            hint="Por nombre de obra, producto o archivo."
            value={query}
            onChange={setQuery}
            placeholder="Ej: Quito, Icon, muro cortina…"
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
              debouncedQuery
                ? "No hay coincidencias con la búsqueda."
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
                      <Image
                        src={cacheBust(item.src, previewVersion)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="25vw"
                        unoptimized
                      />
                    </div>
                    <div className="p-2.5">
                      <AdminBadge>{KIND_LABELS[item.kind]}</AdminBadge>
                      <p className="mt-1 line-clamp-1 text-sm font-medium text-navy">{item.title}</p>
                      <p className="line-clamp-1 text-xs text-grey">{item.subtitle}</p>
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
        description={editing?.subtitle}
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
                {saving ? "Guardando…" : "Guardar texto"}
              </AdminButton>
            ) : null}
          </>
        }
      >
        {editing ? (
          <div className="space-y-4">
            <div className="relative mx-auto h-52 w-full max-w-md overflow-hidden rounded-lg bg-slate-100">
              <Image
                src={cacheBust(editing.src, previewVersion)}
                alt=""
                fill
                className="object-contain"
                sizes="448px"
                unoptimized
              />
            </div>

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
              <form id="media-edit-form" onSubmit={saveCaption}>
                <AdminField
                  label={editing.kind === "project" ? "Texto de la obra" : "Texto bajo la foto"}
                  htmlFor="edit-caption"
                >
                  <input
                    id="edit-caption"
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className={adminInputClass}
                  />
                </AdminField>
              </form>
            ) : (
              <p className="text-sm text-grey-dark">
                Portada de catálogo: solo puedes reemplazar el archivo.
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
