import { type ComponentProps, type ComponentPropsWithoutRef } from "react";
import { Link, type Pathnames } from "@/i18n/routing";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const BUTTON_BASE_CLASSES =
  "inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-navy disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

export const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-action text-white hover:bg-action/90 focus-visible:ring-action",
  secondary:
    "border border-white/30 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white",
  ghost:
    "bg-transparent text-cornflower hover:text-cornflower/80 focus-visible:ring-cornflower",
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
