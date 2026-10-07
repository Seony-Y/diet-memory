import { format, subDays } from "date-fns";
import type { BodyRecord } from "../features/body/model";
import type {
  ExerciseRecord,
  MealSummary,
  NutritionIntake,
} from "../features/dashboard/model";
import type { Ingredient } from "../features/ingredients/model";
import { categoryColors } from "../features/ingredients/model";

export const mockFoods: Ingredient[] = [
  {
    id: 1,
    name: "닭가슴살",
    category: "육류",
    categoryColor: categoryColors.육류,
    amount: 100,
    unit: "g",
    stockAmount: 500,
    stockUnit: "g",
    calories: 109,
    carbs: 0,
    protein: 23,
    fat: 1.2,
    favorite: true,
  },
  {
    id: 2,
    name: "현미밥",
    category: "완제품",
    categoryColor: categoryColors.완제품,
    amount: 150,
    unit: "g",
    stockAmount: 6,
    stockUnit: "회분",
    calories: 218,
    carbs: 45,
    protein: 4.5,
    fat: 1.4,
    favorite: true,
  },
  {
    id: 3,
    name: "방울토마토",
    category: "야채",
    categoryColor: categoryColors.야채,
    amount: 100,
    unit: "g",
    stockAmount: 350,
    stockUnit: "g",
    calories: 18,
    carbs: 3.9,
    protein: 0.9,
    fat: 0.2,
    favorite: false,
  },
  {
    id: 4,
    name: "그릭요거트",
    category: "완제품",
    categoryColor: categoryColors.완제품,
    amount: 100,
    unit: "g",
    stockAmount: 2,
    stockUnit: "개",
    calories: 97,
    carbs: 3.9,
    protein: 9,
    fat: 5,
    favorite: true,
  },
  {
    id: 5,
    name: "바나나",
    category: "과일",
    categoryColor: categoryColors.과일,
    amount: 1,
    unit: "개",
    stockAmount: 4,
    stockUnit: "개",
    calories: 93,
    carbs: 24,
    protein: 1.2,
    fat: 0.3,
    favorite: false,
  },
  {
    id: 6,
    name: "연어",
    category: "수산",
    categoryColor: categoryColors.수산,
    amount: 100,
    unit: "g",
    stockAmount: 300,
    stockUnit: "g",
    calories: 208,
    carbs: 0,
    protein: 20,
    fat: 13,
    favorite: false,
  },
];

export const mockMeals: MealSummary[] = [
  {
    kind: "아침",
    time: "08:10",
    items: "그릭요거트, 바나나, 아몬드",
    calories: 311,
    carbs: 46,
    protein: 17,
    fat: 7,
    tone: "mint",
  },
  {
    kind: "점심",
    time: "12:35",
    items: "현미밥, 닭가슴살, 구운 야채",
    calories: 548,
    carbs: 61,
    protein: 42,
    fat: 14,
    tone: "blue",
  },
  {
    kind: "저녁",
    time: "기록 전",
    items: "저녁 식단을 기록해 주세요",
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    tone: "coral",
  },
  {
    kind: "간식",
    time: "15:20",
    items: "프로틴바 1개",
    calories: 142,
    carbs: 18,
    protein: 12,
    fat: 3,
    tone: "yellow",
  },
];

export const mockNutritionIntake: NutritionIntake = {
  calories: 1001,
  carbs: 112,
  protein: 68,
  fat: 31,
};

export const mockExercises: ExerciseRecord[] = [
  { id: 1, name: "빠르게 걷기", durationMinutes: 42, caloriesBurned: 218 },
  { id: 2, name: "스트레칭", durationMinutes: 15 },
];

export const mockCalorieHistory = [
  { recordedOn: format(subDays(new Date(), 6), "yyyy-MM-dd"), calories: 1680 },
  { recordedOn: format(subDays(new Date(), 5), "yyyy-MM-dd"), calories: 1540 },
  { recordedOn: format(subDays(new Date(), 4), "yyyy-MM-dd"), calories: 1720 },
  { recordedOn: format(subDays(new Date(), 3), "yyyy-MM-dd"), calories: 1490 },
  { recordedOn: format(subDays(new Date(), 2), "yyyy-MM-dd"), calories: 1610 },
  { recordedOn: format(subDays(new Date(), 1), "yyyy-MM-dd"), calories: 1800 },
  { recordedOn: format(new Date(), "yyyy-MM-dd"), calories: 1001 },
];

const bodyMeasurements = [
  [64.1, 24.1, 16.4, 25.6],
  [63.9, 24.0, 16.1, 25.2],
  [63.7, 24.0, 15.9, 25.0],
  [63.5, 23.9, 15.7, 24.7],
  [63.3, 23.9, 15.6, 24.6],
  [63.1, 23.8, 15.4, 24.4],
  [62.9, 23.8, 15.3, 24.3],
  [62.8, 23.8, 15.2, 24.2],
  [62.7, 23.8, 15.2, 24.2],
  [62.6, 23.8, 15.1, 24.1],
  [62.5, 23.8, 15.1, 24.1],
  [62.4, 23.8, 15.0, 24.0],
] as const;

export function createMockBodyRecords(): BodyRecord[] {
  const today = new Date();
  const dayOffsets = [18, 16, 14, 12, 10, 8, 6, 4, 3, 2, 1, 0];

  return bodyMeasurements.map(
    ([weightKg, muscleMassKg, bodyFatMassKg, bodyFatPercent], index) => ({
      recordedOn: format(subDays(today, dayOffsets[index]), "yyyy-MM-dd"),
      weightKg,
      muscleMassKg,
      bodyFatMassKg,
      bodyFatPercent,
    }),
  );
}
