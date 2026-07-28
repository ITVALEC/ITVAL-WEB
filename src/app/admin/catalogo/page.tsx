"use client";

import { useCallback, useEffect, useState } from "react";
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
  AdminConfirmDialog,
  AdminCrudToolbar,
  AdminModal,
} from "@/components/admin/AdminCrud";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { AdminMediaImage } from "@/components/admin/AdminMediaImage";
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
  CatalogHubTexts,
  PrimaryGroupLabelItem,
} from "@/app/api/admin/catalog/route";
import type { AdminMediaItem } from "@/app/api/admin/media/route";
import { MAX_PRODUCT_GALLERY_IMAGES } from "@/lib/catalog/product-images";

type EditTarget =
  | { type: "category"; item: CatalogCategoryItem }
  | { type: "subcategory"; item: CatalogSubcategoryItem };

type ProductMediaState = {
  cover: AdminMediaItem | null;
  gallery: AdminMediaItem[];
  loading: boolean;
};

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
  const [hub, setHub] = useState<CatalogHubTexts | null>(null);
  const [hubLocale, setHubLocale] = useState<"es" | "en">("es");
  const [hubTitleEs, setHubTitleEs] = useState("");
  const [hubTitleEn, setHubTitleEn] = useState("");
  const [hubSubtitleEs, setHubSubtitleEs] = useState("");
  const [hubSubtitleEn, setHubSubtitleEn] = useState("");
  const [primaryLabels, setPrimaryLabels] = useState<PrimaryGroupLabelItem[]>([]);
  const [primaryLabelsLocale, setPrimaryLabelsLocale] = useState<"es" | "en">("es");
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
  const [materialsEs, setMaterialsEs] = useState("");
  const [materialsEn, setMaterialsEn] = useState("");
  const [standardsEs, setStandardsEs] = useState("");
  const [standardsEn, setStandardsEn] = useState("");
  const [optionsEs, setOptionsEs] = useState("");
  const [optionsEn, setOptionsEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadSub, setUploadSub] = useState<CatalogSubcategoryItem | null>(null);
  const [productMedia, setProductMedia] = useState<ProductMediaState>({
    cover: null,
    gallery: [],
    loading: false,
  });
  const [deleteMediaTarget, setDeleteMediaTarget] = useState<AdminMediaItem | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
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
      setPrimaryLabels(data.primaryGroupLabels ?? []);
      if (data.hub) {
        setHub(data.hub);
        setHubTitleEs(data.hub.titleEs ?? "");
        setHubTitleEn(data.hub.titleEn ?? "");
        setHubSubtitleEs(data.hub.subtitleEs ?? "");
        setHubSubtitleEn(data.hub.subtitleEn ?? "");
      }
      setSelectedCategory((current) => current ?? data.categories[0]?.key ?? null);
    } else {
      setFeedback({ type: "error", message: "No se pudo cargar el catálogo." });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadProductMedia = useCallback(async (sub: CatalogSubcategoryItem) => {
    setProductMedia({ cover: null, gallery: [], loading: true });
    const params = new URLSearchParams({
      kind: "product",
      category: sub.categoryKey,
      subcategory: sub.key,
      pageSize: "50",
    });
    const res = await fetch(`/api/admin/media?${params.toString()}`);
    if (!res.ok) {
      setProductMedia({ cover: null, gallery: [], loading: false });
      setFeedback({ type: "error", message: "No se pudieron cargar las fotos del producto." });
      return;
    }
    const data = (await res.json()) as { items: AdminMediaItem[] };
    const cover =
      data.items.find(
        (item) => item.kind === "hero" && item.heroType === "subcategory",
      ) ?? null;
    const gallery = data.items.filter((item) => item.kind === "product");
    setProductMedia({ cover, gallery, loading: false });
  }, []);

  useEffect(() => {
    if (!uploadSub) return;
    loadProductMedia(uploadSub);
  }, [uploadSub, loadProductMedia]);

  async function confirmDeleteMedia() {
    if (!deleteMediaTarget || !uploadSub) return;
    setSaving(true);
    const res = await fetch(
      `/api/admin/media?id=${encodeURIComponent(deleteMediaTarget.id)}`,
      { method: "DELETE" },
    );
    setSaving(false);
    if (res.ok) {
      setDeleteMediaTarget(null);
      setFeedback({ type: "success", message: "Foto eliminada de la galería." });
      setPreviewVersion((v) => v + 1);
      loadProductMedia(uploadSub);
      load();
    } else {
      const body = await res.json();
      setFeedback({ type: "error", message: body.error ?? "No se pudo eliminar." });
      setDeleteMediaTarget(null);
    }
  }

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
    if (target.type === "subcategory") {
      setMaterialsEs(target.item.materialsEs);
      setMaterialsEn(target.item.materialsEn);
      setStandardsEs(target.item.standardsEs);
      setStandardsEn(target.item.standardsEn);
      setOptionsEs(target.item.optionsEs);
      setOptionsEn(target.item.optionsEn);
    } else {
      setMaterialsEs("");
      setMaterialsEn("");
      setStandardsEs("");
      setStandardsEn("");
      setOptionsEs("");
      setOptionsEn("");
    }
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

  async function saveHub(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "hub",
        titleEs: hubTitleEs,
        titleEn: hubTitleEn,
        subtitleEs: hubSubtitleEs,
        subtitleEn: hubSubtitleEn,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      if (data.hub) setHub(data.hub);
      setFeedback({
        type: "success",
        message: "Textos de la página Productos actualizados.",
      });
    } else {
      const data = await res.json();
      setFeedback({ type: "error", message: data.error ?? "No se pudo guardar." });
    }
  }

  async function savePrimaryLabels(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/catalog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "primary-labels",
        primaryGroupLabels: primaryLabels,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      if (data.primaryGroupLabels) setPrimaryLabels(data.primaryGroupLabels);
      if (data.filterOptions) setFilterOptions(data.filterOptions);
      setFeedback({
        type: "success",
        message: "Nombres de líneas actualizados. Las claves internas no cambiaron.",
      });
    } else {
      const data = await res.json();
      setFeedback({ type: "error", message: data.error ?? "No se pudo guardar." });
    }
  }

  function updatePrimaryLabel(
    key: string,
    field: "labelEs" | "labelEn",
    value: string,
  ) {
    setPrimaryLabels((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
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
            materialsEs,
            materialsEn,
            standardsEs,
            standardsEn,
            optionsEs,
            optionsEn,
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
        message:
          editing.type === "subcategory"
            ? "Ficha del producto actualizada (descripción, materiales, normas y opciones)."
            : "Cambios guardados. Nombres y filtros actualizados en el sitio.",
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
        message: "Producto creado. Reinicia el servidor para ver la nueva página.",
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
          title="Categorías y productos"
          description="Cada producto pertenece a una categoría. Edita datos (nombre/descripción) o gestiona portada + hasta 6 fotos de galería. Las obras se gestionan en Obras."
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

        {hub ? (
          <form
            onSubmit={saveHub}
            className="mb-6 space-y-4 rounded-xl border border-grey/20 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-navy">Página Productos (hero)</h3>
                <p className="mt-1 text-sm text-grey-dark">
                  Título y descripción del encabezado de la página de productos.
                </p>
              </div>
              <AdminButton type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar textos"}
              </AdminButton>
            </div>
            <AdminTabList
              label="Idioma del hero"
              value={hubLocale}
              onChange={setHubLocale}
              options={[
                { value: "es", label: "Español" },
                { value: "en", label: "Inglés" },
              ]}
            />
            {hubLocale === "es" ? (
              <>
                <AdminField label="Título (ES)" htmlFor="hub-title-es">
                  <input
                    id="hub-title-es"
                    type="text"
                    value={hubTitleEs}
                    onChange={(e) => setHubTitleEs(e.target.value)}
                    className={adminInputClass}
                    required
                  />
                </AdminField>
                <AdminField label="Descripción (ES)" htmlFor="hub-sub-es">
                  <textarea
                    id="hub-sub-es"
                    value={hubSubtitleEs}
                    onChange={(e) => setHubSubtitleEs(e.target.value)}
                    className={adminTextareaClass}
                    rows={3}
                  />
                </AdminField>
              </>
            ) : (
              <>
                <AdminField label="Título (EN)" htmlFor="hub-title-en">
                  <input
                    id="hub-title-en"
                    type="text"
                    value={hubTitleEn}
                    onChange={(e) => setHubTitleEn(e.target.value)}
                    className={adminInputClass}
                    required
                  />
                </AdminField>
                <AdminField label="Descripción (EN)" htmlFor="hub-sub-en">
                  <textarea
                    id="hub-sub-en"
                    value={hubSubtitleEn}
                    onChange={(e) => setHubSubtitleEn(e.target.value)}
                    className={adminTextareaClass}
                    rows={3}
                  />
                </AdminField>
              </>
            )}
          </form>
        ) : null}

        {primaryLabels.length > 0 ? (
          <form
            onSubmit={savePrimaryLabels}
            className="mb-6 space-y-4 rounded-xl border border-grey/20 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-navy">
                  Nombres de líneas (grupos)
                </h3>
                <p className="mt-1 text-sm text-grey-dark">
                  Etiquetas cortas visibles en el admin y filtros internos (Fachadas, Ventanas,
                  Cubiertas…). La clave (`facades`, `exteriors`, etc.) no cambia: las rutas
                  `/productos/...` se mantienen.
                </p>
              </div>
              <AdminButton type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar nombres"}
              </AdminButton>
            </div>
            <AdminTabList
              label="Idioma de las líneas"
              value={primaryLabelsLocale}
              onChange={setPrimaryLabelsLocale}
              options={[
                { value: "es", label: "Español" },
                { value: "en", label: "Inglés" },
              ]}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {primaryLabels.map((row) => (
                <AdminField
                  key={row.key}
                  label={`${row.key}`}
                  htmlFor={`primary-${primaryLabelsLocale}-${row.key}`}
                >
                  <input
                    id={`primary-${primaryLabelsLocale}-${row.key}`}
                    type="text"
                    value={primaryLabelsLocale === "es" ? row.labelEs : row.labelEn}
                    onChange={(e) =>
                      updatePrimaryLabel(
                        row.key,
                        primaryLabelsLocale === "es" ? "labelEs" : "labelEn",
                        e.target.value,
                      )
                    }
                    className={adminInputClass}
                    required
                  />
                </AdminField>
              ))}
            </div>
          </form>
        ) : null}

        <div className="mb-4">
          <AdminSearchField
            id="catalog-search"
            label="Buscar línea de producto"
            hint="Por nombre visible o código interno. Para renombrar una categoría: selecciónala → Editar nombre / datos."
            value={query}
            onChange={setQuery}
            placeholder="Ej: muro cortina, envolventes, puertas…"
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
                          <AdminMediaImage
                            src={activeCategory.heroSrc}
                            version={previewVersion}
                            sizes="96px"
                          />
                        </div>
                      ) : null}
                      <AdminButton variant="secondary" onClick={() => openEdit({ type: "category", item: activeCategory })}>
                        Editar nombre / datos
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
                    <div>
                      <h4 className="text-sm font-semibold text-navy">
                        Productos de {activeCategory.titleEs}
                      </h4>
                      <p className="text-xs text-grey">
                        Cada producto es una solución concreta dentro de esta categoría.
                      </p>
                    </div>
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
                      + Nuevo producto
                    </AdminButton>
                  </div>
                  {activeCategory.subcategories.map((sub) => (
                    <div
                      key={sub.key}
                      className="flex flex-col gap-3 rounded-xl border border-grey/20 bg-white p-4 sm:flex-row sm:items-center"
                    >
                      {sub.heroSrc ? (
                        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <AdminMediaImage
                            src={sub.heroSrc}
                            version={previewVersion}
                            sizes="112px"
                          />
                        </div>
                      ) : (
                        <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-grey">
                          Sin portada
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <AdminBadge>{activeCategory.titleEs}</AdminBadge>
                          <p className="font-semibold text-navy">{sub.titleEs}</p>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-sm text-grey-dark">{sub.descriptionEs}</p>
                        <p className="mt-1 text-xs text-grey">
                          Galería: {Math.min(sub.imageCount, MAX_PRODUCT_GALLERY_IMAGES)}/
                          {MAX_PRODUCT_GALLERY_IMAGES} fotos · código: {sub.key}
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
                          Editar datos
                        </AdminButton>
                        <AdminButton variant="ghost" onClick={() => setUploadSub(sub)}>
                          Portada y galería
                        </AdminButton>
                        <Link
                          href={`/admin/imagenes?kind=product&category=${encodeURIComponent(sub.categoryKey)}&subcategory=${encodeURIComponent(sub.key)}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-cornflower-ink hover:bg-cornflower/10"
                        >
                          Ver en Fotos
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
        title={editing?.type === "category" ? "Editar nombre de categoría" : "Editar producto"}
        description={
          editing?.type === "subcategory"
            ? `Pertenece a: ${
                categories.find((c) => c.key === editing.item.categoryKey)?.titleEs ??
                editing.item.categoryKey
              }. Edita la intro de la ficha, materiales, normas y opciones (ES/EN).`
            : "Cambia el nombre visible (ES/EN) sin alterar el código interno ni las rutas del sitio."
        }
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
            {editing.type === "subcategory" ? (
              <p className="rounded-lg border border-grey/20 bg-slate-50 px-3 py-2 text-sm text-navy">
                <span className="font-semibold">Categoría: </span>
                {categories.find((c) => c.key === editing.item.categoryKey)?.titleEs ??
                  editing.item.categoryKey}
              </p>
            ) : null}
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
                <AdminField
                  label={
                    editing.type === "subcategory"
                      ? "Descripción / intro de la ficha (español)"
                      : "Descripción en español"
                  }
                  htmlFor="desc-es"
                >
                  <textarea id="desc-es" value={descriptionEs} onChange={(e) => setDescriptionEs(e.target.value)} className={adminTextareaClass} rows={4} />
                </AdminField>
                {editing.type === "subcategory" ? (
                  <>
                    <AdminField label="Materiales (español)" htmlFor="materials-es">
                      <textarea
                        id="materials-es"
                        value={materialsEs}
                        onChange={(e) => setMaterialsEs(e.target.value)}
                        className={adminTextareaClass}
                        rows={3}
                      />
                    </AdminField>
                    <AdminField label="Normas técnicas (español)" htmlFor="standards-es">
                      <textarea
                        id="standards-es"
                        value={standardsEs}
                        onChange={(e) => setStandardsEs(e.target.value)}
                        className={adminTextareaClass}
                        rows={3}
                      />
                    </AdminField>
                    <AdminField label="Opciones y variantes (español)" htmlFor="options-es">
                      <textarea
                        id="options-es"
                        value={optionsEs}
                        onChange={(e) => setOptionsEs(e.target.value)}
                        className={adminTextareaClass}
                        rows={3}
                      />
                    </AdminField>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <AdminField label="Nombre en inglés" htmlFor="title-en">
                  <input id="title-en" type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={adminInputClass} required />
                </AdminField>
                <AdminField
                  label={
                    editing.type === "subcategory"
                      ? "Descripción / intro de la ficha (inglés)"
                      : "Descripción en inglés"
                  }
                  htmlFor="desc-en"
                >
                  <textarea id="desc-en" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className={adminTextareaClass} rows={4} />
                </AdminField>
                {editing.type === "subcategory" ? (
                  <>
                    <AdminField label="Materiales (inglés)" htmlFor="materials-en">
                      <textarea
                        id="materials-en"
                        value={materialsEn}
                        onChange={(e) => setMaterialsEn(e.target.value)}
                        className={adminTextareaClass}
                        rows={3}
                      />
                    </AdminField>
                    <AdminField label="Normas técnicas (inglés)" htmlFor="standards-en">
                      <textarea
                        id="standards-en"
                        value={standardsEn}
                        onChange={(e) => setStandardsEn(e.target.value)}
                        className={adminTextareaClass}
                        rows={3}
                      />
                    </AdminField>
                    <AdminField label="Opciones y variantes (inglés)" htmlFor="options-en">
                      <textarea
                        id="options-en"
                        value={optionsEn}
                        onChange={(e) => setOptionsEn(e.target.value)}
                        className={adminTextareaClass}
                        rows={3}
                      />
                    </AdminField>
                  </>
                ) : null}
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
        description="Crea una línea del catálogo con su primer producto."
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
          <AdminField label="Código del primer producto" htmlFor="new-sub-key" hint="Producto inicial dentro de esta categoría.">
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
        title={activeCategory ? `Nuevo producto — ${activeCategory.titleEs}` : "Nuevo producto"}
        description={
          activeCategory
            ? `Se creará dentro de la categoría «${activeCategory.titleEs}».`
            : undefined
        }
        onClose={() => setCreateSubOpen(false)}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setCreateSubOpen(false)} disabled={saving}>
              Cancelar
            </AdminButton>
            <AdminButton type="submit" form="new-sub-form" disabled={saving}>
              {saving ? "Creando…" : "Crear producto"}
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
        title={uploadSub ? `Fotos — ${uploadSub.titleEs}` : "Fotos del producto"}
        description="Portada del catálogo (1) y galería del producto (hasta 6 ángulos, sin nombres de obra)."
        onClose={() => {
          setUploadSub(null);
          setDeleteMediaTarget(null);
        }}
        footer={
          <AdminButton
            variant="secondary"
            onClick={() => {
              setUploadSub(null);
              setDeleteMediaTarget(null);
            }}
          >
            Cerrar
          </AdminButton>
        }
      >
        {uploadSub ? (
          <div className="space-y-6">
            {feedback ? (
              <AdminStatusMessage type={feedback.type} message={feedback.message} />
            ) : null}
            <p className="rounded-lg border border-cornflower/25 bg-cornflower/5 px-3 py-2 text-sm text-navy">
              <strong>Máximo {MAX_PRODUCT_GALLERY_IMAGES} fotos del producto (ángulos).</strong>{" "}
              Las obras y referencias se gestionan en <strong>Obras</strong>, no aquí.
            </p>

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-navy">1. Portada del producto</h3>
                <p className="text-xs text-grey">
                  Una sola imagen hero del catálogo y del encabezado de la ficha.
                </p>
              </div>
              {productMedia.loading ? (
                <p className="text-sm text-grey">Cargando…</p>
              ) : productMedia.cover ? (
                <div className="flex flex-wrap items-start gap-3 rounded-xl border border-grey/20 bg-slate-50 p-3">
                  <div className="relative h-24 w-32 overflow-hidden rounded-lg bg-white">
                    <AdminMediaImage
                      src={productMedia.cover.src}
                      version={previewVersion}
                      fileMissing={productMedia.cover.fileMissing}
                      sizes="128px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-medium text-navy">Portada actual</p>
                    <AdminImageUpload
                      action="replace"
                      mediaId={productMedia.cover.id}
                      label="Reemplazar portada"
                      variant="secondary"
                      onSuccess={() => {
                        setPreviewVersion((v) => v + 1);
                        setFeedback({ type: "success", message: "Portada actualizada." });
                        loadProductMedia(uploadSub);
                        load();
                      }}
                      onError={(msg) => setFeedback({ type: "error", message: msg })}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-grey-dark">
                  Sin portada registrada. Usa{" "}
                  <Link
                    href={`/admin/imagenes?kind=hero&category=${encodeURIComponent(uploadSub.categoryKey)}&subcategory=${encodeURIComponent(uploadSub.key)}`}
                    className="font-semibold text-cornflower-ink underline"
                  >
                    Fotos → Portadas
                  </Link>{" "}
                  o el listado de imágenes del producto.
                </p>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-navy">
                    2. Galería del producto ({productMedia.gallery.length}/
                    {MAX_PRODUCT_GALLERY_IMAGES})
                  </h3>
                  <p className="text-xs text-grey">
                    Foto 1…Foto {MAX_PRODUCT_GALLERY_IMAGES}: ángulos y detalles. Sin nombres de obra.
                  </p>
                </div>
                <AdminImageUpload
                  action="add-product"
                  category={uploadSub.categoryKey}
                  subcategory={uploadSub.key}
                  label={
                    productMedia.gallery.length >= MAX_PRODUCT_GALLERY_IMAGES
                      ? "Límite alcanzado (6)"
                      : "Agregar foto"
                  }
                  variant="primary"
                  disabled={productMedia.gallery.length >= MAX_PRODUCT_GALLERY_IMAGES}
                  hint={
                    productMedia.gallery.length >= MAX_PRODUCT_GALLERY_IMAGES
                      ? "Elimina una foto para liberar un slot."
                      : `Quedan ${MAX_PRODUCT_GALLERY_IMAGES - productMedia.gallery.length} slots.`
                  }
                  onSuccess={() => {
                    setPreviewVersion((v) => v + 1);
                    setFeedback({ type: "success", message: "Foto agregada a la galería." });
                    loadProductMedia(uploadSub);
                    load();
                  }}
                  onError={(msg) => setFeedback({ type: "error", message: msg })}
                />
              </div>

              {productMedia.loading ? (
                <p className="text-sm text-grey">Cargando galería…</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: MAX_PRODUCT_GALLERY_IMAGES }, (_, slot) => {
                    const item = productMedia.gallery[slot];
                    return (
                      <div
                        key={`slot-${slot}`}
                        className="overflow-hidden rounded-xl border border-grey/20 bg-white"
                      >
                        <div className="relative aspect-[4/3] bg-slate-100">
                          {item ? (
                            <AdminMediaImage
                              src={item.src}
                              version={previewVersion}
                              fileMissing={item.fileMissing}
                              sizes="200px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-2 text-center text-xs text-grey">
                              Agregar foto
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 p-2.5">
                          <p className="text-xs font-semibold text-navy">Foto {slot + 1}</p>
                          {item ? (
                            <div className="flex flex-wrap gap-1.5">
                              <AdminImageUpload
                                action="replace"
                                mediaId={item.id}
                                label="Reemplazar"
                                variant="secondary"
                                onSuccess={() => {
                                  setPreviewVersion((v) => v + 1);
                                  setFeedback({ type: "success", message: "Foto reemplazada." });
                                  loadProductMedia(uploadSub);
                                }}
                                onError={(msg) => setFeedback({ type: "error", message: msg })}
                              />
                              <AdminButton
                                variant="danger"
                                onClick={() => setDeleteMediaTarget(item)}
                                disabled={saving}
                              >
                                Eliminar
                              </AdminButton>
                            </div>
                          ) : (
                            <p className="text-xs text-grey">Usa «Agregar foto» arriba.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {productMedia.gallery.length > MAX_PRODUCT_GALLERY_IMAGES ? (
                <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
                  <p className="text-sm text-amber-950">
                    Hay {productMedia.gallery.length} fotos históricas. En el sitio solo se
                    muestran las primeras {MAX_PRODUCT_GALLERY_IMAGES}. Elimina las sobrantes:
                  </p>
                  <ul className="space-y-1.5">
                    {productMedia.gallery.slice(MAX_PRODUCT_GALLERY_IMAGES).map((item, index) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-md bg-white/70 px-2 py-1.5 text-sm"
                      >
                        <span className="text-navy">
                          Extra {MAX_PRODUCT_GALLERY_IMAGES + index + 1}
                        </span>
                        <AdminButton
                          variant="danger"
                          onClick={() => setDeleteMediaTarget(item)}
                          disabled={saving}
                        >
                          Eliminar
                        </AdminButton>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <p className="text-xs text-grey">
              Para editar nombre, descripción o filtros usa <strong>Editar datos</strong> en la
              lista del producto.
            </p>
          </div>
        ) : null}
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(deleteMediaTarget)}
        title="Eliminar foto de galería"
        message="¿Quitar esta foto del producto? Se borrará del catálogo y del servidor."
        confirmLabel="Eliminar"
        danger
        loading={saving}
        onConfirm={confirmDeleteMedia}
        onCancel={() => setDeleteMediaTarget(null)}
      />
    </AdminShell>
  );
}
