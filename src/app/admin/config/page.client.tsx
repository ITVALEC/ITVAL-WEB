"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AdminField,
  AdminPanel,
  AdminSaveButton,
  AdminShell,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin/AdminShell";
import {
  AdminButton,
  AdminConfirmDialog,
  AdminCrudToolbar,
  AdminDataTable,
  AdminInfoBanner,
  AdminModal,
} from "@/components/admin/AdminCrud";
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminPagination,
  AdminSearchField,
  AdminStatusMessage,
  AdminTabList,
} from "@/components/admin/AdminUi";
import { paginateItems } from "@/lib/pagination";
import type { SiteSettings } from "@/lib/site-settings";

type ConfigTab = "contact" | "blocked";
const BLOCKED_PAGE_SIZE = 15;

type BlockedRow = { id: string; filename: string };

export default function AdminConfigPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "blocked" ? "blocked" : "contact";
  const [section, setSection] = useState<ConfigTab>(initialTab);

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [footerLocale, setFooterLocale] = useState<"es" | "en">("es");

  const [files, setFiles] = useState<string[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [blockedQuery, setBlockedQuery] = useState("");
  const [blockedPage, setBlockedPage] = useState(1);
  const [blockedFeedback, setBlockedFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newFile, setNewFile] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [blockedSaving, setBlockedSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError("");
    const res = await fetch("/api/admin/site-settings");
    if (res.ok) {
      setSettings(await res.json());
    } else {
      setSettingsError("No se pudo cargar la configuración.");
    }
    setSettingsLoading(false);
  }, []);

  const loadBlocked = useCallback(async () => {
    setBlockedLoading(true);
    const res = await fetch("/api/admin/blocked-images");
    if (res.ok) {
      const data = await res.json();
      setFiles(data.files);
    } else {
      setBlockedFeedback({ type: "error", message: "No se pudo cargar la lista de bloqueo." });
    }
    setBlockedLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
    loadBlocked();
  }, [loadSettings, loadBlocked]);

  async function handleSettingsSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSaved(false);
    setSettingsError("");

    const res = await fetch("/api/admin/site-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);

    if (res.ok) {
      setSettings(await res.json());
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } else {
      setSettingsError("No se pudieron guardar los cambios.");
    }
  }

  function updateContact(field: keyof SiteSettings["contact"], value: string) {
    setSettings((current) =>
      current ? { ...current, contact: { ...current.contact, [field]: value } } : current,
    );
  }

  function updateFooter(
    locale: "es" | "en",
    field: keyof SiteSettings["footer"]["es"],
    value: string,
  ) {
    setSettings((current) =>
      current
        ? {
            ...current,
            footer: {
              ...current.footer,
              [locale]: { ...current.footer[locale], [field]: value },
            },
          }
        : current,
    );
  }

  const blockedRows = useMemo<BlockedRow[]>(
    () => files.map((filename) => ({ id: filename, filename })),
    [files],
  );

  const blockedFiltered = useMemo(() => {
    const q = blockedQuery.toLowerCase().trim();
    if (!q) return blockedRows;
    return blockedRows.filter((row) => row.filename.toLowerCase().includes(q));
  }, [blockedRows, blockedQuery]);

  const blockedPaginated = useMemo(
    () => paginateItems(blockedFiltered, blockedPage, BLOCKED_PAGE_SIZE),
    [blockedFiltered, blockedPage],
  );

  useEffect(() => {
    setBlockedPage(1);
  }, [blockedQuery]);

  async function addBlockedFile(event: React.FormEvent) {
    event.preventDefault();
    const filename = newFile.trim();
    if (!filename) return;

    setBlockedSaving(true);
    setBlockedFeedback(null);

    const res = await fetch("/api/admin/blocked-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });

    setBlockedSaving(false);

    if (res.ok) {
      setNewFile("");
      setCreateOpen(false);
      setBlockedFeedback({ type: "success", message: `"${filename}" agregado.` });
      loadBlocked();
    } else {
      setBlockedFeedback({ type: "error", message: "No se pudo agregar." });
    }
  }

  async function confirmDeleteBlocked() {
    if (!deleteTarget) return;

    setBlockedSaving(true);
    const res = await fetch(
      `/api/admin/blocked-images?filename=${encodeURIComponent(deleteTarget)}`,
      { method: "DELETE" },
    );
    setBlockedSaving(false);
    setDeleteTarget(null);

    if (res.ok) {
      setBlockedFeedback({ type: "success", message: "Archivo quitado de la lista." });
      loadBlocked();
    } else {
      setBlockedFeedback({ type: "error", message: "No se pudo eliminar." });
    }
  }

  return (
    <AdminShell title="Ajustes del sitio">
      <AdminTabList
        label="Sección de configuración"
        value={section}
        onChange={setSection}
        options={[
          { value: "contact", label: "Contacto y footer" },
          { value: "blocked", label: "Imágenes bloqueadas" },
        ]}
      />

      {section === "contact" ? (
        settingsLoading || !settings ? (
          <div className="mt-6">
            {settingsError ? (
              <AdminStatusMessage type="error" message={settingsError} />
            ) : (
              <AdminLoadingState label="Cargando configuración…" />
            )}
          </div>
        ) : (
          <form onSubmit={handleSettingsSubmit} className="mt-6 space-y-6">
            <AdminPanel>
              <AdminCrudToolbar
                title="Contacto del sitio"
                description="Teléfono, correo y dirección visibles en el sitio público."
              />
              {settingsError ? <AdminStatusMessage type="error" message={settingsError} /> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Correo" htmlFor="contact-email">
                  <input
                    id="contact-email"
                    type="email"
                    value={settings.contact.email}
                    onChange={(e) => updateContact("email", e.target.value)}
                    className={adminInputClass}
                    required
                  />
                </AdminField>
                <AdminField label="Teléfono" htmlFor="contact-phone">
                  <input
                    id="contact-phone"
                    type="tel"
                    value={settings.contact.phone}
                    onChange={(e) => updateContact("phone", e.target.value)}
                    className={adminInputClass}
                    required
                  />
                </AdminField>
                <AdminField label="Dirección" htmlFor="contact-address">
                  <input
                    id="contact-address"
                    type="text"
                    value={settings.contact.address}
                    onChange={(e) => updateContact("address", e.target.value)}
                    className={adminInputClass}
                    required
                  />
                </AdminField>
                <AdminField label="Horario" htmlFor="contact-hours">
                  <input
                    id="contact-hours"
                    type="text"
                    value={settings.contact.hours}
                    onChange={(e) => updateContact("hours", e.target.value)}
                    className={adminInputClass}
                    required
                  />
                </AdminField>
              </div>
            </AdminPanel>

            <AdminPanel title="Textos del footer">
              <AdminTabList
                label="Idioma"
                value={footerLocale}
                onChange={setFooterLocale}
                options={[
                  { value: "es", label: "Español" },
                  { value: "en", label: "Inglés" },
                ]}
              />
              <div className="mt-4 grid gap-4">
                <AdminField label="Descripción breve" htmlFor={`footer-tagline-${footerLocale}`}>
                  <textarea
                    id={`footer-tagline-${footerLocale}`}
                    value={settings.footer[footerLocale].tagline}
                    onChange={(e) => updateFooter(footerLocale, "tagline", e.target.value)}
                    className={adminTextareaClass}
                    rows={3}
                  />
                </AdminField>
                <AdminField label="Línea de experiencia" htmlFor={`footer-exp-${footerLocale}`}>
                  <input
                    id={`footer-exp-${footerLocale}`}
                    type="text"
                    value={settings.footer[footerLocale].experience}
                    onChange={(e) => updateFooter(footerLocale, "experience", e.target.value)}
                    className={adminInputClass}
                  />
                </AdminField>
                <AdminField label="Título CTA" htmlFor={`footer-cta-t-${footerLocale}`}>
                  <input
                    id={`footer-cta-t-${footerLocale}`}
                    type="text"
                    value={settings.footer[footerLocale].ctaTitle}
                    onChange={(e) => updateFooter(footerLocale, "ctaTitle", e.target.value)}
                    className={adminInputClass}
                  />
                </AdminField>
                <AdminField label="Texto CTA" htmlFor={`footer-cta-x-${footerLocale}`}>
                  <textarea
                    id={`footer-cta-x-${footerLocale}`}
                    value={settings.footer[footerLocale].ctaText}
                    onChange={(e) => updateFooter(footerLocale, "ctaText", e.target.value)}
                    className={adminTextareaClass}
                    rows={3}
                  />
                </AdminField>
                <AdminField label="Ubicación" htmlFor={`footer-loc-${footerLocale}`}>
                  <input
                    id={`footer-loc-${footerLocale}`}
                    type="text"
                    value={settings.footer[footerLocale].location}
                    onChange={(e) => updateFooter(footerLocale, "location", e.target.value)}
                    className={adminInputClass}
                  />
                </AdminField>
              </div>
            </AdminPanel>

            <AdminSaveButton saving={saving} saved={saved} />
          </form>
        )
      ) : (
        <div className="mt-6">
          <AdminPanel>
            <AdminCrudToolbar
              title="Imágenes bloqueadas"
              description="Archivos que no deben publicarse (personas trabajando, etc.)."
              action={
                <AdminButton onClick={() => setCreateOpen(true)}>+ Agregar</AdminButton>
              }
            />
            <AdminInfoBanner>
              Esta lista aplica sobre todo a importaciones masivas por terminal. Las fotos que subas
              desde el panel no pasan por este filtro.
            </AdminInfoBanner>

            <div className="mb-4 space-y-4">
              <AdminSearchField
                id="blocked-search"
                label="Buscar"
                value={blockedQuery}
                onChange={setBlockedQuery}
                placeholder="Nombre de archivo…"
                resultsCount={blockedFiltered.length}
              />
              {blockedFeedback ? (
                <AdminStatusMessage type={blockedFeedback.type} message={blockedFeedback.message} />
              ) : null}
            </div>

            {blockedLoading ? (
              <AdminLoadingState label="Cargando…" />
            ) : blockedPaginated.items.length === 0 ? (
              <AdminEmptyState title="Lista vacía" description="No hay archivos bloqueados." />
            ) : (
              <>
                <AdminDataTable
                  caption="Bloqueados"
                  rows={blockedPaginated.items}
                  columns={[
                    {
                      key: "filename",
                      header: "Archivo",
                      cell: (row) => <code className="text-sm">{row.filename}</code>,
                    },
                    {
                      key: "actions",
                      header: "Acciones",
                      headerClassName: "text-right",
                      className: "text-right",
                      cell: (row) => (
                        <AdminButton variant="danger" onClick={() => setDeleteTarget(row.filename)}>
                          Eliminar
                        </AdminButton>
                      ),
                    },
                  ]}
                  mobileCard={(row) => (
                    <div className="flex justify-between gap-3">
                      <code className="break-all text-sm">{row.filename}</code>
                      <AdminButton variant="danger" onClick={() => setDeleteTarget(row.filename)}>
                        Eliminar
                      </AdminButton>
                    </div>
                  )}
                />
                <AdminPagination
                  page={blockedPaginated.page}
                  totalPages={blockedPaginated.totalPages}
                  from={blockedPaginated.from}
                  to={blockedPaginated.to}
                  totalItems={blockedPaginated.totalItems}
                  itemLabel="archivos"
                  onPageChange={setBlockedPage}
                />
              </>
            )}
          </AdminPanel>
        </div>
      )}

      <AdminModal
        open={createOpen}
        title="Agregar archivo bloqueado"
        onClose={() => {
          setCreateOpen(false);
          setNewFile("");
        }}
        footer={
          <>
            <AdminButton variant="secondary" onClick={() => setCreateOpen(false)} disabled={blockedSaving}>
              Cancelar
            </AdminButton>
            <AdminButton type="submit" form="blocked-form" disabled={blockedSaving}>
              Agregar
            </AdminButton>
          </>
        }
      >
        <form id="blocked-form" onSubmit={addBlockedFile}>
          <AdminField label="Nombre exacto del archivo" htmlFor="blocked-name">
            <input
              id="blocked-name"
              type="text"
              value={newFile}
              onChange={(e) => setNewFile(e.target.value)}
              placeholder="DSC00600.JPG"
              className={adminInputClass}
              required
            />
          </AdminField>
        </form>
      </AdminModal>

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title="Quitar de la lista"
        message={`¿Quitar "${deleteTarget}" de las imágenes bloqueadas?`}
        confirmLabel="Eliminar"
        danger
        loading={blockedSaving}
        onConfirm={confirmDeleteBlocked}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminShell>
  );
}
