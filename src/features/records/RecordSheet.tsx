import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, InputHTMLAttributes } from "react";
import { X } from "lucide-react";
import type { Sheet } from "../../app/types";
import { categoryColorPalette, stockUnits } from "../ingredients/model";
import type { BodyRecord, BodyRecordInput } from "../body/model";
import type { ExerciseRecord } from "../dashboard/model";
import type { MealSummary } from "../dashboard/model";
import type { Ingredient, IngredientCategory } from "../ingredients/model";
import type { ScheduleEntry, ScheduleInput } from "../schedule/model";
import { MealForm } from "../meals/MealForm";
import { getNutritionGoalSummary } from "../nutrition/model";
import type { NutritionGoal } from "../nutrition/model";
import { SelectField } from "../../shared/ui";
import {
  prefetchPopularPublicFoods,
  searchPublicFoods,
} from "../../lib/public-food-api";

interface RecordSheetProps {
  sheet: Exclude<Sheet, null>;
  water: number;
  body?: BodyRecord;
  goal: NutritionGoal;
  foods: Ingredient[];
  categories: IngredientCategory[];
  scheduleTitle?: string;
  scheduleDate?: string;
  ingredient?: Ingredient;
  exercise?: ExerciseRecord;
  meal?: MealSummary;
  schedule?: ScheduleEntry;
  close: () => void;
  saveBody: (value: BodyRecordInput) => void;
  saveGoal: (value: NutritionGoal) => void;
  addFood: (event: FormEvent<HTMLFormElement>) => void;
  saveWater: (amount: number) => void;
  addExercise: (exercise: Omit<ExerciseRecord, "id">) => void;
  addMeal: (meal: MealSummary) => void;
  deleteBody: () => void;
  deleteCurrent?: () => void;
  deleteLabel?: string;
  saveSchedule: (schedule: ScheduleInput) => void;
}

export function RecordSheet({
  sheet,
  water,
  body,
  goal,
  foods,
  categories,
  scheduleTitle,
  scheduleDate,
  ingredient,
  exercise,
  meal,
  schedule,
  close,
  saveBody,
  saveGoal,
  addFood,
  saveWater,
  addExercise,
  addMeal,
  deleteBody,
  deleteCurrent,
  deleteLabel,
  saveSchedule,
}: RecordSheetProps) {
  const quickSheet =
    sheet === "schedule" || sheet === "schedule-edit" ? sheet : null;

  return (
    <div
      className="backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <section className="sheet" role="dialog" aria-modal="true">
        <div className="handle" />
        <button className="close" onClick={close} aria-label="닫기">
          <X size={19} />
        </button>
        {sheet === "weight" && (
          <WeightForm value={body} save={saveBody} remove={deleteBody} />
        )}
        {sheet === "goals" && <GoalForm value={goal} save={saveGoal} />}
        {sheet === "ingredient" && (
          <FoodForm
            value={ingredient}
            categories={categories}
            submit={addFood}
          />
        )}
        {sheet === "water" && <WaterForm value={water} save={saveWater} />}
        {sheet === "exercise" && (
          <ExerciseForm value={exercise} save={addExercise} />
        )}
        {sheet === "meal" && (
          <MealForm value={meal} foods={foods} save={addMeal} />
        )}
        {quickSheet && (
          <QuickForm
            type={quickSheet}
            scheduleTitle={scheduleTitle}
            scheduleDate={scheduleDate}
            schedule={schedule}
            save={saveSchedule}
          />
        )}
        {deleteCurrent && (
          <button className="delete-record" onClick={deleteCurrent}>
            {deleteLabel ?? "이 기록 삭제"}
          </button>
        )}
      </section>
    </div>
  );
}

