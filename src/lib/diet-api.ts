import { addDays, format, startOfDay } from "date-fns";
import type { BodyRecord, BodyRecordInput } from "../features/body/model";
import type {
  ExerciseRecord,
  MealKind,
  MealSummary,
} from "../features/dashboard/model";
import type { Ingredient } from "../features/ingredients/model";
import type { NutritionGoal } from "../features/nutrition/model";
import { neon } from "./neon";

interface ProfileRow {
  carbs_goal_g: number | string;
  protein_goal_g: number | string;
  fat_goal_g: number | string;
  water_goal_ml: number;
}

interface CategoryRow {
  id: string;
  name: string;
  color_hex: string;
}

interface IngredientRow {
  id: string;
  category_id: string | null;
  name: string;
  base_amount: number | string;
  unit: string;
  stock_amount: number | string;
  stock_unit: string;
  calories: number | string;
  carbohydrates_g: number | string;
  protein_g: number | string;
  fat_g: number | string;
  is_favorite: boolean;
}

interface BodyRecordRow {
  recorded_on: string;
  weight_kg: number | string;
  muscle_mass_kg: number | string | null;
  body_fat_mass_kg: number | string | null;
  body_fat_percent: number | string | null;
  visceral_fat_level: number | null;
}

interface ExerciseRow {
  id: string;
  name: string;
  duration_minutes: number;
  calories_burned: number | null;
}

interface MealItemRow {
  name_snapshot: string;
  calories: number | string;
  carbohydrates_g: number | string;
  protein_g: number | string;
  fat_g: number | string;
}

interface MealRow {
  id: string;
  eaten_on: string;
  kind: string;
  eaten_at: string | null;
  meal_items: MealItemRow[];
}

export interface DietData {
  goal: NutritionGoal;
  foods: Ingredient[];
  bodyRecords: BodyRecord[];
  water: number;
  exercises: ExerciseRecord[];
  meals: MealSummary[];
  calorieHistory: Array<{ recordedOn: string; calories: number }>;
}

export interface IngredientInput extends Omit<Ingredient, "id" | "favorite"> {
  favorite?: boolean;
}

const mealKindToDatabase: Record<MealKind, string> = {
  아침: "breakfast",
  점심: "lunch",
  저녁: "dinner",
  간식: "snack",
};

const mealKindFromDatabase: Record<string, MealKind> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
};

const mealTone: Record<MealKind, string> = {
  아침: "mint",
  점심: "blue",
  저녁: "coral",
  간식: "yellow",
};

const unitToDatabase: Record<string, string> = {
  g: "g",
  ml: "ml",
  개: "piece",
  회분: "serving",
  piece: "piece",
  serving: "serving",
};

const unitFromDatabase: Record<string, string> = {
  g: "g",
  ml: "ml",
  piece: "개",
  serving: "회분",
};

const numberOrUndefined = (value: number | string | null) =>
  value === null ? undefined : Number(value);

const requireNeon = () => {
  if (!neon) throw new Error("Neon Data API가 설정되지 않았습니다.");
  return neon;
};

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const requireData = <T>(data: T | null, message: string): T => {
  if (data === null) throw new Error(message);
  return data;
};

