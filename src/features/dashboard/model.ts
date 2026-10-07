export interface MealSummary {
  kind: MealKind;
  time: string;
  items: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  tone: string;
}

export type MealKind = "아침" | "점심" | "저녁" | "간식";

export interface NutritionIntake {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export interface ExerciseRecord {
  id: number | string;
  name: string;
  durationMinutes: number;
  caloriesBurned?: number;
}

export const emptyNutritionIntake: NutritionIntake = {
  calories: 0,
  carbs: 0,
  protein: 0,
  fat: 0,
};
