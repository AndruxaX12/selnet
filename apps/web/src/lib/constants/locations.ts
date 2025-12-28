/**
 * List of cities and villages in Botevgrad municipality
 * Used for location dropdown and push notification subscriptions
 */

export const CITIES = [
  {
    value: "Ботевград",
    label: "гр. Ботевград",
    type: "city" as const,
  },
];

export const VILLAGES = [
  {
    value: "Врачеш",
    label: "с. Врачеш",
    type: "village" as const,
  },
  {
    value: "Трудовец",
    label: "с. Трудовец",
    type: "village" as const,
  },
  {
    value: "Боженица",
    label: "с. Боженица",
    type: "village" as const,
  },
  {
    value: "Скравена",
    label: "с. Скравена",
    type: "village" as const,
  },
  {
    value: "Литаково",
    label: "с. Литаково",
    type: "village" as const,
  },
  {
    value: "Новачене",
    label: "с. Новачене",
    type: "village" as const,
  },
  {
    value: "Рашково",
    label: "с. Рашково",
    type: "village" as const,
  },
  {
    value: "Радотина",
    label: "с. Радотина",
    type: "village" as const,
  },
  {
    value: "Краево",
    label: "с. Краево",
    type: "village" as const,
  },
  {
    value: "Липница",
    label: "с. Липница",
    type: "village" as const,
  },
  {
    value: "Еловдол",
    label: "с. Еловдол",
    type: "village" as const,
  },
  {
    value: "Гурково",
    label: "с. Гурково",
    type: "village" as const,
  },
];

export const ALL_LOCATIONS = [...CITIES, ...VILLAGES];

/**
 * Get location label by value
 */
export function getLocationLabel(value: string): string {
  const location = ALL_LOCATIONS.find((loc) => loc.value === value);
  return location?.label || value;
}

/**
 * Get location type (city/village)
 */
export function getLocationType(value: string): "city" | "village" | null {
  const location = ALL_LOCATIONS.find((loc) => loc.value === value);
  return location?.type || null;
}
