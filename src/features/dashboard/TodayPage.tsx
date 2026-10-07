import { Fragment, useState } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Dumbbell,
  Plus,
  Pencil,
  Settings2,
  Trash2,
  Utensils,
  Weight,
} from "lucide-react";
import type { Sheet } from "../../app/types";
import type { BodyRecord } from "../body/model";
import type { ExerciseRecord, MealSummary, NutritionIntake } from "./model";
import { getNutritionGoalSummary } from "../nutrition/model";
import type { NutritionGoal } from "../nutrition/model";
import { MacroProgress, MetricCard, SectionTitle } from "../../shared/ui";

interface TodayPageProps {
  water: number;
  body?: BodyRecord;
  yesterday?: BodyRecord;
  goal: NutritionGoal;
  meals: MealSummary[];
  intake: NutritionIntake;
  exercises: ExerciseRecord[];
  openSheet: (sheet: Sheet) => void;
  addWater: (amount: number) => void;
  resetWater: () => void;
  editMeal: (meal: MealSummary) => void;
  deleteMeal: (meal: MealSummary) => void;
  editExercise: (exercise: ExerciseRecord) => void;
  deleteExercise: (exercise: ExerciseRecord) => void;
}

export function TodayPage({
  water,
  body,
  yesterday,
  goal,
  meals,
  intake,
  exercises,
  openSheet,
  addWater,
  resetWater,
  editMeal,
  deleteMeal,
  editExercise,
  deleteExercise,
}: TodayPageProps) {
  const [selectedMeal, setSelectedMeal] = useState<string>();
  const goalSummary = getNutritionGoalSummary(goal);
  const progressPercent = (current: number, target: number) =>
    target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const weightChange =
    body && yesterday ? body.weightKg - yesterday.weightKg : null;
  const calorieExceeded = intake.calories > goalSummary.calories;
  const ringProgress = progressPercent(intake.calories, goalSummary.calories);

  return (
    <>
      <header className="page-head">
        <div>
          <p>{format(new Date(), "yyyy년 M월 d일")}</p>
          <h1>나의 목표</h1>
        </div>
        <div className="date-nav">
          <button aria-label="이전 날짜">
            <ChevronLeft size={18} />
          </button>
          <b>오늘</b>
          <button aria-label="다음 날짜">
            <ChevronRight size={18} />
          </button>
        </div>
      </header>
      <section className="summary">
        <button
          className="goal-settings"
          onClick={() => openSheet("goals")}
          aria-label="칼로리와 영양 목표 설정"
        >
          <Settings2 size={18} />
        </button>
        <div className="ring">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <linearGradient
                id="calorie-ring-gradient"
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor="#79e2ff" />
                <stop offset="100%" stopColor="#22aee8" />
              </linearGradient>
            </defs>
            <circle className="ring-track" cx="50" cy="50" r="42" />
            <circle
              className="ring-progress"
              cx="50"
              cy="50"
              r="42"
              pathLength="100"
              strokeDasharray={`${ringProgress} 100`}
            />
          </svg>
          <div>
            <strong className={calorieExceeded ? "exceeded" : ""}>
              {intake.calories.toLocaleString()}
            </strong>
            <span>/ {goalSummary.calories.toLocaleString()} kcal</span>
          </div>
        </div>
        <div className="macros">
          <p>
            <span>오늘 섭취량</span>
            <b>
              {calorieExceeded
                ? `${(intake.calories - goalSummary.calories).toLocaleString()} kcal 초과`
                : `${(goalSummary.calories - intake.calories).toLocaleString()} kcal 남음`}
            </b>
          </p>
          <MacroProgress
            label={`탄수화물 ${goalSummary.carbsPercent}%`}
            current={intake.carbs}
            goal={goal.carbsGrams}
            unit="g"
            width={`${progressPercent(intake.carbs, goal.carbsGrams)}%`}
            color="#379bc1"
          />
          <MacroProgress
            label={`단백질 ${goalSummary.proteinPercent}%`}
            current={intake.protein}
            goal={goal.proteinGrams}
            unit="g"
            width={`${progressPercent(intake.protein, goal.proteinGrams)}%`}
            color="#ef806c"
          />
          <MacroProgress
            label={`지방 ${goalSummary.fatPercent}%`}
            current={intake.fat}
            goal={goal.fatGrams}
            unit="g"
            width={`${progressPercent(intake.fat, goal.fatGrams)}%`}
            color="#e4b557"
          />
        </div>
      </section>
      <SectionTitle eyebrow="MEALS" title="식단">
        <button onClick={() => openSheet("meal")}>
          <Plus size={16} /> 식단 추가
        </button>
      </SectionTitle>
      <section className="meal-list">
        {meals.length ? (
          meals.map((meal) => {
            const hasNutrition = meal.calories > 0;
            const isSelected = selectedMeal === meal.kind;
            return (
              <Fragment key={meal.kind}>
                <article className={`meal ${isSelected ? "selected" : ""}`}>
                  <button
                    className="meal-summary"
                    onClick={() =>
                      setSelectedMeal(isSelected ? undefined : meal.kind)
                    }
                    aria-expanded={hasNutrition ? isSelected : undefined}
                    aria-label={
                      hasNutrition
                        ? `${meal.kind} 영양성분표 ${isSelected ? "닫기" : "보기"}`
                        : `${meal.kind} 영양정보 없음`
                    }
                    disabled={!hasNutrition}
                  >
                    <div className={`meal-icon ${meal.tone}`}>
                      <Utensils size={18} />
                    </div>
                    <div className="meal-copy">
                      <p>
                        <b>{meal.kind}</b>
                        <span>{meal.time}</span>
                      </p>
                      <small>{meal.items}</small>
                    </div>
                    <strong>
                      {meal.calories || "—"}{" "}
                      <small>{meal.calories ? "kcal" : ""}</small>
                    </strong>
                  </button>
                  <div className="record-actions">
                    <button
                      onClick={() => editMeal(meal)}
                      aria-label={`${meal.kind} 식단 수정`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="delete-action"
                      onClick={() => deleteMeal(meal)}
                      aria-label={`${meal.kind} 식단 삭제`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
                {isSelected && (
                  <section
                    className="meal-nutrition"
                    aria-label={`${meal.kind} 영양성분표`}
                  >
                    <header>
                      <b>영양성분표</b>
                      <span>{meal.items}</span>
                    </header>
                    <div>
                      <p>
                        <span>칼로리</span>
                        <strong>{meal.calories} kcal</strong>
                      </p>
                      <p>
                        <span>탄수화물</span>
                        <strong>{meal.carbs}g</strong>
                      </p>
                      <p>
                        <span>단백질</span>
                        <strong>{meal.protein}g</strong>
                      </p>
                      <p>
                        <span>지방</span>
                        <strong>{meal.fat}g</strong>
                      </p>
                    </div>
                  </section>
                )}
              </Fragment>
            );
          })
        ) : (
          <p className="empty-records">아직 기록한 식단이 없어요.</p>
        )}
      </section>
      <div className="metrics">
        <MetricCard
          icon={Droplets}
          eyebrow="WATER"
          title="물 섭취"
          onAdd={() => openSheet("water")}
        >
          <div className="metric-value">
            <strong>{water.toLocaleString()}</strong>
            <span>/ {goal.waterMl.toLocaleString()} ml</span>
          </div>
          <div className="progress">
            <i
              style={{
                width: `${Math.min(100, (water / goal.waterMl) * 100)}%`,
              }}
            />
          </div>
          <div className="quick-water">
            {[100, 250, 500].map((amount) => (
              <button key={amount} onClick={() => addWater(amount)}>
                +{amount}
              </button>
            ))}
            {water > 0 && (
              <button
                className="delete-action"
                onClick={resetWater}
                aria-label="오늘 물 기록 초기화"
                title="오늘 기록 초기화"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </MetricCard>
        <MetricCard
          icon={Weight}
          eyebrow="BODY"
          title="몸무게"
          onAdd={() => openSheet("weight")}
        >
          <div className="metric-value">
            <strong>{body?.weightKg.toFixed(1) ?? "—"}</strong>
            <span>kg</span>
            <em>
              {weightChange === null
                ? "어제 기록 없음"
                : `어제 대비 ${weightChange > 0 ? "+" : ""}${weightChange.toFixed(1)}kg`}
            </em>
          </div>
          <div className="body-detail body-detail-grid">
            <span>
              근육량 <b>{body?.muscleMassKg?.toFixed(1) ?? "—"}kg</b>
            </span>
            <span>
              체지방량 <b>{body?.bodyFatMassKg?.toFixed(1) ?? "—"}kg</b>
            </span>
            <span>
              체지방률 <b>{body?.bodyFatPercent?.toFixed(1) ?? "—"}%</b>
            </span>
          </div>
        </MetricCard>
      </div>
      <div className="exercise-section">
        <MetricCard
          icon={Dumbbell}
          eyebrow="EXERCISE"
          title="운동"
          onAdd={() => openSheet("exercise")}
        >
          <div className="exercise-records">
            {exercises.length ? (
              exercises.map((exercise) => (
                <article key={exercise.id}>
                  <div>
                    <b>{exercise.name}</b>
                    <span>{exercise.durationMinutes}분</span>
                  </div>
                  <strong>
                    {exercise.caloriesBurned === undefined
                      ? "칼로리 미입력"
                      : `${exercise.caloriesBurned.toLocaleString()} kcal`}
                  </strong>
                  <div className="record-actions">
                    <button
                      onClick={() => editExercise(exercise)}
                      aria-label={`${exercise.name} 운동 수정`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="delete-action"
                      onClick={() => deleteExercise(exercise)}
                      aria-label={`${exercise.name} 운동 삭제`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-records">아직 기록한 운동이 없어요.</p>
            )}
          </div>
        </MetricCard>
      </div>
    </>
  );
}
