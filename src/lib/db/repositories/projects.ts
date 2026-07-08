import type { PortfolioProject } from "@/lib/catalog/project-portfolio";
import type { ProductKey } from "@/lib/catalog/types";
import { resolveProjectCover } from "@/lib/catalog/project-cover";
import { query } from "@/lib/db/pool";

type ProjectRow = {
  id: string;
  name: string;
  city: string;
  location: string | null;
  year: number | null;
  folder: string | null;
  product_category: string;
  product_subcategory: string | null;
  cover_path: string | null;
  cover_index: number;
  featured: boolean;
};

type ImageRow = {
  project_id: string;
  src: string;
  sort_order: number;
};

function mapProject(row: ProjectRow, gallery: string[]): PortfolioProject {
  const coverIndex = row.cover_index ?? 0;
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    location: row.location ?? `${row.city}, Ecuador`,
    year: row.year,
    folder: row.folder ?? "",
    productCategory: row.product_category as ProductKey,
    productSubcategory: row.product_subcategory ?? "",
    cover: resolveProjectCover(gallery, coverIndex),
    gallery,
    imageCount: gallery.length,
    featured: row.featured,
    coverIndex,
  };
}

async function loadGalleryMap(): Promise<Map<string, string[]>> {
  const { rows } = await query<ImageRow>(
    `SELECT project_id, src, sort_order FROM project_images ORDER BY project_id, sort_order`,
  );
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.project_id) ?? [];
    list.push(row.src);
    map.set(row.project_id, list);
  }
  return map;
}

export async function listProjectsFromDb(): Promise<PortfolioProject[]> {
  const { rows } = await query<ProjectRow>(
    `SELECT * FROM projects ORDER BY year DESC NULLS LAST, name`,
  );
  const galleryMap = await loadGalleryMap();
  return rows.map((row) => mapProject(row, galleryMap.get(row.id) ?? []));
}

export async function searchProjectsFromDb(
  search: string,
): Promise<PortfolioProject[]> {
  const q = `%${search.toLowerCase()}%`;
  const { rows } = await query<ProjectRow>(
    `SELECT * FROM projects
     WHERE lower(name) LIKE $1 OR lower(city) LIKE $1 OR lower(id) LIKE $1
     ORDER BY year DESC NULLS LAST, name`,
    [q],
  );
  const galleryMap = await loadGalleryMap();
  return rows.map((row) => mapProject(row, galleryMap.get(row.id) ?? []));
}

export async function updateProjectInDb(
  id: string,
  patch: {
    featured?: boolean;
    productCategory?: string;
    coverIndex?: number;
    name?: string;
  },
): Promise<PortfolioProject | null> {
  const { rows: existing } = await query<ProjectRow>(
    `SELECT * FROM projects WHERE id = $1`,
    [id],
  );
  if (!existing[0]) return null;

  const row = existing[0];
  const name = patch.name?.trim() || row.name;
  const featured = patch.featured ?? row.featured;
  const productCategory = patch.productCategory ?? row.product_category;
  const coverIndex = patch.coverIndex ?? row.cover_index;

  await query(
    `UPDATE projects SET name = $2, featured = $3, product_category = $4, cover_index = $5
     WHERE id = $1`,
    [id, name, featured, productCategory, coverIndex],
  );

  if (patch.name) {
    await query(`UPDATE project_images SET alt_text = $2 WHERE project_id = $1`, [
      id,
      name,
    ]);
  }

  const { rows: images } = await query<ImageRow>(
    `SELECT project_id, src, sort_order FROM project_images WHERE project_id = $1 ORDER BY sort_order`,
    [id],
  );

  const gallery = images.map((img) => img.src);
  const cover = resolveProjectCover(gallery, coverIndex);
  await query(`UPDATE projects SET cover_path = $2 WHERE id = $1`, [id, cover]);

  return mapProject(
    {
      ...row,
      name,
      featured,
      product_category: productCategory,
      cover_index: coverIndex,
      cover_path: cover,
    },
    gallery,
  );
}
