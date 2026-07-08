"use client";

import { usePathname } from "@/i18n/routing";
import { NAV_PATHS } from "@/lib/constants";
import { type ReactNode } from "react";

type MainContentProps = {
  children: ReactNode;
};

export function MainContent({ children }: MainContentProps) {
  const pathname = usePathname();
  const isHome = pathname === NAV_PATHS.home;

  return (
    <main
      id="main-content"
      className={isHome ? "-mt-16" : undefined}
    >
      {children}
    </main>
  );
}