function WeightForm({
  value,
  save,
  remove,
}: {
  value?: BodyRecord;
  save: (value: BodyRecordInput) => void;
  remove: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const optionalNumber = (name: string) =>
          form.get(name) ? Number(form.get(name)) : undefined;
        save({
          weightKg: Number(form.get("weight")),
          muscleMassKg: optionalNumber("muscle"),
          bodyFatMassKg: optionalNumber("fat"),
          bodyFatPercent: optionalNumber("fatRate"),
          visceralFatLevel: optionalNumber("visceral"),
        });
      }}
    >
      <FormHead
        eyebrow="BODY RECORD"
        title="오늘의 몸 상태"
        description="몸무게 외 항목은 선택 입력이에요."
      />
      <div className="form-grid">
        <Field
          label="몸무게 *"
          name="weight"
          type="number"
          step="0.1"
          defaultValue={value?.weightKg}
          unit="kg"
          required
        />
        <Field
          label="근육량"
          name="muscle"
          type="number"
          step="0.1"
          defaultValue={value?.muscleMassKg}
          unit="kg"
        />
        <Field
          label="체지방량"
          name="fat"
          type="number"
          step="0.1"
          defaultValue={value?.bodyFatMassKg}
          unit="kg"
        />
        <Field
          label="체지방률"
          name="fatRate"
          type="number"
          step="0.1"
          defaultValue={value?.bodyFatPercent}
          unit="%"
        />
        <Field
          label="내장지방"
          name="visceral"
          type="number"
          defaultValue={value?.visceralFatLevel}
        />
      </div>
      <Submit />
      {value && (
        <button className="delete-record" type="button" onClick={remove}>
          오늘 기록 삭제
        </button>
      )}
    </form>
  );
}

function GoalForm({
  value,
  save,
}: {
  value: NutritionGoal;
  save: (value: NutritionGoal) => void;
}) {
  const [draft, setDraft] = useState(() => ({
    carbsGrams: String(value.carbsGrams),
    proteinGrams: String(value.proteinGrams),
    fatGrams: String(value.fatGrams),
    waterMl: String(value.waterMl),
  }));
  const numericDraft: NutritionGoal = {
    carbsGrams: Number(draft.carbsGrams),
    proteinGrams: Number(draft.proteinGrams),
    fatGrams: Number(draft.fatGrams),
    waterMl: Number(draft.waterMl),
  };
  const summary = getNutritionGoalSummary(numericDraft);
  const updateNumber =
    (key: keyof NutritionGoal) => (event: ChangeEvent<HTMLInputElement>) => {
      setDraft((current) => ({
        ...current,
        [key]: event.target.value,
      }));
    };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save(numericDraft);
      }}
    >
      <FormHead
        eyebrow="DAILY GOAL"
        title="하루 목표 설정"
        description="탄단지 g을 입력하면 비율과 칼로리를 계산해요."
      />
      <div className="form-grid">
        <Field
          label="탄수화물 *"
          name="carbsGrams"
          type="number"
          min="0"
          step="1"
          value={draft.carbsGrams}
          onChange={updateNumber("carbsGrams")}
          unit="g"
          required
        />
        <Field
          label="단백질 *"
          name="proteinGrams"
          type="number"
          min="0"
          step="1"
          value={draft.proteinGrams}
          onChange={updateNumber("proteinGrams")}
          unit="g"
          required
        />
        <Field
          label="지방 *"
          name="fatGrams"
          type="number"
          min="0"
          step="1"
          value={draft.fatGrams}
          onChange={updateNumber("fatGrams")}
          unit="g"
          required
        />
        <Field
          label="물 섭취 목표 *"
          name="waterMl"
          type="number"
          min="1"
          value={draft.waterMl}
          onChange={updateNumber("waterMl")}
          unit="ml"
          required
        />
      </div>
      <div className="goal-preview">
        <strong>{summary.calories.toLocaleString()} kcal</strong>
        <span>탄 {summary.carbsPercent}%</span>
        <span>단 {summary.proteinPercent}%</span>
        <span>지 {summary.fatPercent}%</span>
      </div>
      <Submit label="목표 저장" />
    </form>
  );
}

