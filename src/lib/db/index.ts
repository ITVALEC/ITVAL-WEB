import { isDatabaseEnabled } from "@/lib/db/pool";

export function useDatabase(): boolean {
  return isDatabaseEnabled();
}
