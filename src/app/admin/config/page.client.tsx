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
import { adminErrorMessage, readAdminJson } from "@/lib/admin/api-client";
import { paginateItems } from "@/lib/pagination";
import {
  SOCIAL_ICON_KEYS,
  SOCIAL_ICON_LABELS,
  createSocialLinkId,
  type SiteSocialLink,
  type SocialIconKey,
} from "@/lib/social";
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
  const [translationWarning, setTranslationWarning] = useState("");

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
      const data = (await res.json()) as SiteSettings;
      setSettings({
        contact: data.contact,
        footer: data.footer,
        social: Array.isArray(data.social) ? data.social : [],
      });
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
    if (!settings || saving) return;

    setSaving(true);
    setSaved(false);
    setSettingsError("");
    setTranslationWarning("");

    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: settings.contact,
          footer: { es: settings.footer.es },
          social: settings.social,
        }),
      });

      if (res.ok) {
        const data = await readAdminJson<
          SiteSettings & { translation?: { warnings?: string[]; provider?: string | null } }
        >(res);
        if (data) {
          setSettings({
            contact: data.contact,
            footer: data.footer,
            social: data.social,
          });
          const warnings = data.translation?.warnings?.filter(Boolean) ?? [];
          if (warnings.length > 0) {
            setTranslationWarning(warnings.join(" "));
            setSaved(false);
          } else {
            setSaved(true);
            setTimeout(() => setSaved(false), 4000);
          }
        }
      } else {
        setSettingsError(await adminErrorMessage(res, "No se pudieron guardar los cambios."));
      }
    } catch {
      setSettingsError("Error de red al guardar. Revisa la conexión e inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  function updateContact(field: keyof SiteSettings["contact"], value: string) {
    setSettings((current) =>
      current ? { ...current, contact: { ...current.contact, [field]: value } } : current,
    );
  }

  function updateFooter(
    field: "tagline" | "experience" | "location",
    value: string,
  ) {
    setSettings((current) =>
      current
        ? {
            ...current,
            footer: {
              ...current.footer,
              es: { ...current.footer.es, [field]: value },
            },
          }
        : current,
    );
  }

  function addSocialLink() {
    setSettings((current) => {
      if (!current) return current;
      const next: SiteSocialLink = {
        id: createSocialLinkId(),
        label: "",
        url: "",
        icon: "website",
      };
      return { ...current, social: [...current.social, next] };
    });
  }

  function updateSocialLink(
    id: string,
    patch: Partial<Pick<SiteSocialLink, "label" | "url" | "icon">>,
  ) {
    setSettings((current) => {
      if (!current) return current;
      return {
        ...current,
        social: current.social.map((link) =>
          link.id === id ? { ...link, ...patch } : link,
        ),
      };
    });
  }

  function removeSocialLink(id: string) {
    setSettings((current) =>
      current
        ? { ...current, social: current.social.filter((link) => link.id !== id) }
        : current,
    );
  }

  function moveSocialLink(id: string, direction: -1 | 1) {
    setSettings((current) => {
      if (!current) return current;
      const index = current.social.findIndex((link) => link.id === id);
      if (index < 0) return current;
      const target = index + direction;
      if (target < 0 || target >= current.social.length) return current;
      const next = [...current.social];
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      return { ...current, social: next };
    });
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
    if (!filename || blockedSaving) return;

    setBlockedSaving(true);
    setBlockedFeedback(null);

    try {
      const res = await fetch("/api/admin/blocked-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });

      if (res.ok) {
        setNewFile("");
        setCreateOpen(false);
        setBlockedFeedback({ type: "success", message: `"${filename}" agregado.` });
        await loadBlocked();
      } else {
        setBlockedFeedback({
          type: "error",
          message: await adminErrorMessage(res, "No se pudo agregar."),
        });
      }
    } catch {
      setBlockedFeedback({
        type: "error",
        message: "Error de red al agregar. Revisa la conexión e inténtalo de nuevo.",
      });
    } finally {
      setBlockedSaving(false);
    }
  }

  async function confirmDeleteBlocked() {
    if (!deleteTarget || blockedSaving) return;

    setBlockedSaving(true);
    try {
      const res = await fetch(
        `/api/admin/blocked-images?filename=${encodeURIComponent(deleteTarget)}`,
        { method: "DELETE" },
      );
      setDeleteTarget(null);

      if (res.ok) {
        setBlockedFeedback({ type: "success", message: "Archivo quitado de la lista." });
        await loadBlocked();
      } else {
        setBlockedFeedback({
          type: "error",
          message: await adminErrorMessage(res, "No se pudo eliminar."),
        });
      }
    } catch {
      setDeleteTarget(null);
      setBlockedFeedback({
        type: "error",
        message: "Error de red al eliminar. Revisa la conexión e inténtalo de nuevo.",
      });
    } finally {
      setBlockedSaving(false);
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
                description="Teléfono, correo y dirección visibles en el sitio. Todos los campos son opcionales: guarda solo lo que quieras cambiar."
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
                    placeholder="opcional"
                  />
                </AdminField>
                <AdminField label="Teléfono" htmlFor="contact-phone">
                  <input
                    id="contact-phone"
                    type="tel"
                    value={settings.contact.phone}
                    onChange={(e) => updateContact("phone", e.target.value)}
                    className={adminInputClass}
                    placeholder="opcional"
                  />
                </AdminField>
                <AdminField label="Dirección" htmlFor="contact-address">
                  <input
                    id="contact-address"
                    type="text"
                    value={settings.contact.address}
                    onChange={(e) => updateContact("address", e.target.value)}
                    className={adminInputClass}
                    placeholder="opcional"
                  />
                </AdminField>
                <AdminField label="URL de Google Maps" htmlFor="contact-maps-url">
                  <input
                    id="contact-maps-url"
                    type="text"
                    inputMode="url"
                    placeholder="https://maps.google.com/?q=… (opcional)"
                    value={settings.contact.mapsUrl ?? ""}
                    onChange={(e) => updateContact("mapsUrl", e.target.value)}
                    className={adminInputClass}
                  />
                </AdminField>
                <AdminField label="Horario" htmlFor="contact-hours">
                  <input
                    id="contact-hours"
                    type="text"
                    value={settings.contact.hours}
                    onChange={(e) => updateContact("hours", e.target.value)}
                    className={adminInputClass}
                    placeholder="opcional"
                  />
                </AdminField>
              </div>
            </AdminPanel>

            <AdminPanel title="Textos del footer">
              <p className="mb-4 text-sm text-grey-dark">
                Edita en español. El inglés se genera automáticamente al guardar.
              </p>
              {translationWarning ? (
                <AdminStatusMessage type="error" message={translationWarning} />
              ) : null}
              <div className="mt-4 grid gap-4">
                <AdminField label="Descripción breve" htmlFor="footer-tagline-es">
                  <textarea
                    id="footer-tagline-es"
                    value={settings.footer.es.tagline}
                    onChange={(e) => updateFooter("tagline", e.target.value)}
                    className={adminTextareaClass}
                    rows={3}
                  />
                </AdminField>
                <AdminField label="Línea de experiencia" htmlFor="footer-exp-es">
                  <input
                    id="footer-exp-es"
                    type="text"
                    value={settings.footer.es.experience}
                    onChange={(e) => updateFooter("experience", e.target.value)}
                    className={adminInputClass}
                  />
                </AdminField>
                <AdminField label="Ubicación" htmlFor="footer-loc-es">
                  <input
                    id="footer-loc-es"
                    type="text"
                    value={settings.footer.es.location}
                    onChange={(e) => updateFooter("location", e.target.value)}
                    className={adminInputClass}
                  />
                </AdminField>
              </div>
            </AdminPanel>

            <AdminPanel>
              <AdminCrudToolbar
                title="Redes sociales"
                description="Lista editable del footer. Elige icono y URL; no se traducen."
                action={
                  <AdminButton type="button" onClick={addSocialLink}>
                    + Agregar red
                  </AdminButton>
                }
              />
              {settings.social.length === 0 ? (
                <AdminEmptyState
                  title="Sin redes"
                  description="Agrega Facebook, Instagram, WhatsApp u otras con el botón de arriba."
                />
              ) : (
                <ul className="mt-4 space-y-4">
                  {settings.social.map((link, index) => (
                    <li
                      key={link.id}
                      className="rounded-xl border border-navy/10 bg-surface/40 p-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <AdminField label="Icono" htmlFor={`social-icon-${link.id}`}>
                          <select
                            id={`social-icon-${link.id}`}
                            value={link.icon}
                            onChange={(e) =>
                              updateSocialLink(link.id, {
                                icon: e.target.value as SocialIconKey,
                              })
                            }
                            className={adminInputClass}
                          >
                            {SOCIAL_ICON_KEYS.map((key) => (
                              <option key={key} value={key}>
                                {SOCIAL_ICON_LABELS[key]}
                              </option>
                            ))}
                          </select>
                        </AdminField>
                        <AdminField
                          label="Etiqueta (opcional)"
                          htmlFor={`social-label-${link.id}`}
                        >
                          <input
                            id={`social-label-${link.id}`}
                            type="text"
                            value={link.label ?? ""}
                            onChange={(e) =>
                              updateSocialLink(link.id, { label: e.target.value })
                            }
                            placeholder={SOCIAL_ICON_LABELS[link.icon]}
                            className={adminInputClass}
                          />
                        </AdminField>
                        <div className="sm:col-span-2">
                          <AdminField label="URL" htmlFor={`social-url-${link.id}`}>
                            <input
                              id={`social-url-${link.id}`}
                              type="url"
                              inputMode="url"
                              placeholder="https://… o mailto:… o tel:…"
                              value={link.url}
                              onChange={(e) =>
                                updateSocialLink(link.id, { url: e.target.value })
                              }
                              className={adminInputClass}
                            />
                          </AdminField>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <AdminButton
                          type="button"
                          variant="secondary"
                          onClick={() => moveSocialLink(link.id, -1)}
                          disabled={index === 0}
                        >
                          Subir
                        </AdminButton>
                        <AdminButton
                          type="button"
                          variant="secondary"
                          onClick={() => moveSocialLink(link.id, 1)}
                          disabled={index === settings.social.length - 1}
                        >
                          Bajar
                        </AdminButton>
                        <AdminButton
                          type="button"
                          variant="danger"
                          onClick={() => removeSocialLink(link.id)}
                        >
                          Eliminar
                        </AdminButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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
                <AdminButton
                  onClick={() => {
                    setBlockedFeedback(null);
                    setCreateOpen(true);
                  }}
                >
                  + Agregar
                </AdminButton>
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
              {blockedSaving ? "Agregando…" : "Agregar"}
            </AdminButton>
          </>
        }
      >
        <form id="blocked-form" onSubmit={addBlockedFile} className="space-y-4">
          {blockedFeedback?.type === "error" ? (
            <AdminStatusMessage type="error" message={blockedFeedback.message} />
          ) : null}
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
