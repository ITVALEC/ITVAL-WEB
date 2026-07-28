import { type ComponentProps, type ComponentPropsWithoutRef } from "react";
import { Link } from "@/i18n/navigation";
import { type Pathnames } from "@/i18n/routing";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const BUTTON_BASE_CLASSES =
  "inline-flex items-center justify-center rounded-sm px-5 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

export const variantClasses: Record<ButtonVariant, string> = {
  /** Oro + navy: contraste AA+ sobre CTA primario. */
  primary:
    "bg-gold text-navy shadow-gold hover:bg-gold-soft focus-visible:ring-gold focus-visible:ring-offset-navy",
  secondary:
    "border border-white/35 bg-transparent text-white hover:border-gold/70 hover:bg-white/10 hover:text-gold-soft focus-visible:ring-gold focus-visible:ring-offset-navy",
  ghost:
    "bg-transparent text-navy hover:text-gold-deep focus-visible:ring-gold focus-visible:ring-offset-white",
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
