export const PROJECT_CATEGORIES = [
  { value: "facades", label: "Fachadas y muro cortina" },
  { value: "doorsAccess", label: "Puertas y accesos" },
  { value: "automaticDoors", label: "Puertas automáticas" },
  { value: "security", label: "Seguridad" },
  { value: "coversExteriors", label: "Cubiertas y exteriores" },
  { value: "aluminumWindows", label: "Ventanas de aluminio" },
] as const;

export function getCategoryLabel(value: string): string {
  return PROJECT_CATEGORIES.find((cat) => cat.value === value)?.label ?? value;
}
