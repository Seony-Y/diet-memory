import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { format } from "date-fns";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Home,
  Power,
  Utensils,
  X,
} from "lucide-react";
import type { Sheet, Tab } from "./types";
import { AssistantPage } from "../features/assistant/AssistantPage";
import {
  getTodayRecord,
  getYesterdayRecord,
  useBodyRecords,
} from "../features/body/model";
import type { BodyRecordInput } from "../features/body/model";
import { TodayPage } from "../features/dashboard/TodayPage";
import { emptyNutritionIntake } from "../features/dashboard/model";
import type {
  ExerciseRecord,
  MealSummary,
  NutritionIntake,
} from "../features/dashboard/model";
import { IngredientsPage } from "../features/ingredients/IngredientsPage";
import type {
  Ingredient,
  IngredientCategory,
} from "../features/ingredients/model";
import { orderIngredientCategories } from "../features/ingredients/model";
import { useNutritionGoal } from "../features/nutrition/model";
import { RecordSheet } from "../features/records/RecordSheet";
import { SchedulePage } from "../features/schedule/SchedulePage";
import type { ScheduleEntry, ScheduleInput } from "../features/schedule/model";
import { NavButton } from "../shared/ui";
import {
  addExerciseRecord,
  addIngredient,
  addIngredientCategory,
  deleteExerciseRecord,
  deleteIngredient,
  deleteIngredientCategory,
  deleteMealRecord,
  deleteScheduleRecord,
  deleteTodayBodyRecord,
  loadDietData,
  saveBodyRecord as persistBodyRecord,
  saveMealRecord,
  saveNutritionGoal,
  saveScheduleRecord,
  saveTodayWaterTotal,
  setIngredientFavorite,
  updateExerciseRecord,
  updateIngredient,
  updateIngredientCategoryOrder,
} from "../lib/diet-api";
import { isNeonConfigured } from "../lib/neon";

const calculateMealIntake = (meals: MealSummary[]): NutritionIntake =>
  meals.reduce(
    (total, meal) => ({
      calories: total.calories + meal.calories,
      carbs: total.carbs + meal.carbs,
      protein: total.protein + meal.protein,
      fat: total.fat + meal.fat,
    }),
    { ...emptyNutritionIntake },
  );

const StatisticsPage = lazy(() =>
  import("../features/statistics/StatisticsPage").then((module) => ({
    default: module.StatisticsPage,
  })),
);

interface DeleteConfirmation {
  message: string;
  action: () => Promise<void>;
}

