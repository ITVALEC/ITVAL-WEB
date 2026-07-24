import { Link } from "@/i18n/navigation";
import { type ComponentProps } from "react";

type AppLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

/** Enlace con rutas dinámicas (detalle de catálogo/proyectos) */
export function AppLink({ href, ...props }: AppLinkProps) {
  return <Link href={href as "/"} {...props} />;
}
