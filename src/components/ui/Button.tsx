import { type ComponentProps, type ComponentPropsWithoutRef } from "react";
import { Link } from "@/i18n/navigation";
import { type Pathnames } from "@/i18n/routing";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "navy";

/** DS: pill 999px, min 44px, hover lift 4px + sombra suave (sin glow oro). */
const BUTTON_BASE_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-6 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all duration-ds hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

export const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-navy shadow-none hover:bg-gold-soft hover:shadow-soft focus-visible:ring-gold focus-visible:ring-offset-navy",
  secondary:
    "border border-white/50 bg-transparent text-white shadow-none hover:border-gold hover:text-gold focus-visible:ring-gold focus-visible:ring-offset-navy",
  ghost:
    "border border-navy/25 bg-transparent text-navy shadow-none hover:border-gold hover:text-gold-deep focus-visible:ring-gold focus-visible:ring-offset-white",
  /** CTA sólido navy sobre fondos claros (surface/white). */
  navy:
    "border border-navy bg-navy text-white shadow-none hover:border-gold hover:bg-navy-mid hover:text-gold focus-visible:ring-gold focus-visible:ring-offset-white",
};

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${BUTTON_BASE_CLASSES} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  className?: string;
  href: Pathnames;
};

export function ButtonLink({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`${BUTTON_BASE_CLASSES} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
