import { Link } from "@/i18n/routing";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  light?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function Breadcrumbs({
  items,
  light = false,
  className = "",
  ariaLabel = "Breadcrumb",
}: BreadcrumbsProps) {
  const baseText = light ? "text-white/70" : "text-grey-dark";
  const separator = light ? "text-white/40" : "text-grey";
  const linkClass = light
    ? "text-white/90 hover:text-white"
    : "text-cornflower hover:text-action";
  const currentClass = light ? "font-medium text-white" : "font-medium text-navy";

  return (
    <nav aria-label={ariaLabel} className={`mb-6 ${className}`.trim()}>
      <ol className={`flex flex-wrap items-center gap-2 text-sm ${baseText}`}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 && (
                <span className={separator} aria-hidden="true">
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href as "/"}
                  className={`rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower ${linkClass}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? currentClass : undefined}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
