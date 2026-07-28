import { type ComponentProps, type ComponentPropsWithoutRef } from "react";
import { Link } from "@/i18n/navigation";
import { type Pathnames } from "@/i18n/routing";

export type ButtonVariant = "primary" | "secondary" | "ghost";

/** DS: pill 999px, min 44px, hover +4px padding, 250ms */
const BUTTON_BASE_CLASSES =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-6 py-2.5 text-sm font-semibold uppercase tracking-wide transition-all duration-ds hover:px-7 hover:py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:px-6 motion-reduce:hover:py-2.5";

export const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-navy shadow-gold hover:bg-gold-soft focus-visible:ring-gold focus-visible:ring-offset-navy",
  secondary:
    "border border-white/40 bg-transparent text-white hover:border-gold hover:bg-white/10 hover:text-gold-soft focus-visible:ring-gold focus-visible:ring-offset-navy",
  ghost:
    "border border-navy/20 bg-transparent text-navy hover:border-gold hover:text-gold-deep focus-visible:ring-gold focus-visible:ring-offset-white",
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
