import { useState } from "react";

export interface NutritionGoal {
  carbsGrams: number;
  proteinGrams: number;
  fatGrams: number;
  waterMl: number;
}

export interface NutritionGoalSummary {
  calories: number;
  carbsPercent: number;
  proteinPercent: number;
  fatPercent: number;
}

export const defaultNutritionGoal: NutritionGoal = {
  carbsGrams: 186,
  proteinGrams: 124,
  fatGrams: 46,
  waterMl: 2000,
};

export function useNutritionGoal() {
  const [goal, setGoalState] = useState<NutritionGoal>(defaultNutritionGoal);

  const setGoal = (next: NutritionGoal) => {
    setGoalState(next);
  };

  return { goal, setGoal };
}

export function getNutritionGoalSummary(
  goal: NutritionGoal,
): NutritionGoalSummary {
  const carbsCalories = goal.carbsGrams * 4;
  const proteinCalories = goal.proteinGrams * 4;
  const fatCalories = goal.fatGrams * 9;
  const calories = carbsCalories + proteinCalories + fatCalories;

  return {
    calories,
    carbsPercent: calories ? Math.round((carbsCalories / calories) * 100) : 0,
    proteinPercent: calories
      ? Math.round((proteinCalories / calories) * 100)
      : 0,
    fatPercent: calories ? Math.round((fatCalories / calories) * 100) : 0,
  };
}
