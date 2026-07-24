import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { getDocument } from "@/lib/db/documents";
import bundled from "./filter-config.json";
import type { FilterConfigFile } from "./filter-meta";

export async function loadFilterConfig(): Promise<FilterConfigFile> {
  noStore();
  try {
    const data = await getDocument<Partial<FilterConfigFile>>("filterConfig");
    return {
      categories: data.categories ?? {},
      subcategories: data.subcategories ?? {},
    };
  } catch {
    const fallback = bundled as FilterConfigFile;
    return {
      categories: fallback.categories ?? {},
      subcategories: fallback.subcategories ?? {},
    };
  }
}
