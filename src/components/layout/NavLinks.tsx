import { Link, type Pathnames } from "@/i18n/routing";

type NavLinksProps = {
  items: ReadonlyArray<{ href: Pathnames; label: string }>;
  label: string;
};

export function NavLinks({ items, label }: NavLinksProps) {
  return (
    <nav aria-label={label}>
      <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grey">
        {label}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="rounded-sm text-sm text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cornflower"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
