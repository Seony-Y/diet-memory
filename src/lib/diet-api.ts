import { addDays, format, startOfDay } from "date-fns";
import type { BodyRecord, BodyRecordInput } from "../features/body/model";
import type {
  ExerciseRecord,
  MealKind,
  MealSummary,
} from "../features/dashboard/model";
import type {
  Ingredient,
  IngredientCategory,
} from "../features/ingredients/model";
import { orderIngredientCategories } from "../features/ingredients/model";
import type { NutritionGoal } from "../features/nutrition/model";
import type { ScheduleEntry, ScheduleInput } from "../features/schedule/model";
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
  is_default: boolean;
}

interface IngredientRow {
  id: string;
  category_id: string | null;
  name: string;
  brand_name: string | null;
  source_type: "user" | "public" | null;
  source_origin: string | null;
  source_synced_at: string | null;
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

interface ScheduleRow {
  id: string;
  status: "confirmed" | "tentative";
  memo: string;
  scheduled_on: string | null;
  minimum_downtime: string | null;
}

export interface DietData {
  goal: NutritionGoal;
  categories: IngredientCategory[];
  foods: Ingredient[];
  bodyRecords: BodyRecord[];
  water: number;
  exercises: ExerciseRecord[];
  meals: MealSummary[];
  calorieHistory: Array<{ recordedOn: string; calories: number }>;
  schedules: ScheduleEntry[];
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

const scheduleMemoPrefix = "@diet-memory:1:";

const encodeScheduleMemo = (input: ScheduleInput) =>
  `${scheduleMemoPrefix}${JSON.stringify({
    title: input.title,
    time: input.scheduledTime ?? null,
  })}`;

const decodeScheduleMemo = (memo: string) => {
  if (!memo.startsWith(scheduleMemoPrefix)) {
    return { title: memo, scheduledTime: undefined };
  }
  try {
    const value = JSON.parse(memo.slice(scheduleMemoPrefix.length)) as {
      title?: unknown;
      time?: unknown;
    };
    return {
      title: typeof value.title === "string" ? value.title : memo,
      scheduledTime: typeof value.time === "string" ? value.time : undefined,
    };
  } catch {
    return { title: memo, scheduledTime: undefined };
  }
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
    scheduleResult,
  ] = await Promise.all([
    client
      .from("profiles")
      .select("carbs_goal_g,protein_goal_g,fat_goal_g,water_goal_ml")
      .single(),
    client
      .from("categories")
      .select("id,name,color_hex,is_default")
      .order("sort_order")
      .order("created_at"),
    client
      .from("ingredients")
      .select(
        "id,category_id,name,brand_name,source_type,source_origin,source_synced_at,base_amount,unit,stock_amount,stock_unit,calories,carbohydrates_g,protein_g,fat_g,is_favorite",
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
    client
      .from("schedules")
      .select("id,status,memo,scheduled_on,minimum_downtime")
      .order("scheduled_on"),
  ]);

  [
    profileResult,
    categoryResult,
    ingredientResult,
    bodyResult,
    waterResult,
    exerciseResult,
    mealResult,
    scheduleResult,
  ].forEach((result) => throwIfError(result.error));

  const profile = profileResult.data as ProfileRow;
  const categoryRows = (categoryResult.data ?? []) as CategoryRow[];
  const categoryMap = new Map(categoryRows.map((row) => [row.id, row]));
  const ingredientRows = (ingredientResult.data ?? []) as IngredientRow[];
  const bodyRows = (bodyResult.data ?? []) as BodyRecordRow[];
  const exerciseRows = (exerciseResult.data ?? []) as ExerciseRow[];
  const mealRows = (mealResult.data ?? []) as MealRow[];
  const scheduleRows = (scheduleResult.data ?? []) as ScheduleRow[];

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
    categories: orderIngredientCategories(
      categoryRows.map((row) => ({
        id: row.id,
        name: row.name,
        color: row.color_hex,
        isDefault: row.is_default,
      })),
    ),
    foods: ingredientRows.map((row) => {
      const category = row.category_id
        ? categoryMap.get(row.category_id)
        : undefined;
      return {
        id: row.id,
        name: row.name,
        brand: row.brand_name ?? undefined,
        sourceOrigin: row.source_origin ?? undefined,
        sourceSyncedAt: row.source_synced_at ?? undefined,
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
        source: row.source_type ?? "user",
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
    schedules: scheduleRows.map((row) => {
      const memo = decodeScheduleMemo(row.memo);
      return {
        id: row.id,
        scheduledOn: row.scheduled_on ?? "",
        scheduledTime: memo.scheduledTime,
        status: row.status === "confirmed" ? "확정" : "미확정",
        title: memo.title,
        detail: row.minimum_downtime ? `다운타임 ${row.minimum_downtime}` : "",
        pending: row.status === "tentative",
      };
    }),
  };
}

function toMealSummary(row: MealRow): MealSummary {
  const kind = mealKindFromDatabase[row.kind] ?? "간식";
  return {
    id: row.id,
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

export async function deleteTodayBodyRecord() {
  const { error } = await requireNeon()
    .from("body_records")
    .delete()
    .eq("recorded_on", format(new Date(), "yyyy-MM-dd"));
  throwIfError(error);
}

export async function saveTodayWaterTotal(amountMl: number) {
  const dayStart = startOfDay(new Date()).toISOString();
  const dayEnd = addDays(startOfDay(new Date()), 1).toISOString();
  const client = requireNeon();
  const existing = await client
    .from("water_records")
    .select("id")
    .gte("consumed_at", dayStart)
    .lt("consumed_at", dayEnd);
  throwIfError(existing.error);

  const records = (existing.data ?? []) as Array<{ id: string }>;
  if (amountMl === 0) {
    if (!records.length) return;
    const removal = await client
      .from("water_records")
      .delete()
      .in(
        "id",
        records.map((record) => record.id),
      );
    throwIfError(removal.error);
    return;
  }

  if (!records.length) {
    const insertion = await client
      .from("water_records")
      .insert({ amount_ml: amountMl });
    throwIfError(insertion.error);
    return;
  }

  const update = await client
    .from("water_records")
    .update({ amount_ml: amountMl })
    .eq("id", records[0].id);
  throwIfError(update.error);

  const duplicateIds = records.slice(1).map((record) => record.id);
  if (!duplicateIds.length) return;
  const removal = await client
    .from("water_records")
    .delete()
    .in("id", duplicateIds);
  throwIfError(removal.error);
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

export async function updateExerciseRecord(exercise: ExerciseRecord) {
  const { error } = await requireNeon()
    .from("exercise_records")
    .update({
      name: exercise.name,
      duration_minutes: exercise.durationMinutes,
      calories_burned: exercise.caloriesBurned ?? null,
    })
    .eq("id", exercise.id);
  throwIfError(error);
}

export async function deleteExerciseRecord(id: number | string) {
  const { error } = await requireNeon()
    .from("exercise_records")
    .delete()
    .eq("id", id);
  throwIfError(error);
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
      brand_name: input.brand ?? null,
      source_type: input.source ?? "user",
      source_origin: input.sourceOrigin ?? null,
      source_synced_at: input.sourceSyncedAt ?? null,
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
    source: (input.source ?? "user") as "user" | "public",
  };
}

export async function addIngredientCategory(
  name: string,
  color: string,
): Promise<IngredientCategory> {
  const client = requireNeon();
  const fallback = await client
    .from("categories")
    .update({ sort_order: 2_147_483_647 })
    .eq("name", "기타");
  throwIfError(fallback.error);

  const { data, error } = await client
    .from("categories")
    .insert({ name, color_hex: color, is_default: false, sort_order: 1000 })
    .select("id,name,color_hex,is_default")
    .single();
  throwIfError(error);
  const row = requireData(
    data as CategoryRow | null,
    "카테고리 정보를 받지 못했습니다.",
  );
  return {
    id: row.id,
    name: row.name,
    color: row.color_hex,
    isDefault: row.is_default,
  };
}

export async function updateIngredientCategoryOrder(
  categories: IngredientCategory[],
) {
  const client = requireNeon();
  const orderedCategories = orderIngredientCategories(categories);
  await Promise.all(
    orderedCategories.map(async (category, index) => {
      const { error } = await client
        .from("categories")
        .update({ sort_order: (index + 1) * 10 })
        .eq("id", category.id);
      throwIfError(error);
    }),
  );
}

export async function deleteIngredientCategory(id: string) {
  const client = requireNeon();
  const fallback = await client
    .from("categories")
    .select("id")
    .eq("name", "기타")
    .single();
  throwIfError(fallback.error);
  const fallbackId = requireData(
    fallback.data,
    "기본 카테고리를 찾지 못했습니다.",
  ).id;

  const reassigned = await client
    .from("ingredients")
    .update({ category_id: fallbackId })
    .eq("category_id", id);
  throwIfError(reassigned.error);

  const { error } = await client.from("categories").delete().eq("id", id);
  throwIfError(error);
}

export async function updateIngredient(
  id: number | string,
  input: IngredientInput,
) {
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
  const { error } = await client
    .from("ingredients")
    .update({
      category_id: categoryData.id,
      name: input.name,
      brand_name: input.brand ?? null,
      source_type: input.source ?? "user",
      source_origin: input.sourceOrigin ?? null,
      source_synced_at: input.sourceSyncedAt ?? null,
      base_amount: input.amount,
      unit: unitToDatabase[input.unit] ?? "g",
      stock_amount: input.stockAmount,
      stock_unit: unitToDatabase[input.stockUnit] ?? "g",
      calories: input.calories,
      carbohydrates_g: input.carbs,
      protein_g: input.protein,
      fat_g: input.fat,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  throwIfError(error);
  return {
    ...input,
    id,
    favorite: input.favorite ?? false,
    source: (input.source ?? "user") as "user" | "public",
  };
}

export async function deleteIngredient(id: number | string) {
  const { error } = await requireNeon()
    .from("ingredients")
    .delete()
    .eq("id", id);
  if (error) {
    if (error.message.toLowerCase().includes("foreign key")) {
      throw new Error("메뉴에서 사용 중인 재료는 삭제할 수 없습니다.");
    }
    throw new Error(error.message);
  }
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
  if (meal.id) {
    const conflict = await client
      .from("meals")
      .select("id")
      .eq("eaten_on", eatenOn)
      .eq("kind", kind)
      .neq("id", meal.id)
      .maybeSingle();
    throwIfError(conflict.error);
    if (conflict.data) {
      throw new Error(`오늘 ${meal.kind} 식단이 이미 등록되어 있습니다.`);
    }
  }
  const existing = meal.id
    ? { data: { id: meal.id }, error: null }
    : await client
        .from("meals")
        .select("id")
        .eq("eaten_on", eatenOn)
        .eq("kind", kind)
        .maybeSingle();
  throwIfError(existing.error);

  let mealId: string;
  let existingItemId: string | undefined;
  if (existing.data) {
    mealId = String(existing.data.id);
    const existingItems = await client
      .from("meal_items")
      .select("id")
      .eq("meal_id", mealId)
      .limit(1);
    throwIfError(existingItems.error);
    existingItemId = String(existingItems.data?.[0]?.id ?? "") || undefined;
    const updateMeal = await client
      .from("meals")
      .update({ kind, eaten_at: meal.time })
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

  const itemRow = {
    meal_id: mealId,
    name_snapshot: meal.items,
    calories: meal.calories,
    carbohydrates_g: meal.carbs,
    protein_g: meal.protein,
    fat_g: meal.fat,
  };
  const itemResult = existingItemId
    ? await client.from("meal_items").update(itemRow).eq("id", existingItemId)
    : await client.from("meal_items").insert(itemRow);
  throwIfError(itemResult.error);
  return mealId;
}

export async function deleteMealRecord(id: string) {
  const { error } = await requireNeon().from("meals").delete().eq("id", id);
  throwIfError(error);
}

export async function saveScheduleRecord(input: ScheduleInput, id?: string) {
  const client = requireNeon();
  const row = {
    memo: encodeScheduleMemo(input),
    scheduled_on: input.scheduledOn,
    updated_at: new Date().toISOString(),
  };
  if (id) {
    const { error } = await client.from("schedules").update(row).eq("id", id);
    throwIfError(error);
    return id;
  }
  const { data, error } = await client
    .from("schedules")
    .insert({
      ...row,
      status: "confirmed",
      minimum_downtime: null,
    })
    .select("id")
    .single();
  throwIfError(error);
  return String(requireData(data, "일정 ID를 받지 못했습니다.").id);
}

export async function deleteScheduleRecord(id: string) {
  const { error } = await requireNeon().from("schedules").delete().eq("id", id);
  throwIfError(error);
}
