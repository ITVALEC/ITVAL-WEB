"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AdminField,
  AdminPanel,
  AdminShell,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/AdminShell";
import {
  AdminBadge,
  AdminButton,
  AdminCrudToolbar,
  AdminModal,
} from "@/components/admin/AdminCrud";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminSearchField,
  AdminStatusMessage,
  AdminTabList,
} from "@/components/admin/AdminUi";
import type { CatalogCategoryItem, CatalogSubcategoryItem } from "@/app/api/admin/catalog/route";

type EditTarget =
  | { type: "category"; item: CatalogCategoryItem }
  | { type: "subcategory"; item: CatalogSubcategoryItem };

export default function AdminCatalogoPage() {
  const [categories, setCategories] = useState<CatalogCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [localeTab, setLocaleTab] = useState<"es" | "en">("es");
  const [titleEs, setTitleEs] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descriptionEs, setDescriptionEs] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadSub, setUploadSub] = useState<CatalogSubcategoryItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/catalog");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
      setSelectedCategory((current) => current ?? data.categories[0]?.key ?? null);
    } else {
      setFeedback({ type: "error", message: "No se pudo cargar el catálogo." });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = categories.filter((cat) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cat.titleEs.toLowerCase().includes(q) ||
      cat.key.toLowerCase().includes(q) ||
      cat.subcategories.some(
        (sub) =>
          sub.titleEs.toLowerCase().includes(q) || sub.key.toLowerCase().includes(q),
      )
    );
  });

  const activeCategory =
    filtered.find((c) => c.key === selectedCategory) ?? filtered[0] ?? null;

  function openEdit(target: EditTarget) {
    setEditing(target);
    setLocaleTab("es");
    if (target.type === "category") {
      setTitleEs(target.item.titleEs);
      setTitleEn(target.item.titleEn);
      setDescriptionEs(target.item.descriptionEs);
      setDescriptionEn(target.item.descriptionEn);
    } else {
      setTitleEs(target.item.titleEs);
      setTitleEn(target.item.titleEn);
      setDescriptionEs(target.item.descriptionEs);
      setDescriptionEn(target.item.descriptionEn);
    }
  }

  function closeEdit() {
    setEditing(null);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    const body =
      editing.type === "category"
        ? {
            type: "category" as const,
            categoryKey: editing.item.key,
            titleEs,
            titleEn,
            descriptionEs,
            descriptionEn,
          }
        : {
            type: "subcategory" as const,
            categoryKey: editing.item.categoryKey,
            subcategoryKey: editing.item.key,
            titleEs,
            titleEn,
            descriptionEs,
            descriptionEn,
          };

    const res = await fetch("/api/admin/catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (res.ok) {
      setFeedback({ type: "success", message: "Nombres actualizados en el sitio." });
      closeEdit();
      load();
    } else {
      const data = await res.json();
      setFeedback({ type: "error", message: data.error ?? "No se pudo guardar." });
    }
  }

  return (
    <AdminShell title="Catálogo de productos">
      <AdminPanel>
        <AdminCrudToolbar
          title="Líneas de producto"
          description="Aquí ves las categorías y subcategorías del catálogo. Edita los nombes que ven los clientes en español e inglés."
        />

        {feedback ? <AdminStatusMessage type={feedback.type} message={feedback.message} /> : null}

        <div className="mb-4">
          <AdminSearchField
            id="catalog-search"
            label="Buscar línea de producto"
            hint="Por nombre visible o código interno."
            value={query}
            onChange={setQuery}
            placeholder="Ej: muro cortina, fachadas, puertas…"
            resultsCount={filtered.length}
            resultsLabel={filtered.length === 1 ? "categoría" : "categorías"}
          />
        </div>

        {loading ? (
          <AdminLoadingState label="Cargando catálogo…" />
        ) : filtered.length === 0 ? (
          <AdminEmptyState title="Sin resultados" description="Prueba otro término de búsqueda." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
            <div className="space-y-1 rounded-xl border border-grey/20 bg-slate-50 p-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-grey">
                Categorías
              </p>
              {filtered.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    activeCategory?.key === cat.key
                      ? "bg-navy text-white"
                      : "text-navy hover:bg-white"
                  }`}
                >
                  <span className="font-medium">{cat.titleEs}</span>
                  <AdminBadge>{cat.subcategories.length}</AdminBadge>
                </button>
              ))}
            </div>

            {activeCategory ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-grey/20 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-navy">{activeCategory.titleEs}</h3>
                      <p className="mt-1 text-sm text-grey-dark">{activeCategory.descriptionEs}</p>
                      <p className="mt-2 text-xs text-grey">
                        {activeCategory.imageCount} fotos en galería · Código: {activeCategory.key}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeCategory.heroSrc ? (
                        <div className="relative h-16 w-24 overflow-hidden rounded-lg bg-slate-100">
                          <Image src={activeCategory.heroSrc} alt="" fill className="object-cover" sizes="96px" unoptimized />
                        </div>
                      ) : null}
                      <AdminButton variant="secondary" onClick={() => openEdit({ type: "category", item: activeCategory })}>
                        Editar categoría
                      </AdminButton>
                      <Link
                        href={`/admin/imagenes?kind=hero&category=${activeCategory.key}`}
                        className="inline-flex min-h-11 items-center rounded-lg border border-grey/30 px-3 text-sm font-semibold text-navy hover:bg-slate-50"
                      >
                        Ver portada
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-navy">Subcategorías (productos específicos)</h4>
                  {activeCategory.subcategories.map((sub) => (
                    <div
                      key={sub.key}
                      className="flex flex-col gap-3 rounded-xl border border-grey/20 bg-white p-4 sm:flex-row sm:items-center"
                    >
                      {sub.heroSrc ? (
                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <Image src={sub.heroSrc} alt="" fill className="object-cover" sizes="112px" unoptimized />
                        </div>
                      ) : (
                        <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-grey">
                          Sin portada
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-navy">{sub.titleEs}</p>
                        <p className="mt-0.5 line-clamp-2 text-sm text-grey-dark">{sub.descriptionEs}</p>
                        <p className="mt-1 text-xs text-grey">
                          {sub.imageCount} fotos · {sub.key}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
                        <AdminButton variant="secondary" onClick={() => openEdit({ type: "subcategory", item: sub })}>
                          Editar nombre
                        </AdminButton>
                        <AdminButton variant="ghost" onClick={() => setUploadSub(sub)}>
                          Subir foto
                        </AdminButton>
                        <Link
                          href={`/admin/imagenes?kind=product&category=${sub.categoryKey}&subcategory=${sub.key}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-cornflower hover:bg-cornflower/10"
                        >
                          Ver {sub.imageCount} fotos
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </AdminPanel>

      <AdminModal
        open={Boolean(editing)}
        title={editing?.type === "category" ? "Editar categoría" : "Editar subcategoría"}
        description="Los cambios se ven en el sitio público (español e inglés)."
        onClose={closeEdit}
        footer={
          <>
            <AdminButton variant="secondary" onClick={closeEdit} disabled={saving}>
              Cancelar
            </AdminButton>
            <AdminButton type="submit" form="catalog-edit-form" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </AdminButton>
          </>
        }
      >
        {editing ? (
          <form id="catalog-edit-form" onSubmit={saveEdit} className="space-y-4">
            <AdminTabList
              label="Idioma a editar"
              value={localeTab}
              onChange={setLocaleTab}
              options={[
                { value: "es", label: "Español" },
                { value: "en", label: "Inglés" },
              ]}
            />
            {localeTab === "es" ? (
              <>
                <AdminField label="Nombre en español" htmlFor="title-es">
                  <input id="title-es" type="text" value={titleEs} onChange={(e) => setTitleEs(e.target.value)} className={adminInputClass} required />
                </AdminField>
                <AdminField label="Descripción en español" htmlFor="desc-es">
                  <textarea id="desc-es" value={descriptionEs} onChange={(e) => setDescriptionEs(e.target.value)} className={adminTextareaClass} rows={4} />
                </AdminField>
              </>
            ) : (
              <>
                <AdminField label="Nombre en inglés" htmlFor="title-en">
                  <input id="title-en" type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={adminInputClass} required />
                </AdminField>
                <AdminField label="Descripción en inglés" htmlFor="desc-en">
                  <textarea id="desc-en" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className={adminTextareaClass} rows={4} />
                </AdminField>
              </>
            )}
          </form>
        ) : null}
      </AdminModal>

      <AdminModal
        open={Boolean(uploadSub)}
        title={uploadSub ? `Subir foto — ${uploadSub.titleEs}` : "Subir foto"}
        onClose={() => setUploadSub(null)}
        footer={<AdminButton variant="secondary" onClick={() => setUploadSub(null)}>Cerrar</AdminButton>}
      >
        {uploadSub ? (
          <div className="space-y-3">
            <p className="text-sm text-grey-dark">
              La foto se agregará a la galería de <strong>{uploadSub.titleEs}</strong>.
            </p>
            <AdminImageUpload
              action="add-product"
              category={uploadSub.categoryKey}
              subcategory={uploadSub.key}
              label="Elegir archivo desde tu computadora"
              variant="primary"
              onSuccess={() => {
                setFeedback({ type: "success", message: "Foto agregada al catálogo." });
                setUploadSub(null);
                load();
              }}
              onError={(msg) => setFeedback({ type: "error", message: msg })}
            />
          </div>
        ) : null}
      </AdminModal>
    </AdminShell>
  );
}