export async function loadDietData(): Promise<DietData> {
  const client = requireNeon();
  const today = format(new Date(), "yyyy-MM-dd");
  const dayStart = startOfDay(new Date()).toISOString();
  const dayEnd = addDays(startOfDay(new Date()), 1).toISOString();

  const [
    profileResult,
    categoryResult,
    ingredientResult,
    bodyResult,
    waterResult,
    exerciseResult,
    mealResult,
  ] = await Promise.all([
    client
      .from("profiles")
      .select("carbs_goal_g,protein_goal_g,fat_goal_g,water_goal_ml")
      .single(),
    client.from("categories").select("id,name,color_hex"),
    client
      .from("ingredients")
      .select(
        "id,category_id,name,base_amount,unit,stock_amount,stock_unit,calories,carbohydrates_g,protein_g,fat_g,is_favorite",
      )
      .order("created_at", { ascending: false }),
    client
      .from("body_records")
      .select(
        "recorded_on,weight_kg,muscle_mass_kg,body_fat_mass_kg,body_fat_percent,visceral_fat_level",
      )
      .order("recorded_on"),
    client
      .from("water_records")
      .select("amount_ml")
      .gte("consumed_at", dayStart)
      .lt("consumed_at", dayEnd),
    client
      .from("exercise_records")
      .select("id,name,duration_minutes,calories_burned")
      .eq("exercised_on", today)
      .order("created_at", { ascending: false }),
    client
      .from("meals")
      .select(
        "id,eaten_on,kind,eaten_at,meal_items(name_snapshot,calories,carbohydrates_g,protein_g,fat_g)",
      )
      .order("eaten_on"),
  ]);

  [
    profileResult,
    categoryResult,
    ingredientResult,
    bodyResult,
    waterResult,
    exerciseResult,
    mealResult,
  ].forEach((result) => throwIfError(result.error));

  const profile = profileResult.data as ProfileRow;
  const categoryRows = (categoryResult.data ?? []) as CategoryRow[];
  const categoryMap = new Map(categoryRows.map((row) => [row.id, row]));
  const ingredientRows = (ingredientResult.data ?? []) as IngredientRow[];
  const bodyRows = (bodyResult.data ?? []) as BodyRecordRow[];
  const exerciseRows = (exerciseResult.data ?? []) as ExerciseRow[];
  const mealRows = (mealResult.data ?? []) as MealRow[];

  const mealSummaries = mealRows.map(toMealSummary);
  const caloriesByDate = new Map<string, number>();
  mealRows.forEach((meal) => {
    const calories = meal.meal_items.reduce(
      (sum, item) => sum + Number(item.calories),
      0,
    );
    caloriesByDate.set(
      meal.eaten_on,
      (caloriesByDate.get(meal.eaten_on) ?? 0) + calories,
    );
  });

  return {
    goal: {
      carbsGrams: Number(profile.carbs_goal_g),
      proteinGrams: Number(profile.protein_goal_g),
      fatGrams: Number(profile.fat_goal_g),
      waterMl: profile.water_goal_ml,
    },
    foods: ingredientRows.map((row) => {
      const category = row.category_id
        ? categoryMap.get(row.category_id)
        : undefined;
      return {
        id: row.id,
        name: row.name,
        category: category?.name ?? "기타",
        categoryColor: category?.color_hex ?? "#E8ECEE",
        amount: Number(row.base_amount),
        unit: unitFromDatabase[row.unit] ?? row.unit,
        stockAmount: Number(row.stock_amount),
        stockUnit: unitFromDatabase[row.stock_unit] ?? row.stock_unit,
        calories: Number(row.calories),
        carbs: Number(row.carbohydrates_g),
        protein: Number(row.protein_g),
        fat: Number(row.fat_g),
        favorite: row.is_favorite,
      };
    }),
    bodyRecords: bodyRows.map((row) => ({
      recordedOn: row.recorded_on,
      weightKg: Number(row.weight_kg),
      muscleMassKg: numberOrUndefined(row.muscle_mass_kg),
      bodyFatMassKg: numberOrUndefined(row.body_fat_mass_kg),
      bodyFatPercent: numberOrUndefined(row.body_fat_percent),
      visceralFatLevel: row.visceral_fat_level ?? undefined,
    })),
    water: ((waterResult.data ?? []) as Array<{ amount_ml: number }>).reduce(
      (sum, row) => sum + row.amount_ml,
      0,
    ),
    exercises: exerciseRows.map((row) => ({
      id: row.id,
      name: row.name,
      durationMinutes: row.duration_minutes,
      caloriesBurned: row.calories_burned ?? undefined,
    })),
    meals: mealSummaries.filter(
      (_, index) => mealRows[index].eaten_on === today,
    ),
    calorieHistory: [...caloriesByDate].map(([recordedOn, calories]) => ({
      recordedOn,
      calories,
    })),
  };
}

function toMealSummary(row: MealRow): MealSummary {
  const kind = mealKindFromDatabase[row.kind] ?? "간식";
  return {
    kind,
    time: row.eaten_at?.slice(0, 5) ?? "기록 전",
    items: row.meal_items.map((item) => item.name_snapshot).join(", "),
    calories: row.meal_items.reduce(
      (sum, item) => sum + Number(item.calories),
      0,
    ),
    carbs: row.meal_items.reduce(
      (sum, item) => sum + Number(item.carbohydrates_g),
      0,
    ),
    protein: row.meal_items.reduce(
      (sum, item) => sum + Number(item.protein_g),
      0,
    ),
    fat: row.meal_items.reduce((sum, item) => sum + Number(item.fat_g), 0),
    tone: mealTone[kind],
  };
}

export async function saveNutritionGoal(goal: NutritionGoal) {
  const { error } = await requireNeon()
    .from("profiles")
    .update({
      carbs_goal_g: goal.carbsGrams,
      protein_goal_g: goal.proteinGrams,
      fat_goal_g: goal.fatGrams,
      water_goal_ml: goal.waterMl,
      updated_at: new Date().toISOString(),
    })
    .not("user_id", "is", null);
  throwIfError(error);
}