function FoodForm({
  value,
  categories,
  submit,
}: {
  value?: Ingredient;
  categories: IngredientCategory[];
  submit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const publicFoodsApiConfigured = Boolean(
    import.meta.env.VITE_PUBLIC_FOODS_API_KEY ??
      import.meta.env.VITE_PUBLIC_FOOD_API_KEY,
  );
  const [selectedCategory, setSelectedCategory] = useState(
    value?.category ?? categories[0]?.name ?? "기타",
  );
  const [categoryColor, setCategoryColor] = useState(
    value?.categoryColor ?? categories[0]?.color ?? categoryColorPalette[0],
  );
  const [nameDraft, setNameDraft] = useState(value?.name ?? "");
  const [unitDraft, setUnitDraft] = useState(value?.unit ?? "g");
  const [amountDraft, setAmountDraft] = useState(String(value?.amount ?? 100));
  const [stockAmountDraft, setStockAmountDraft] = useState(
    String(value?.stockAmount ?? 0),
  );
  const [stockUnitDraft, setStockUnitDraft] = useState(
    value?.stockUnit ?? "g",
  );
  const [caloriesDraft, setCaloriesDraft] = useState(
    String(value?.calories ?? 0),
  );
  const [carbsDraft, setCarbsDraft] = useState(String(value?.carbs ?? 0));
  const [proteinDraft, setProteinDraft] = useState(String(value?.protein ?? 0));
  const [fatDraft, setFatDraft] = useState(String(value?.fat ?? 0));
  const [brandDraft, setBrandDraft] = useState(value?.brand ?? "");
  const [sourceDraft, setSourceDraft] = useState<"user" | "public">(
    value?.source ?? "user",
  );
  const [sourceOriginDraft, setSourceOriginDraft] = useState(
    value?.sourceOrigin ?? "",
  );
  const [sourceSyncedAtDraft, setSourceSyncedAtDraft] = useState(
    value?.sourceSyncedAt ?? "",
  );
  const [publicOptions, setPublicOptions] = useState<Ingredient[]>([]);
  const [searchingPublicOptions, setSearchingPublicOptions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const pickPreferredName = (rawName: string, query: string) => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rawName;
    const segments = rawName
      .split(/[>_\/|]/)
      .map((segment) => segment.trim())
      .filter(Boolean);
    const matched = segments.find((segment) =>
      segment.toLowerCase().includes(keyword),
    );
    return matched ?? segments.at(-1) ?? rawName;
  };

  useEffect(() => {
    if (!publicFoodsApiConfigured) {
      setPublicOptions([]);
      setSearchingPublicOptions(false);
      return;
    }

    const keyword = nameDraft.trim();
    if (keyword.length === 1) {
      prefetchPopularPublicFoods(keyword);
      setPublicOptions([]);
      setSearchingPublicOptions(false);
      return;
    }
    if (keyword.length < 2) {
      setPublicOptions([]);
      setSearchingPublicOptions(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timer = globalThis.setTimeout(() => {
      setSearchingPublicOptions(true);
      searchPublicFoods(keyword, { signal: controller.signal })
        .then((results) => {
          if (!active) return;
          setPublicOptions(results.slice(0, 8));
        })
        .catch((error) => {
          if (!active) return;
          if (
            typeof error === "object" &&
            error !== null &&
            "name" in error &&
            (error as { name?: string }).name === "AbortError"
          ) {
            return;
          }
          setPublicOptions([]);
        })
        .finally(() => {
          if (active) setSearchingPublicOptions(false);
        });
    }, 140);

    return () => {
      active = false;
      controller.abort();
      globalThis.clearTimeout(timer);
    };
  }, [nameDraft, publicFoodsApiConfigured]);

  const applyPublicOption = (item: Ingredient) => {
    setNameDraft(pickPreferredName(item.name, nameDraft));
    setBrandDraft(item.brand ?? "");
    setSourceDraft("public");
    setSourceOriginDraft(item.sourceOrigin ?? "식품의약품안전처 공공데이터");
    setSourceSyncedAtDraft(item.sourceSyncedAt ?? new Date().toISOString());
    setUnitDraft(item.unit);
    setAmountDraft(String(item.amount || 100));
    setStockUnitDraft(item.unit);
    setCaloriesDraft(String(item.calories));
    setCarbsDraft(String(item.carbs));
    setProteinDraft(String(item.protein));
    setFatDraft(String(item.fat));
    setShowOptions(false);
  };

  return (
    <form onSubmit={submit}>
      <FormHead
        eyebrow={value ? "EDIT INGREDIENT" : "NEW INGREDIENT"}
        title={value ? "재료 수정" : "재료 등록"}
        description="보유 수량과 영양정보를 입력해 주세요."
      />
      <div className="form-grid">
        <label className="wide ingredient-name-field">
          <span>재료명 *</span>
          <input
            name="name"
            value={nameDraft}
            onChange={(event) => {
              setNameDraft(event.target.value);
              setSourceDraft("user");
              setSourceOriginDraft("");
              setSourceSyncedAtDraft("");
              setBrandDraft("");
              setShowOptions(true);
            }}
            onFocus={() => setShowOptions(true)}
            placeholder="재료명 또는 브랜드 + 재료명 입력"
            autoComplete="off"
            required
          />
          {showOptions && nameDraft.trim().length >= 2 && (
            <div className="ingredient-autocomplete" role="listbox">
              {searchingPublicOptions && (
                <p className="ingredient-autocomplete-empty">공공데이터 검색 중...</p>
              )}
              {!searchingPublicOptions &&
                publicOptions.map((item) => {
                  const preferredName = pickPreferredName(item.name, nameDraft);
                  return (
                  <button
                    type="button"
                    key={String(item.id)}
                    className="ingredient-autocomplete-option"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => applyPublicOption(item)}
                  >
                    <b>
                      {item.brand ? `${item.brand} ${preferredName}` : preferredName}
                    </b>
                    <span>
                      {item.amount}
                      {item.unit} · {item.calories}kcal · 탄 {item.carbs}g 단 {item.protein}g 지 {item.fat}g
                    </span>
                  </button>
                  );
                })}
              {!searchingPublicOptions && !publicOptions.length && (
                <p className="ingredient-autocomplete-empty">
                  {publicFoodsApiConfigured
                    ? "일치하는 공공데이터가 없습니다."
                    : "공공데이터 API 키가 설정되지 않았어요. .env.local에 VITE_PUBLIC_FOODS_API_KEY 또는 VITE_PUBLIC_FOOD_API_KEY를 추가해 주세요."}
                </p>
              )}
            </div>
          )}
        </label>
        <input type="hidden" name="brand" value={brandDraft} readOnly />
        <input type="hidden" name="source" value={sourceDraft} readOnly />
        <input
          type="hidden"
          name="sourceOrigin"
          value={sourceOriginDraft}
          readOnly
        />
        <input
          type="hidden"
          name="sourceSyncedAt"
          value={sourceSyncedAtDraft}
          readOnly
        />
        <label>
          <span>카테고리</span>
          <SelectField
            name="category"
            value={selectedCategory}
            options={categories.map((category) => category.name)}
            ariaLabel="카테고리"
            onChange={(nextCategory) => {
              setSelectedCategory(nextCategory);
              setCategoryColor(
                categories.find((category) => category.name === nextCategory)
                  ?.color ?? categoryColorPalette[0],
              );
            }}
          />
        </label>
        <input
          type="hidden"
          name="categoryColor"
          value={categoryColor}
          readOnly
        />
        <label>
          <span>영양 기준 단위</span>
          <SelectField
            name="unit"
            value={unitDraft}
            options={["g", "ml", "개", "회분"]}
            ariaLabel="영양 기준 단위"
            onChange={(next) => setUnitDraft(next)}
          />
        </label>
        <Field
          label="영양 기준 수량"
          name="amount"
          type="number"
          value={amountDraft}
          onChange={(event) => setAmountDraft(event.target.value)}
          required
        />
        <Field
          label="보유 수량 *"
          name="stockAmount"
          type="number"
          min="0"
          step="0.1"
          value={stockAmountDraft}
          onChange={(event) => setStockAmountDraft(event.target.value)}
          required
        />
        <label>
          <span>보유 단위 *</span>
          <SelectField
            name="stockUnit"
            value={stockUnitDraft}
            options={stockUnits}
            ariaLabel="보유 단위"
            onChange={(next) => setStockUnitDraft(next)}
          />
        </label>
        <Field
          label="칼로리 *"
          name="calories"
          type="number"
          value={caloriesDraft}
          onChange={(event) => setCaloriesDraft(event.target.value)}
          unit="kcal"
          required
        />
        <Field
          label="탄수화물"
          name="carbs"
          type="number"
          step="0.1"
          value={carbsDraft}
          onChange={(event) => setCarbsDraft(event.target.value)}
          unit="g"
        />
        <Field
          label="단백질"
          name="protein"
          type="number"
          step="0.1"
          value={proteinDraft}
          onChange={(event) => setProteinDraft(event.target.value)}
          unit="g"
        />
        <Field
          label="지방"
          name="fat"
          type="number"
          step="0.1"
          value={fatDraft}
          onChange={(event) => setFatDraft(event.target.value)}
          unit="g"
        />
      </div>
      <Submit label="재료 저장" />
    </form>
  );
}

function WaterForm({
  value,
  save,
}: {
  value: number;
  save: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(String(value));
  return (
    <>
      <FormHead
        eyebrow="WATER"
        title="물 섭취량 수정"
        description="오늘 마신 물의 총량을 입력해 주세요."
      />
      <label className="large-input">
        <input
          type="number"
          min="0"
          max="5000"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <b>ml</b>
      </label>
      <button className="submit" onClick={() => save(Number(amount))}>
        저장하기
      </button>
    </>
  );
}

function ExerciseForm({
  value,
  save,
}: {
  value?: ExerciseRecord;
  save: (exercise: Omit<ExerciseRecord, "id">) => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const calories = form.get("calories");
        save({
          name: String(form.get("name")),
          durationMinutes: Number(form.get("duration")),
          caloriesBurned: calories ? Number(calories) : undefined,
        });
      }}
    >
      <FormHead
        eyebrow={value ? "EDIT EXERCISE" : "EXERCISE"}
        title={value ? "운동 수정" : "운동 기록"}
        description="운동별로 시간과 소모 칼로리를 기록하세요."
      />
      <div className="form-grid">
        <Field
          label="운동 종류 *"
          name="name"
          defaultValue={value?.name}
          required
          wide
        />
        <Field
          label="운동 시간 *"
          name="duration"
          type="number"
          min="1"
          defaultValue={value?.durationMinutes}
          unit="분"
          required
        />
        <Field
          label="칼로리 (선택)"
          name="calories"
          type="number"
          min="0"
          defaultValue={value?.caloriesBurned}
          unit="kcal"
        />
      </div>
      <Submit />
    </form>
  );
}

function QuickForm({
  type,
  scheduleTitle,
  scheduleDate,
  schedule,
  save,
}: {
  type: "schedule" | "schedule-edit";
  scheduleTitle?: string;
  scheduleDate?: string;
  schedule?: ScheduleEntry;
  save: (schedule: ScheduleInput) => void;
}) {
  const [timeMode, setTimeMode] = useState<"all-day" | "time">(
    schedule?.scheduledTime ? "time" : "all-day",
  );
  const [scheduledTime, setScheduledTime] = useState(
    schedule?.scheduledTime ?? "09:00",
  );
  const copy = {
    schedule: ["일정 추가", "확정 여부와 날짜를 기록하세요."],
    "schedule-edit": ["일정 수정", "선택한 일정의 내용을 수정하세요."],
  };
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        save({
          title: String(form.get("memo")),
          scheduledOn: String(form.get("value")),
          scheduledTime: timeMode === "time" ? scheduledTime : undefined,
        });
      }}
    >
      <FormHead
        eyebrow={type === "schedule-edit" ? "EDIT SCHEDULE" : "NEW RECORD"}
        title={copy[type][0]}
        description={copy[type][1]}
      />
      <div className="form-grid">
        <Field
          label="이름 또는 메모 *"
          name="memo"
          defaultValue={
            type === "schedule-edit"
              ? (schedule?.title ?? scheduleTitle)
              : undefined
          }
          required
          wide
        />
        <div className="schedule-time-field wide">
          <span>일정 유형</span>
          <div className="schedule-time-controls">
            <div className="schedule-time-mode" aria-label="일정 시간 유형">
              <button
                type="button"
                className={timeMode === "all-day" ? "active" : ""}
                onClick={() => setTimeMode("all-day")}
              >
                종일
              </button>
              <button
                type="button"
                className={timeMode === "time" ? "active" : ""}
                onClick={() => setTimeMode("time")}
              >
                시간
              </button>
            </div>
          </div>
        </div>
        <div className="schedule-date-time-row wide">
          <Field
            label="날짜 *"
            name="value"
            type="date"
            defaultValue={
              type === "schedule-edit" ? schedule?.scheduledOn : scheduleDate
            }
            required
          />
          <label>
            <span>시간</span>
            {timeMode === "time" ? (
              <input
                type="time"
                value={scheduledTime}
                onChange={(event) => setScheduledTime(event.target.value)}
                aria-label="일정 시간"
                required
              />
            ) : (
              <span className="schedule-all-day">종일</span>
            )}
          </label>
        </div>
      </div>
      <Submit label={type === "schedule-edit" ? "수정 저장" : "기록 저장"} />
    </form>
  );
}

function FormHead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="form-head">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </header>
  );
}

function Field({
  label,
  unit,
  wide,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  unit?: string;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "wide" : ""}>
      <span>{label}</span>
      <div className={unit ? "input-unit" : ""}>
        <input {...props} />
        {unit && <b>{unit}</b>}
      </div>
    </label>
  );
}

function Submit({ label = "기록 저장" }: { label?: string }) {
  return <button className="submit">{label}</button>;
}
