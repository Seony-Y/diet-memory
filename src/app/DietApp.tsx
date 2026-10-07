import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { format } from "date-fns";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Home,
  Sparkles,
  Power,
  Utensils,
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
import type { Ingredient } from "../features/ingredients/model";
import { useNutritionGoal } from "../features/nutrition/model";
import { RecordSheet } from "../features/records/RecordSheet";
import { SchedulePage } from "../features/schedule/SchedulePage";
import { NavButton } from "../shared/ui";
import {
  addExerciseRecord,
  addIngredient,
  addWaterRecord,
  loadDietData,
  saveBodyRecord as persistBodyRecord,
  saveMealRecord,
  saveNutritionGoal,
  setIngredientFavorite,
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
  const [water, setWater] = useState(0);
  const {
    records: bodyRecords,
    saveToday: saveBodyRecord,
    setRecords: setBodyRecords,
  } = useBodyRecords();
  const { goal, setGoal } = useNutritionGoal();
  const [foods, setFoods] = useState<Ingredient[]>([]);
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
        setFoods(data.foods);
        setBodyRecords(data.bodyRecords);
        setWater(data.water);
        setExercises(data.exercises);
        setMeals(data.meals);
        setIntake(calculateMealIntake(data.meals));
        setCalorieHistory(data.calorieHistory);
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

  const addWater = async (amount: number) => {
    try {
      await addWaterRecord(amount);
      setWater((current) => current + amount);
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
      const food = await addIngredient({
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
      });
      setFoods((current) => [food, ...current]);
      setSheet(null);
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    }
  };

  const addExercise = async (exercise: Omit<ExerciseRecord, "id">) => {
    try {
      const id = await addExerciseRecord(exercise);
      setExercises((current) => [{ id, ...exercise }, ...current]);
      setSheet(null);
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    }
  };

  const addMeal = async (meal: MealSummary) => {
    try {
      await saveMealRecord(meal);
      setMeals((current) => {
        const existingIndex = current.findIndex(
          (item) => item.kind === meal.kind,
        );
        const next =
          existingIndex === -1
            ? [...current, meal]
            : current.map((item, index) =>
                index === existingIndex ? meal : item,
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
      setSheet(null);
    } catch (error) {
      setDataError(
        error instanceof Error ? error.message : "저장에 실패했습니다.",
      );
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <Sparkles size={17} />
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
                addWater={addWater}
              />
            )}
            {tab === "foods" && (
              <IngredientsPage
                foods={filteredFoods}
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
                openSheet={setSheet}
                editSchedule={(title) => {
                  setScheduleTitle(title);
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
          body={todayBody}
          goal={goal}
          foods={foods}
          scheduleTitle={scheduleTitle}
          close={() => setSheet(null)}
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
          addWater={(amount) => {
            addWater(amount);
            setSheet(null);
          }}
          addExercise={addExercise}
          addMeal={addMeal}
        />
      )}
    </div>
  );
}