export async function saveBodyRecord(input: BodyRecordInput) {
  const client = requireNeon();
  const recordedOn = format(new Date(), "yyyy-MM-dd");
  const row = {
    recorded_on: recordedOn,
    weight_kg: input.weightKg,
    muscle_mass_kg: input.muscleMassKg ?? null,
    body_fat_mass_kg: input.bodyFatMassKg ?? null,
    body_fat_percent: input.bodyFatPercent ?? null,
    visceral_fat_level: input.visceralFatLevel ?? null,
    updated_at: new Date().toISOString(),
  };
  const existing = await client
    .from("body_records")
    .select("id")
    .eq("recorded_on", recordedOn)
    .maybeSingle();
  throwIfError(existing.error);

  const result = existing.data
    ? await client.from("body_records").update(row).eq("id", existing.data.id)
    : await client.from("body_records").insert(row);
  throwIfError(result.error);
}

export async function addWaterRecord(amountMl: number) {
  const { error } = await requireNeon()
    .from("water_records")
    .insert({ amount_ml: amountMl });
  throwIfError(error);
}

export async function addExerciseRecord(exercise: Omit<ExerciseRecord, "id">) {
  const { data, error } = await requireNeon()
    .from("exercise_records")
    .insert({
      exercised_on: format(new Date(), "yyyy-MM-dd"),
      name: exercise.name,
      duration_minutes: exercise.durationMinutes,
      calories_burned: exercise.caloriesBurned ?? null,
    })
    .select("id")
    .single();
  throwIfError(error);
  return String(requireData(data, "운동 기록 ID를 받지 못했습니다.").id);
}

export async function addIngredient(input: IngredientInput) {
  const client = requireNeon();
  const category = await client
    .from("categories")
    .select("id")
    .eq("name", input.category)
    .single();
  throwIfError(category.error);
  const categoryData = requireData(
    category.data,
    "재료 카테고리를 찾지 못했습니다.",
  );

  const { data, error } = await client
    .from("ingredients")
    .insert({
      category_id: categoryData.id,
      name: input.name,
      base_amount: input.amount,
      unit: unitToDatabase[input.unit] ?? "g",
      stock_amount: input.stockAmount,
      stock_unit: unitToDatabase[input.stockUnit] ?? "g",
      calories: input.calories,
      carbohydrates_g: input.carbs,
      protein_g: input.protein,
      fat_g: input.fat,
      is_favorite: input.favorite ?? false,
    })
    .select("id")
    .single();
  throwIfError(error);
  return {
    ...input,
    id: String(requireData(data, "재료 ID를 받지 못했습니다.").id),
    favorite: input.favorite ?? false,
  };
}

export async function setIngredientFavorite(
  id: number | string,
  favorite: boolean,
) {
  const { error } = await requireNeon()
    .from("ingredients")
    .update({ is_favorite: favorite, updated_at: new Date().toISOString() })
    .eq("id", id);
  throwIfError(error);
}

export async function saveMealRecord(meal: MealSummary) {
  const client = requireNeon();
  const eatenOn = format(new Date(), "yyyy-MM-dd");
  const kind = mealKindToDatabase[meal.kind];
  const existing = await client
    .from("meals")
    .select("id")
    .eq("eaten_on", eatenOn)
    .eq("kind", kind)
    .maybeSingle();
  throwIfError(existing.error);

  let mealId: string;
  if (existing.data) {
    mealId = String(existing.data.id);
    const clearItems = await client
      .from("meal_items")
      .delete()
      .eq("meal_id", mealId);
    throwIfError(clearItems.error);
    const updateMeal = await client
      .from("meals")
      .update({ eaten_at: meal.time })
      .eq("id", mealId);
    throwIfError(updateMeal.error);
  } else {
    const createMeal = await client
      .from("meals")
      .insert({ eaten_on: eatenOn, kind, eaten_at: meal.time })
      .select("id")
      .single();
    throwIfError(createMeal.error);
    mealId = String(
      requireData(createMeal.data, "식단 ID를 받지 못했습니다.").id,
    );
  }

  const itemResult = await client.from("meal_items").insert({
    meal_id: mealId,
    name_snapshot: meal.items,
    calories: meal.calories,
    carbohydrates_g: meal.carbs,
    protein_g: meal.protein,
    fat_g: meal.fat,
  });
  throwIfError(itemResult.error);
}
