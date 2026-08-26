// Same 4-slot categorical palette as ActivityDonut.tsx (dataviz-skill-validated —
// Stafy's theme has no defined categorical ramp). ActivityDonut assigns by display
// rank per snapshot; getActivityColor assigns by activity_id so a given activity
// keeps the same color everywhere it's rendered as a chip.
export const CATEGORICAL_COLORS = ['#2a78d6', '#008300', '#e87ba4', '#eda100']

export function getActivityColor(activityId: number): string {
  return CATEGORICAL_COLORS[activityId % CATEGORICAL_COLORS.length]
}
