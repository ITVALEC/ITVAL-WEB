"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  FORM_SUBMIT_DELAY_MS,
  PROJECT_TYPE_KEYS,
  type ProjectType,
} from "@/lib/content-keys";

type FormErrors = {
  name?: string;
  email?: string;
  message?: string;
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  projectType: ProjectType;
  message: string;
};

const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  company: "",
  projectType: "facades",
  message: "",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const t = useTranslations("contactPage.form");
  const tc = useTranslations("common");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!formData.name.trim()) next.name = t("errors.nameRequired");
    if (!formData.email.trim()) {
      next.email = t("errors.emailRequired");
    } else if (!EMAIL_PATTERN.test(formData.email)) {
      next.email = t("errors.emailInvalid");
    }
    if (!formData.message.trim()) next.message = t("errors.messageRequired");
    return next;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setStatus("loading");
    // v1: envío simulado — reemplazar con API route en v2
    await new Promise((resolve) => setTimeout(resolve, FORM_SUBMIT_DELAY_MS));
    console.log("[ITVAL Contact Form]", formData);
    setStatus("success");
    setFormData(initialFormData);
  };

  const inputClass =
    "mt-1 block w-full rounded-md border border-grey/40 bg-white px-3 py-2.5 text-navy placeholder:text-grey focus:border-cornflower focus:outline-none focus:ring-2 focus:ring-cornflower/30";

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={t("submit")}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-navy">
            {t("name")} <span className="text-action" aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputClass}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy">
            {t("email")} <span className="text-action" aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={inputClass}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-navy">
            {t("phone")}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-navy">
            {t("company")}
          </label>
          <input
            id="company"
            name="company"
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="projectType" className="block text-sm font-medium text-navy">
          {t("projectType")}
        </label>
        <select
          id="projectType"
          name="projectType"
          value={formData.projectType}
          onChange={(e) =>
            setFormData({
              ...formData,
              projectType: e.target.value as ProjectType,
            })
          }
          className={inputClass}
        >
          {PROJECT_TYPE_KEYS.map((type) => (
            <option key={type} value={type}>
              {t(`projectTypes.${type}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label htmlFor="message" className="block text-sm font-medium text-navy">
          {t("message")} <span className="text-action" aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className={inputClass}
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.message}
          </p>
        )}
      </div>

      <div className="mt-6" aria-live="polite">
        {status === "success" && (
          <p className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
            {t("success")}
          </p>
        )}
        <Button type="submit" disabled={status === "loading"} className="w-full sm:w-auto">
          {status === "loading" ? tc("loading") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
