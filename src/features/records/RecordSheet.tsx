import { useState } from "react";
import type { ChangeEvent, FormEvent, InputHTMLAttributes } from "react";
import { X } from "lucide-react";
import type { Sheet } from "../../app/types";
import {
  categories,
  categoryColorPalette,
  categoryColors,
  stockUnits,
} from "../ingredients/model";
import type { BodyRecord, BodyRecordInput } from "../body/model";
import type { ExerciseRecord } from "../dashboard/model";
import type { MealSummary } from "../dashboard/model";
import type { Ingredient } from "../ingredients/model";
import type { ScheduleEntry, ScheduleInput } from "../schedule/model";
import { MealForm } from "../meals/MealForm";
import { getNutritionGoalSummary } from "../nutrition/model";
import type { NutritionGoal } from "../nutrition/model";
import { SelectField } from "../../shared/ui";

interface RecordSheetProps {
  sheet: Exclude<Sheet, null>;
  water: number;
  body?: BodyRecord;
  goal: NutritionGoal;
  foods: Ingredient[];
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
          <FoodForm value={ingredient} submit={addFood} />
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
  const [draft, setDraft] = useState(value);
  const summary = getNutritionGoalSummary(draft);
  const updateNumber =
    (key: keyof NutritionGoal) => (event: ChangeEvent<HTMLInputElement>) => {
      setDraft((current) => ({
        ...current,
        [key]: Number(event.target.value),
      }));
    };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save(draft);
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
  submit,
}: {
  value?: Ingredient;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState(
    value?.category ?? categories[2],
  );
  const [categoryColor, setCategoryColor] = useState(
    value?.categoryColor ?? categoryColors[selectedCategory],
  );

  return (
    <form onSubmit={submit}>
      <FormHead
        eyebrow={value ? "EDIT INGREDIENT" : "NEW INGREDIENT"}
        title={value ? "재료 수정" : "재료 등록"}
        description="보유 수량과 영양정보를 입력해 주세요."
      />
      <div className="form-grid">
        <Field
          label="재료명 *"
          name="name"
          defaultValue={value?.name}
          required
          wide
        />
        <label>
          <span>카테고리</span>
          <SelectField
            name="category"
            value={selectedCategory}
            options={categories.slice(2)}
            ariaLabel="카테고리"
            onChange={(nextCategory) => {
              setSelectedCategory(nextCategory);
              setCategoryColor(categoryColors[nextCategory]);
            }}
          />
        </label>
        <div className="category-color-field wide">
          <span>카테고리 색상</span>
          <div className="category-color-picker">
            {categoryColorPalette.map((color) => (
              <button
                type="button"
                className={categoryColor === color ? "active" : ""}
                style={{ backgroundColor: color }}
                onClick={() => setCategoryColor(color)}
                aria-label={`${color} 색상 선택`}
                key={color}
              />
            ))}
            <input
              type="hidden"
              name="categoryColor"
              value={categoryColor}
              readOnly
            />
          </div>
        </div>
        <label>
          <span>영양 기준 단위</span>
          <SelectField
            name="unit"
            options={["g", "ml", "개", "회분"]}
            defaultValue={value?.unit}
            ariaLabel="영양 기준 단위"
          />
        </label>
        <Field
          label="영양 기준 수량"
          name="amount"
          type="number"
          defaultValue={value?.amount ?? 100}
          required
        />
        <Field
          label="보유 수량 *"
          name="stockAmount"
          type="number"
          min="0"
          step="0.1"
          defaultValue={value?.stockAmount}
          required
        />
        <label>
          <span>보유 단위 *</span>
          <SelectField
            name="stockUnit"
            options={stockUnits}
            defaultValue={value?.stockUnit}
            ariaLabel="보유 단위"
          />
        </label>
        <Field
          label="칼로리 *"
          name="calories"
          type="number"
          defaultValue={value?.calories}
          unit="kcal"
          required
        />
        <Field
          label="탄수화물"
          name="carbs"
          type="number"
          step="0.1"
          defaultValue={value?.carbs}
          unit="g"
        />
        <Field
          label="단백질"
          name="protein"
          type="number"
          step="0.1"
          defaultValue={value?.protein}
          unit="g"
        />
        <Field
          label="지방"
          name="fat"
          type="number"
          step="0.1"
          defaultValue={value?.fat}
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
  const [amount, setAmount] = useState(value);
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
          onChange={(event) => setAmount(Number(event.target.value))}
        />
        <b>ml</b>
      </label>
      <button className="submit" onClick={() => save(amount)}>
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
        <Field
          label="날짜 *"
          name="value"
          type="date"
          defaultValue={
            type === "schedule-edit" ? schedule?.scheduledOn : scheduleDate
          }
          required
        />
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
