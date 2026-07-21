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
import type {
  CatalogCategoryItem,
  CatalogSubcategoryItem,
  CatalogFilterOptions,
  CatalogFilterSelection,
} from "@/app/api/admin/catalog/route";

type EditTarget =
  | { type: "category"; item: CatalogCategoryItem }
  | { type: "subcategory"; item: CatalogSubcategoryItem };

const EMPTY_FILTERS: CatalogFilterSelection = {
  primaryGroup: "other",
  sectors: [],
  materials: [],
  systems: [],
  applications: [],
};

function optionLabel(
  options: { value: string; label: string }[] | undefined,
  value: string,
): string {
  return options?.find((opt) => opt.value === value)?.label ?? value;
}

function FilterCheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wide text-grey">
        {label}
      </legend>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <label key={opt.value} className="flex items-center gap-1.5 text-sm text-navy">
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(
                    checked
                      ? selected.filter((v) => v !== opt.value)
                      : [...selected, opt.value],
                  )
                }
                className="h-4 w-4 rounded border-grey/40 text-navy focus:ring-cornflower"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function suggestKey(label: string): string {
  const words = label
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9\s]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "nuevaCategoria";
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 40);
}

export default function AdminCatalogoPage() {
  const [categories, setCategories] = useState<CatalogCategoryItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<CatalogFilterOptions | null>(null);
  const [editFilters, setEditFilters] = useState<CatalogFilterSelection>(EMPTY_FILTERS);
  const [newCatGroup, setNewCatGroup] = useState("other");
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
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createSubOpen, setCreateSubOpen] = useState(false);
  const [newCatKey, setNewCatKey] = useState("");
  const [newSubKey, setNewSubKey] = useState("");
  const [newSubOnlyKey, setNewSubOnlyKey] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/catalog");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
      setFilterOptions(data.filterOptions ?? null);
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
    setFeedback(null);
    setEditing(target);
    setLocaleTab("es");
    setTitleEs(target.item.titleEs);
    setTitleEn(target.item.titleEn);
    setDescriptionEs(target.item.descriptionEs);
    setDescriptionEn(target.item.descriptionEn);
    setEditFilters({
      primaryGroup: target.item.filters?.primaryGroup ?? "other",
      sectors: [...(target.item.filters?.sectors ?? [])],
      materials: [...(target.item.filters?.materials ?? [])],
      systems: [...(target.item.filters?.systems ?? [])],
      applications: [...(target.item.filters?.applications ?? [])],
    });
  }

  function closeEdit() {
    setEditing(null);
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    // Las subcategorías no sobreescriben el grupo del explorador de su categoría.
    const subcategoryFilters = {
      sectors: editFilters.sectors,
      materials: editFilters.materials,
      systems: editFilters.systems,
      applications: editFilters.applications,
    };
    const body =
      editing.type === "category"
        ? {
            type: "category" as const,
            categoryKey: editing.item.key,
            titleEs,
            titleEn,
            descriptionEs,
            descriptionEn,
            filters: editFilters,
          }
        : {
            type: "subcategory" as const,
            categoryKey: editing.item.categoryKey,
            subcategoryKey: editing.item.key,
            titleEs,
            titleEn,
            descriptionEs,
            descriptionEn,
            filters: subcategoryFilters,
          };

    const res = await fetch("/api/admin/catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (res.ok) {
      setFeedback({
        type: "success",
        message: "Cambios guardados. Nombres y filtros actualizados en el sitio.",
      });
      closeEdit();
      load();
    } else {
      const data = await res.json();
      setFeedback({ type: "error", message: data.error ?? "No se pudo guardar." });
    }
  }

  async function submitNewCategory(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add-category",
        key: newCatKey.trim(),
        titleEs,
        titleEn,
        descriptionEs,
        descriptionEn,
        subcategoryKey: newSubKey.trim(),
        subTitleEs: titleEs,
        subTitleEn: titleEn,
        primaryGroup: newCatGroup,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
      setSelectedCategory(newCatKey.trim());
      setFeedback({
        type: "success",
        message: "Categoría creada. Reinicia el servidor (o haz deploy) para ver la nueva página en el sitio.",
      });
      setCreateCategoryOpen(false);
      setNewCatKey("");
      setNewSubKey("");
    } else {
      const data = await res.json();
      setFeedback({ type: "error", message: data.error ?? "No se pudo crear." });
    }
  }

  async function submitNewSubcategory(event: React.FormEvent) {
    event.preventDefault();
    if (!activeCategory) return;
    setSaving(true);
    const res = await fetch("/api/admin/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add-subcategory",
        categoryKey: activeCategory.key,
        key: newSubOnlyKey.trim(),
        titleEs,
        titleEn,
        descriptionEs,
        descriptionEn,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
      setFeedback({
        type: "success",
        message: "Subcategoría creada. Reinicia el servidor para ver la nueva página.",
      });
      setCreateSubOpen(false);
      setNewSubOnlyKey("");
      load();
    } else {
      const data = await res.json();
      setFeedback({ type: "error", message: data.error ?? "No se pudo crear." });
    }
  }

  return (
    <AdminShell title="Catálogo de productos">
      <AdminPanel>
        <AdminCrudToolbar
          title="Líneas de producto"
          description="Edita nombres o agrega categorías y productos nuevos."
          action={
            <AdminButton onClick={() => {
              setFeedback(null);
              setCreateCategoryOpen(true);
              setTitleEs("");
              setTitleEn("");
              setDescriptionEs("");
              setDescriptionEn("");
              setNewCatKey("");
              setNewSubKey("");
              setNewCatGroup("other");
            }}>
              + Nueva categoría
            </AdminButton>
          }
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
                  aria-pressed={activeCategory?.key === cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower focus-visible:ring-offset-2 ${
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
                      {activeCategory.filters ? (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="text-grey">Explorador:</span>
                          <AdminBadge>
                            {optionLabel(filterOptions?.primaryGroups, activeCategory.filters.primaryGroup)}
                          </AdminBadge>
                          {activeCategory.filters.sectors.map((key) => (
                            <span key={key} className="rounded-full bg-slate-100 px-2 py-0.5 text-grey-dark">
                              {optionLabel(filterOptions?.sectors, key)}
                            </span>
                          ))}
                        </div>
                      ) : null}
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-navy">Subcategorías (productos específicos)</h4>
                    <AdminButton
                      variant="secondary"
                      onClick={() => {
                        setFeedback(null);
                        setCreateSubOpen(true);
                        setTitleEs("");
                        setTitleEn("");
                        setDescriptionEs("");
                        setDescriptionEn("");
                        setNewSubOnlyKey("");
                      }}
                    >
                      + Nueva subcategoría
                    </AdminButton>
                  </div>
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
                        {sub.filters ? (
                          <p className="mt-1 text-xs text-grey">
                            Filtros:{" "}
                            {[
                              ...sub.filters.systems.map((key) => optionLabel(filterOptions?.systems, key)),
                              ...sub.filters.applications.map((key) =>
                                optionLabel(filterOptions?.applications, key),
                              ),
                            ].join(", ")}
                          </p>
                        ) : null}
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
                          className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-cornflower-ink hover:bg-cornflower/10"
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

            {filterOptions ? (
              <div className="space-y-4 rounded-xl border border-grey/20 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-navy">Filtros del explorador</p>
                  <p className="mt-0.5 text-xs text-grey-dark">
                    Controlan cómo aparece en el buscador de productos (español e inglés se traducen solos).
                  </p>
                </div>
                {editing.type === "category" ? (
                  <AdminField label="Grupo en el explorador" htmlFor="edit-primary-group">
                    <select
                      id="edit-primary-group"
                      value={editFilters.primaryGroup}
                      onChange={(e) =>
                        setEditFilters((prev) => ({ ...prev, primaryGroup: e.target.value }))
                      }
                      className={adminInputClass}
                    >
                      {filterOptions.primaryGroups.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                ) : null}
                <FilterCheckboxGroup
                  label="Sector"
                  options={filterOptions.sectors}
                  selected={editFilters.sectors}
                  onChange={(sectors) => setEditFilters((prev) => ({ ...prev, sectors }))}
                />
                <FilterCheckboxGroup
                  label="Material"
                  options={filterOptions.materials}
                  selected={editFilters.materials}
                  onChange={(materials) => setEditFilters((prev) => ({ ...prev, materials }))}
                />
                <FilterCheckboxGroup
                  label="Sistema"
                  options={filterOptions.systems}
                  selected={editFilters.systems}
                  onChange={(systems) => setEditFilters((prev) => ({ ...prev, systems }))}
                />
                <FilterCheckboxGroup
                  label="Aplicación"
                  options={filterOptions.applications}
                  selected={editFilters.applications}
                  onChange={(applications) => setEditFilters((prev) => ({ ...prev, applications }))}
                />
                <p className="text-xs text-grey">
                  Si dejas una lista vacía se usan los filtros por defecto de la categoría.
                </p>
              </div>
            ) : null}
          </form>
        ) : null}
      </AdminModal>

      <AdminModal
        open={createCategoryOpen}
        title="Nueva categoría"
        description="Crea una línea de producto con su primera subcategoría."
        onClose={() => setCreateCategoryOpen(false)}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setCreateCategoryOpen(false)} disabled={saving}>
              Cancelar
            </AdminButton>
            <AdminButton type="submit" form="new-category-form" disabled={saving}>
              {saving ? "Creando…" : "Crear categoría"}
            </AdminButton>
          </>
        }
      >
        <form id="new-category-form" onSubmit={submitNewCategory} className="space-y-4">
          <AdminField label="Nombre en español" htmlFor="new-cat-es">
            <input
              id="new-cat-es"
              type="text"
              value={titleEs}
              onChange={(e) => {
                setTitleEs(e.target.value);
                if (!newCatKey) setNewCatKey(suggestKey(e.target.value));
                if (!newSubKey) setNewSubKey(suggestKey(e.target.value));
              }}
              className={adminInputClass}
              required
              placeholder="Ej: Carpintería de aluminio"
            />
          </AdminField>
          <AdminField label="Nombre en inglés" htmlFor="new-cat-en">
            <input id="new-cat-en" type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={adminInputClass} required />
          </AdminField>
          <AdminField label="Código interno (categoría)" htmlFor="new-cat-key" hint="Solo letras/números, empieza en minúscula. Ej: carpinteriaAluminio">
            <input id="new-cat-key" type="text" value={newCatKey} onChange={(e) => setNewCatKey(e.target.value)} className={adminInputClass} required pattern="[a-z][a-zA-Z0-9]*" />
          </AdminField>
          <AdminField label="Código primera subcategoría" htmlFor="new-sub-key">
            <input id="new-sub-key" type="text" value={newSubKey} onChange={(e) => setNewSubKey(e.target.value)} className={adminInputClass} required pattern="[a-z][a-zA-Z0-9]*" />
          </AdminField>
          {filterOptions ? (
            <AdminField
              label="Grupo en el explorador"
              htmlFor="new-cat-group"
              hint="Chip del buscador de productos donde aparecerá esta categoría."
            >
              <select
                id="new-cat-group"
                value={newCatGroup}
                onChange={(e) => setNewCatGroup(e.target.value)}
                className={adminInputClass}
              >
                {filterOptions.primaryGroups.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </AdminField>
          ) : null}
          <AdminField label="Descripción (ES)" htmlFor="new-cat-desc">
            <textarea id="new-cat-desc" value={descriptionEs} onChange={(e) => setDescriptionEs(e.target.value)} className={adminTextareaClass} rows={3} />
          </AdminField>
        </form>
      </AdminModal>

      <AdminModal
        open={createSubOpen}
        title={activeCategory ? `Nueva subcategoría — ${activeCategory.titleEs}` : "Nueva subcategoría"}
        onClose={() => setCreateSubOpen(false)}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setCreateSubOpen(false)} disabled={saving}>
              Cancelar
            </AdminButton>
            <AdminButton type="submit" form="new-sub-form" disabled={saving}>
              {saving ? "Creando…" : "Crear"}
            </AdminButton>
          </>
        }
      >
        <form id="new-sub-form" onSubmit={submitNewSubcategory} className="space-y-4">
          <AdminField label="Nombre en español" htmlFor="new-sub-es">
            <input
              id="new-sub-es"
              type="text"
              value={titleEs}
              onChange={(e) => {
                setTitleEs(e.target.value);
                if (!newSubOnlyKey) setNewSubOnlyKey(suggestKey(e.target.value));
              }}
              className={adminInputClass}
              required
            />
          </AdminField>
          <AdminField label="Nombre en inglés" htmlFor="new-sub-en">
            <input id="new-sub-en" type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={adminInputClass} required />
          </AdminField>
          <AdminField label="Código interno" htmlFor="new-sub-only-key">
            <input id="new-sub-only-key" type="text" value={newSubOnlyKey} onChange={(e) => setNewSubOnlyKey(e.target.value)} className={adminInputClass} required pattern="[a-z][a-zA-Z0-9]*" />
          </AdminField>
          <AdminField label="Descripción (ES)" htmlFor="new-sub-desc">
            <textarea id="new-sub-desc" value={descriptionEs} onChange={(e) => setDescriptionEs(e.target.value)} className={adminTextareaClass} rows={3} />
          </AdminField>
        </form>
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
