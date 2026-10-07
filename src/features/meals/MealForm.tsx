import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import type { MealKind, MealSummary } from "../dashboard/model";
import type { Ingredient } from "../ingredients/model";
import { SelectField } from "../../shared/ui";
import "./meal-form.css";

interface SelectedMealFood {
  key: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

const mealTones: Record<MealKind, string> = {
  아침: "mint",
  점심: "blue",
  저녁: "coral",
  간식: "yellow",
};

const roundNutrition = (value: number) => Math.round(value * 10) / 10;

export function MealForm({
  value,
  foods,
  save,
}: {
  value?: MealSummary;
  foods: Ingredient[];
  save: (meal: MealSummary) => void;
}) {
  const [kind, setKind] = useState<MealKind>(value?.kind ?? "아침");
  const [time, setTime] = useState(
    value?.time ?? new Date().toTimeString().slice(0, 5),
  );
  const [query, setQuery] = useState("");
  const [selectedFoods, setSelectedFoods] = useState<SelectedMealFood[]>(() =>
    value
      ? [
          {
            key: `meal-${value.id ?? value.kind}`,
            name: value.items,
            calories: value.calories,
            carbs: value.carbs,
            protein: value.protein,
            fat: value.fat,
          },
        ]
      : [],
  );
  const searchResults = foods
    .filter((food) => food.name.includes(query.trim()))
    .slice(0, 6);

  const addIngredient = (food: Ingredient) => {
    const key = `ingredient-${food.id}`;
    setSelectedFoods((current) =>
      current.some((item) => item.key === key)
        ? current
        : [
            ...current,
            {
              key,
              name: food.name,
              calories: food.calories,
              carbs: food.carbs,
              protein: food.protein,
              fat: food.fat,
            },
          ],
    );
  };

  const addCustomFood = () => {
    const name = query.trim();
    if (!name) return;
    setSelectedFoods((current) => [
      ...current,
      {
        key: `custom-${Date.now()}`,
        name,
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
      },
    ]);
    setQuery("");
  };

  const updateFood = (
    key: string,
    field: "calories" | "carbs" | "protein" | "fat",
    value: number,
  ) => {
    setSelectedFoods((current) =>
      current.map((food) =>
        food.key === key ? { ...food, [field]: value } : food,
      ),
    );
  };

  const totals = selectedFoods.reduce(
    (total, food) => ({
      calories: total.calories + food.calories,
      carbs: total.carbs + food.carbs,
      protein: total.protein + food.protein,
      fat: total.fat + food.fat,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 },
  );

  return (
    <form
      className="meal-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!selectedFoods.length) return;
        save({
          id: value?.id,
          kind,
          time,
          items: selectedFoods.map((food) => food.name).join(", "),
          calories: roundNutrition(totals.calories),
          carbs: roundNutrition(totals.carbs),
          protein: roundNutrition(totals.protein),
          fat: roundNutrition(totals.fat),
          tone: mealTones[kind],
        });
      }}
    >
      <header className="form-head">
        <span>{value ? "EDIT MEAL" : "MEAL BUILDER"}</span>
        <h2>{value ? "식단 수정" : "식단 추가"}</h2>
        <p>여러 음식을 담고 영양정보를 확인한 뒤 끼니에 등록하세요.</p>
      </header>

      <div className="meal-meta-fields">
        <label>
          <span>끼니 *</span>
          <SelectField
            value={kind}
            options={Object.keys(mealTones)}
            ariaLabel="끼니"
            onChange={(nextKind) => setKind(nextKind as MealKind)}
          />
        </label>
        <label>
          <span>시간 *</span>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
          />
        </label>
      </div>

      <section className="meal-food-search">
        <label>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="재료 보관함에서 음식 검색"
          />
        </label>
        <div className="meal-search-results">
          {searchResults.map((food) => (
            <article key={food.id}>
              <div>
                <b>{food.name}</b>
                <span>
                  {food.amount}
                  {food.unit} · {food.calories} kcal · 탄 {food.carbs}g 단{" "}
                  {food.protein}g 지 {food.fat}g
                </span>
              </div>
              <button
                type="button"
                onClick={() => addIngredient(food)}
                disabled={selectedFoods.some(
                  (item) => item.key === `ingredient-${food.id}`,
                )}
              >
                <Plus size={14} />{" "}
                {selectedFoods.some(
                  (item) => item.key === `ingredient-${food.id}`,
                )
                  ? "담음"
                  : "추가"}
              </button>
            </article>
          ))}
          {query.trim() && (
            <button
              type="button"
              className="add-custom-food"
              onClick={addCustomFood}
            >
              <Plus size={14} /> “{query.trim()}” 직접 추가
            </button>
          )}
        </div>
      </section>

      <section className="selected-meal-foods">
        <header>
          <b>선택한 음식</b>
          <span>{selectedFoods.length}개</span>
        </header>
        {selectedFoods.length ? (
          selectedFoods.map((food) => (
            <article key={food.key}>
              <header>
                <b>{food.name}</b>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedFoods((current) =>
                      current.filter((item) => item.key !== food.key),
                    )
                  }
                  aria-label={`${food.name} 제거`}
                >
                  <X size={16} />
                </button>
              </header>
              <div>
                {(
                  [
                    ["calories", "칼로리", "kcal"],
                    ["carbs", "탄수화물", "g"],
                    ["protein", "단백질", "g"],
                    ["fat", "지방", "g"],
                  ] as const
                ).map(([field, label, unit]) => (
                  <label key={field}>
                    <span>{label}</span>
                    <div>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={food[field]}
                        onChange={(event) =>
                          updateFood(
                            food.key,
                            field,
                            Number(event.target.value),
                          )
                        }
                      />
                      <b>{unit}</b>
                    </div>
                  </label>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p>검색 결과에서 음식을 추가해 주세요.</p>
        )}
      </section>

      <div className="meal-total">
        <strong>{roundNutrition(totals.calories)} kcal</strong>
        <span>탄 {roundNutrition(totals.carbs)}g</span>
        <span>단 {roundNutrition(totals.protein)}g</span>
        <span>지 {roundNutrition(totals.fat)}g</span>
      </div>
      <button className="submit" disabled={!selectedFoods.length}>
        {kind}에 등록
      </button>
    </form>
  );
}