export default function DietApp({
  userEmail,
  signOut,
}: {
  userEmail: string;
  signOut: () => void | Promise<unknown>;
}) {
  const [tab, setTab] = useState<Tab>("today");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [scheduleTitle, setScheduleTitle] = useState<string>();
  const [scheduleDate, setScheduleDate] = useState<string>();
  const [water, setWater] = useState(0);
  const {
    records: bodyRecords,
    saveToday: saveBodyRecord,
    setRecords: setBodyRecords,
  } = useBodyRecords();
  const { goal, setGoal } = useNutritionGoal();
  const [foods, setFoods] = useState<Ingredient[]>([]);
  const [ingredientCategories, setIngredientCategories] = useState<
    IngredientCategory[]
  >([]);
  const [meals, setMeals] = useState<MealSummary[]>([]);
  const [intake, setIntake] = useState<NutritionIntake>(emptyNutritionIntake);
  const [exercises, setExercises] = useState<ExerciseRecord[]>([]);
  const [calorieHistory, setCalorieHistory] = useState<
    Array<{ recordedOn: string; calories: number }>
  >([]);
  const [category, setCategory] = useState("전체");
  const [search, setSearch] = useState("");
  const [dataLoading, setDataLoading] = useState(isNeonConfigured);
  const [dataError, setDataError] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation>();
  const [deleting, setDeleting] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient>();
  const [editingExercise, setEditingExercise] = useState<ExerciseRecord>();
  const [editingMeal, setEditingMeal] = useState<MealSummary>();
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEntry>();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);

  useEffect(() => {
    globalThis.scrollTo({ top: 0, behavior: "instant" });
  }, [tab]);

  useEffect(() => {
    if (!isNeonConfigured) return;
    let active = true;
    loadDietData()
      .then((data) => {
        if (!active) return;
        setGoal(data.goal);
        setIngredientCategories(data.categories);
        setFoods(data.foods);
        setBodyRecords(data.bodyRecords);
        setWater(data.water);
        setExercises(data.exercises);
        setMeals(data.meals);
        setIntake(calculateMealIntake(data.meals));
        setCalorieHistory(data.calorieHistory);
        setSchedules(data.schedules);
      })
      .catch((error: unknown) => {
        if (active)
          setDataError(
            error instanceof Error
              ? error.message
              : "데이터를 불러오지 못했습니다.",
          );
      })
      .finally(() => active && setDataLoading(false));

    return () => {
      active = false;
    };
  }, [setBodyRecords, setGoal]);

  useEffect(() => {
    if (!import.meta.env.DEV || isNeonConfigured) return;
    let active = true;

    import("../mocks/data").then((mocks) => {
      if (!active) return;
      setFoods((current) => (current.length ? current : mocks.mockFoods));
      setMeals((current) => {
        const next = current.length ? current : mocks.mockMeals;
        setIntake(calculateMealIntake(next));
        return next;
      });
      setExercises((current) =>
        current.length ? current : mocks.mockExercises,
      );
      setCalorieHistory(mocks.mockCalorieHistory);
      setBodyRecords((current) =>
        current.length ? current : mocks.createMockBodyRecords(),
      );
      setWater(1250);
    });

    return () => {
      active = false;
    };
  }, [setBodyRecords]);

  const filteredFoods = useMemo(
    () =>
      foods.filter((food) => {
        const matchesCategory =
          category === "전체" ||
          (category === "즐겨찾기"
            ? food.favorite
            : food.category === category);
        return matchesCategory && food.name.includes(search);
      }),
    [category, foods, search],
  );

  const todayBody = getTodayRecord(bodyRecords);
  const yesterdayBody = getYesterdayRecord(bodyRecords);

  const saveBody = async (value: BodyRecordInput) => {
    try {
      await persistBodyRecord(value);
      saveBodyRecord(value);
      setSheet(null);
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    }
  };

  const saveWater = async (amount: number) => {
    try {
      await saveTodayWaterTotal(amount);
      setWater(amount);
      setSheet(null);
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    }
  };

  const addFood = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const input = {
        name: String(form.get("name")),
        category: String(form.get("category")),
        categoryColor: String(form.get("categoryColor")),
        amount: Number(form.get("amount")),
        unit: String(form.get("unit")),
        stockAmount: Number(form.get("stockAmount")),
        stockUnit: String(form.get("stockUnit")),
        calories: Number(form.get("calories")),
        carbs: Number(form.get("carbs")) || 0,
        protein: Number(form.get("protein")) || 0,
        fat: Number(form.get("fat")) || 0,
        favorite: editingIngredient?.favorite,
      };
      const food = editingIngredient
        ? await updateIngredient(editingIngredient.id, input)
        : await addIngredient(input);
      setFoods((current) =>
        editingIngredient
          ? current.map((item) => (item.id === food.id ? food : item))
          : [food, ...current],
      );
      setEditingIngredient(undefined);
      setSheet(null);
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    }
  };

  const createIngredientCategory = async (name: string, color: string) => {
    if (["전체", "즐겨찾기", "기타"].includes(name)) {
      const error = new Error(`${name} 카테고리는 기본 항목입니다.`);
      setDataError(error.message);
      throw error;
    }
    try {
      const created = await addIngredientCategory(name, color);
      setIngredientCategories((current) =>
        orderIngredientCategories([...current, created]),
      );
    } catch (error) {
      setDataError(
        error instanceof Error
          ? error.message
          : "카테고리 추가에 실패했습니다.",
      );
      throw error;
    }
  };

  const reorderIngredientCategories = async (
    categories: IngredientCategory[],
  ) => {
    const orderedCategories = orderIngredientCategories(categories);
    try {
      await updateIngredientCategoryOrder(orderedCategories);
      setIngredientCategories(orderedCategories);
    } catch (error) {
      setDataError(
        error instanceof Error
          ? error.message
          : "카테고리 순서 저장에 실패했습니다.",
      );
      throw error;
    }
  };

  const removeIngredientCategory = async (item: IngredientCategory) => {
    try {
      await deleteIngredientCategory(item.id);
      const fallback = ingredientCategories.find(
        (category) => category.name === "기타",
      );
      setIngredientCategories((current) =>
        current.filter((category) => category.id !== item.id),
      );
      setFoods((current) =>
        current.map((food) =>
          food.category === item.name
            ? {
                ...food,
                category: "기타",
                categoryColor: fallback?.color ?? "#E8ECEE",
              }
            : food,
        ),
      );
      if (category === item.name) setCategory("전체");
    } catch (error) {
      setDataError(
        error instanceof Error
          ? error.message
          : "카테고리 삭제에 실패했습니다.",
      );
    }
  };

  const addExercise = async (exercise: Omit<ExerciseRecord, "id">) => {
    try {
      if (editingExercise) {
        const updated = { ...exercise, id: editingExercise.id };
        await updateExerciseRecord(updated);
        setExercises((current) =>
          current.map((item) =>
            item.id === editingExercise.id ? updated : item,
          ),
        );
      } else {
        const id = await addExerciseRecord(exercise);
        setExercises((current) => [{ id, ...exercise }, ...current]);
      }
      setEditingExercise(undefined);
      setSheet(null);
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    }
  };

  const addMeal = async (meal: MealSummary) => {
    try {
      const id = await saveMealRecord(meal);
      const savedMeal = { ...meal, id };
      setMeals((current) => {
        const existingIndex = current.findIndex((item) =>
          editingMeal?.id
            ? item.id === editingMeal.id
            : item.kind === savedMeal.kind,
        );
        const next =
          existingIndex === -1
            ? [...current, savedMeal]
            : current.map((item, index) =>
                index === existingIndex ? savedMeal : item,
              );
        const nextIntake = calculateMealIntake(next);
        setIntake(nextIntake);
        setCalorieHistory((history) => {
          const today = format(new Date(), "yyyy-MM-dd");
          const withoutToday = history.filter(
            (record) => record.recordedOn !== today,
          );
          return [
            ...withoutToday,
            { recordedOn: today, calories: nextIntake.calories },
          ];
        });
        return next;
      });
      setEditingMeal(undefined);
      setSheet(null);
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    }
  };

  const closeSheet = () => {
    setSheet(null);
    setEditingIngredient(undefined);
    setEditingExercise(undefined);
    setEditingMeal(undefined);
    setEditingSchedule(undefined);
    setScheduleDate(undefined);
  };

  const removeIngredient = async (food: Ingredient) => {
    try {
      await deleteIngredient(food.id);
      setFoods((current) => current.filter((item) => item.id !== food.id));
      closeSheet();
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "삭제에 실패했습니다.",
      );
    }
  };

  const removeExercise = async (exercise: ExerciseRecord) => {
    try {
      await deleteExerciseRecord(exercise.id);
      setExercises((current) =>
        current.filter((item) => item.id !== exercise.id),
      );
      closeSheet();
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "삭제에 실패했습니다.",
      );
    }
  };

  const removeMeal = async (meal: MealSummary) => {
    if (!meal.id) return;
    try {
      await deleteMealRecord(meal.id);
      setMeals((current) => {
        const next = current.filter((item) => item.id !== meal.id);
        setIntake(calculateMealIntake(next));
        return next;
      });
      closeSheet();
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "삭제에 실패했습니다.",
      );
    }
  };

  const removeTodayBody = async () => {
    try {
      await deleteTodayBodyRecord();
      const today = format(new Date(), "yyyy-MM-dd");
      setBodyRecords((current) =>
        current.filter((record) => record.recordedOn !== today),
      );
      closeSheet();
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "삭제에 실패했습니다.",
      );
    }
  };

  const saveSchedule = async (input: ScheduleInput) => {
    try {
      const id = await saveScheduleRecord(input, editingSchedule?.id);
      const saved: ScheduleEntry = {
        id,
        scheduledOn: input.scheduledOn,
        scheduledTime: input.scheduledTime,
        status: editingSchedule?.status ?? "확정",
        title: input.title,
        detail: editingSchedule?.detail ?? "",
        pending: editingSchedule?.pending ?? false,
      };
      setSchedules((current) =>
        editingSchedule
          ? current.map((item) => (item.id === id ? saved : item))
          : [...current, saved],
      );
      closeSheet();
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    }
  };

  const removeSchedule = async (schedule: ScheduleEntry) => {
    try {
      await deleteScheduleRecord(schedule.id);
      setSchedules((current) =>
        current.filter((item) => item.id !== schedule.id),
      );
      closeSheet();
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "삭제에 실패했습니다.",
      );
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <img src="/icon-192x192.png" alt="" />
        </div>
        <div className="brand">
          <span>DIET MEMORY</span>
          <strong>나의 건강 기록</strong>
        </div>
        <div className="app-meta">
          <span title={userEmail}>{userEmail}</span>
          <button
            className="sign-out-button"
            onClick={() => void signOut()}
            aria-label="로그아웃"
            title="로그아웃"
          >
            <Power size={15} strokeWidth={2.2} />
          </button>
        </div>
      </header>
      <main className="content">
        {dataError && (
          <div className="data-error" role="alert">
            <span>{dataError}</span>
            <button onClick={() => setDataError("")}>닫기</button>
          </div>
        )}
        {dataLoading && (
          <div className="page-loading">기록을 불러오는 중...</div>
        )}
        {!dataLoading && (
          <>
            {tab === "today" && (
              <TodayPage
                water={water}
                body={todayBody}
                yesterday={yesterdayBody}
                goal={goal}
                meals={meals}
                intake={intake}
                exercises={exercises}
                openSheet={setSheet}
                editMeal={(meal) => {
                  setEditingMeal(meal);
                  setSheet("meal");
                }}
                editExercise={(exercise) => {
                  setEditingExercise(exercise);
                  setSheet("exercise");
                }}
              />
            )}
            {tab === "foods" && (
              <IngredientsPage
                foods={filteredFoods}
                categories={ingredientCategories}
                category={category}
                search={search}
                setCategory={setCategory}
                setSearch={setSearch}
                openSheet={setSheet}
                toggleFavorite={(id) =>
                  void (async () => {
                    const food = foods.find((item) => item.id === id);
                    if (!food) return;
                    try {
                      await setIngredientFavorite(id, !food.favorite);
                      setFoods((current) =>
                        current.map((item) =>
                          item.id === id
                            ? { ...item, favorite: !item.favorite }
                            : item,
                        ),
                      );
                    } catch (error) {
                      setDataError(
                        error instanceof Error
                          ? error.message
                          : "저장에 실패했습니다.",
                      );
                    }
                  })()
                }
                editFood={(food) => {
                  setEditingIngredient(food);
                  setSheet("ingredient");
                }}
                addCategory={createIngredientCategory}
                reorderCategories={reorderIngredientCategories}
                deleteCategory={(item) =>
                  setDeleteConfirmation({
                    message: `${item.name} 카테고리를 삭제합니다. 이 카테고리의 재료는 기타로 이동합니다.`,
                    action: () => removeIngredientCategory(item),
                  })
                }
              />
            )}
            {tab === "stats" && (
              <Suspense
                fallback={
                  <div className="page-loading">통계를 불러오는 중...</div>
                }
              >
                <StatisticsPage
                  records={bodyRecords}
                  calorieHistory={calorieHistory}
                />
              </Suspense>
            )}
            {tab === "schedule" && (
              <SchedulePage
                schedules={schedules}
                addSchedule={(scheduledOn) => {
                  setScheduleDate(scheduledOn);
                  setSheet("schedule");
                }}
                editSchedule={(schedule) => {
                  setScheduleTitle(schedule.title);
                  setEditingSchedule(schedule);
                  setSheet("schedule-edit");
                }}
              />
            )}
            {tab === "ai" && <AssistantPage />}
          </>
        )}
      </main>
      <nav className="bottom-nav">
        <NavButton
          icon={Home}
          label="Today"
          active={tab === "today"}
          onClick={() => setTab("today")}
        />
        <NavButton
          icon={Utensils}
          label="식단관리"
          active={tab === "foods"}
          onClick={() => setTab("foods")}
        />
        <NavButton
          icon={BarChart3}
          label="통계"
          active={tab === "stats"}
          onClick={() => setTab("stats")}
        />
        <NavButton
          icon={CalendarDays}
          label="일정"
          active={tab === "schedule"}
          onClick={() => setTab("schedule")}
        />
        <NavButton
          icon={Bot}
          label="AI 비서"
          active={tab === "ai"}
          onClick={() => setTab("ai")}
        />
      </nav>
      {sheet && (
        <RecordSheet
          sheet={sheet}
          water={water}
          body={todayBody}
          goal={goal}
          foods={foods}
          categories={ingredientCategories}
          scheduleTitle={scheduleTitle}
          scheduleDate={scheduleDate}
          ingredient={editingIngredient}
          exercise={editingExercise}
          meal={editingMeal}
          schedule={editingSchedule}
          close={closeSheet}
          saveBody={saveBody}
          saveGoal={async (next) => {
            try {
              await saveNutritionGoal(next);
              setGoal(next);
              setSheet(null);
            } catch (error) {
              setDataError(
                error instanceof Error ? error.message : "저장에 실패했습니다.",
              );
            }
          }}
          addFood={addFood}
          saveWater={saveWater}
          addExercise={addExercise}
          addMeal={addMeal}
          deleteBody={() =>
            setDeleteConfirmation({
              message: "오늘의 몸 상태 기록을 삭제합니다.",
              action: removeTodayBody,
            })
          }
          deleteCurrent={
            editingIngredient
              ? () =>
                  setDeleteConfirmation({
                    message: `${editingIngredient.name} 재료를 삭제합니다.`,
                    action: () => removeIngredient(editingIngredient),
                  })
              : editingExercise
                ? () =>
                    setDeleteConfirmation({
                      message: `${editingExercise.name} 운동 기록을 삭제합니다.`,
                      action: () => removeExercise(editingExercise),
                    })
                : editingMeal
                  ? () =>
                      setDeleteConfirmation({
                        message: `${editingMeal.kind} 식단 기록을 삭제합니다.`,
                        action: () => removeMeal(editingMeal),
                      })
                  : editingSchedule
                    ? () =>
                        setDeleteConfirmation({
                          message: `${editingSchedule.title} 일정을 삭제합니다.`,
                          action: () => removeSchedule(editingSchedule),
                        })
                    : undefined
          }
          saveSchedule={saveSchedule}
        />
      )}
      {deleteConfirmation && (
        <div className="confirm-backdrop" role="presentation">
          <section
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
          >
            <button
              className="confirm-close"
              onClick={() => setDeleteConfirmation(undefined)}
              aria-label="삭제 확인 닫기"
            >
              <X size={18} />
            </button>
            <div className="confirm-mark">
              <X size={22} />
            </div>
            <h2 id="delete-confirm-title">삭제하시겠습니까?</h2>
            <p>{deleteConfirmation.message}</p>
            <div className="confirm-actions">
              <button onClick={() => setDeleteConfirmation(undefined)}>
                취소
              </button>
              <button
                className="confirm-delete"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  await deleteConfirmation.action();
                  setDeleting(false);
                  setDeleteConfirmation(undefined);
                }}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
