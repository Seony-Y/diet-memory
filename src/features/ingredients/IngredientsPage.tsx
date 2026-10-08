import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Heart,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import type { Sheet } from "../../app/types";
import { categoryColorPalette } from "./model";
import type { Ingredient, IngredientCategory } from "./model";
import { PageTitle } from "../../shared/ui";

interface IngredientsPageProps {
  foods: Ingredient[];
  publicFoods: Ingredient[];
  publicFoodsLoading: boolean;
  savingPublicFoodIds: string[];
  publicSearchError: string;
  categories: IngredientCategory[];
  category: string;
  search: string;
  setCategory: (value: string) => void;
  setSearch: (value: string) => void;
  clearPublicSearchError: () => void;
  openSheet: (sheet: Sheet) => void;
  toggleFavorite: (id: number | string) => void;
  editFood: (food: Ingredient) => void;
  savePublicFood: (food: Ingredient) => void;
  addCategory: (name: string, color: string) => Promise<void>;
  reorderCategories: (categories: IngredientCategory[]) => Promise<void>;
  deleteCategory: (category: IngredientCategory) => void;
}

export function IngredientsPage({
  foods,
  publicFoods,
  publicFoodsLoading,
  savingPublicFoodIds,
  publicSearchError,
  categories,
  category,
  search,
  setCategory,
  setSearch,
  clearPublicSearchError,
  openSheet,
  toggleFavorite,
  editFood,
  savePublicFood,
  addCategory,
  reorderCategories,
  deleteCategory,
}: IngredientsPageProps) {
  const categoryList = useRef<HTMLDivElement>(null);
  const [categoryScroll, setCategoryScroll] = useState({
    left: false,
    right: false,
  });
  const [managingCategories, setManagingCategories] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState(categoryColorPalette[0]);
  const [savingCategory, setSavingCategory] = useState(false);
  const [movingCategoryId, setMovingCategoryId] = useState<string>();

  useEffect(() => {
    const list = categoryList.current;
    if (!list) return;

    const updateScrollState = () => {
      setCategoryScroll({
        left: list.scrollLeft > 2,
        right: list.scrollLeft < list.scrollWidth - list.clientWidth - 2,
      });
    };
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(list);
    updateScrollState();
    return () => observer.disconnect();
  }, [categories]);

  const moveCategories = (direction: -1 | 1) => {
    const list = categoryList.current;
    if (!list) return;
    list.scrollBy({
      left: direction * Math.max(140, list.clientWidth * 0.65),
      behavior: "smooth",
    });
  };

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) return;
    setSavingCategory(true);
    try {
      await addCategory(name, categoryColor);
      setCategoryName("");
    } catch {
      // The app-level error banner reports the API or reserved-name error.
    } finally {
      setSavingCategory(false);
    }
  };

  const moveCategory = async (id: string, direction: -1 | 1) => {
    const movableCategories = categories.filter((item) => item.name !== "기타");
    const currentIndex = movableCategories.findIndex((item) => item.id === id);
    const targetIndex = currentIndex + direction;
    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= movableCategories.length
    ) {
      return;
    }

    const reordered = [...movableCategories];
    [reordered[currentIndex], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[currentIndex],
    ];
    const fallback = categories.find((item) => item.name === "기타");
    setMovingCategoryId(id);
    try {
      await reorderCategories(fallback ? [...reordered, fallback] : reordered);
    } catch {
      // The app-level error banner reports the API error.
    } finally {
      setMovingCategoryId(undefined);
    }
  };

  const movableCategoryCount = categories.filter(
    (item) => item.name !== "기타",
  ).length;
  const savedPublicFoodKeys = new Set(
    foods
      .filter((food) => food.source === "public")
      .map((food) => `${(food.brand ?? "").toLowerCase()}::${food.name.toLowerCase()}`),
  );

  return (
    <>
      <PageTitle
        eyebrow="MY PANTRY"
        title="재료 보관함"
        description="자주 먹는 재료의 영양정보를 저장해 두세요."
      >
        <div className="page-title-actions">
          <button
            className="secondary"
            onClick={() => setManagingCategories((current) => !current)}
          >
            <Settings2 size={16} /> 카테고리 관리
          </button>
          <button onClick={() => openSheet("ingredient")}>
            <Plus size={17} /> 재료 등록
          </button>
        </div>
      </PageTitle>
      {managingCategories && (
        <section className="category-manager">
          <header>
            <div>
              <strong>카테고리 관리</strong>
              <span>새 카테고리를 만들거나 순서를 변경할 수 있습니다.</span>
            </div>
          </header>
          <form onSubmit={submitCategory}>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              maxLength={30}
              placeholder="카테고리 이름"
              aria-label="새 카테고리 이름"
              required
            />
            <div className="category-manager-colors">
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
            </div>
            <button className="category-add" disabled={savingCategory}>
              <Plus size={16} /> {savingCategory ? "추가 중" : "추가"}
            </button>
          </form>
          <div className="category-manager-list">
            {categories.map((item, index) => (
              <div className="category-manager-item" key={item.id}>
                <span
                  className="category-color"
                  style={{ backgroundColor: item.color }}
                />
                <strong>{item.name}</strong>
                {item.name === "기타" ? (
                  <span
                    className="category-fixed"
                    title="항상 마지막에 고정"
                    aria-label="항상 마지막에 고정"
                  >
                    <LockKeyhole size={13} />
                  </span>
                ) : (
                  <div className="category-manager-actions">
                    <button
                      className="category-order"
                      onClick={() => void moveCategory(item.id, -1)}
                      disabled={index === 0 || movingCategoryId !== undefined}
                      aria-label={`${item.name} 카테고리 위로 이동`}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="category-order"
                      onClick={() => void moveCategory(item.id, 1)}
                      disabled={
                        index === movableCategoryCount - 1 ||
                        movingCategoryId !== undefined
                      }
                      aria-label={`${item.name} 카테고리 아래로 이동`}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      className="category-delete"
                      onClick={() => deleteCategory(item)}
                      disabled={movingCategoryId !== undefined}
                      aria-label={`${item.name} 카테고리 삭제`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      <label className="search">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="재료 이름 검색"
        />
      </label>
      <div className="category-strip">
        <button
          className="category-scroll previous"
          onClick={() => moveCategories(-1)}
          disabled={!categoryScroll.left}
          aria-label="이전 카테고리 보기"
        >
          <ChevronLeft size={16} />
        </button>
        <div
          className="categories"
          ref={categoryList}
          onScroll={() => {
            const list = categoryList.current;
            if (!list) return;
            setCategoryScroll({
              left: list.scrollLeft > 2,
              right: list.scrollLeft < list.scrollWidth - list.clientWidth - 2,
            });
          }}
        >
          {["전체", "즐겨찾기", ...categories.map((item) => item.name)].map(
            (item) => (
              <button
                className={item === category ? "active" : ""}
                onClick={() => setCategory(item)}
                key={item}
              >
                {item}
              </button>
            ),
          )}
        </div>
        <button
          className="category-scroll next"
          onClick={() => moveCategories(1)}
          disabled={!categoryScroll.right}
          aria-label="다음 카테고리 보기"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="food-list">
        {foods.map((food) => (
          <article className="food-row" key={food.id}>
            <div className="food-copy">
              <div>
                <span
                  className={`source-badge ${food.source === "public" ? "public" : "user"}`}
                >
                  {food.source === "public" ? "공공데이터" : "유저등록"}
                </span>
                <span
                  className="category-badge"
                  style={
                    {
                      "--category-color": food.categoryColor,
                    } as CSSProperties
                  }
                >
                  {food.category}
                </span>
                <h3>{food.brand ? `${food.brand} ${food.name}` : food.name}</h3>
              </div>
              <p>
                보유 {food.stockAmount.toLocaleString()}
                {food.stockUnit} · {food.amount}
                {food.unit} 기준
              </p>
              {food.source === "public" && (
                <p className="food-source-meta">
                  출처 {food.sourceOrigin ?? "식품의약품안전처 공공데이터"} · 동기화일{" "}
                  {food.sourceSyncedAt
                    ? new Date(food.sourceSyncedAt).toLocaleDateString("ko-KR")
                    : "미기록"}
                </p>
              )}
            </div>
            <div className="food-nutrition">
              <strong>
                {food.calories}
                <small> kcal</small>
              </strong>
              <p>
                <span>탄 {food.carbs}g</span>
                <span>단 {food.protein}g</span>
                <span>지 {food.fat}g</span>
              </p>
            </div>
            <div className="food-actions">
              <button
                onClick={() => editFood(food)}
                aria-label={`${food.name} 수정`}
              >
                <Pencil size={14} />
              </button>
              <button
                className="food-favorite"
                onClick={() => toggleFavorite(food.id)}
                aria-label={`${food.name} 즐겨찾기`}
              >
                <Heart
                  size={15}
                  fill={food.favorite ? "currentColor" : "none"}
                />
              </button>
            </div>
          </article>
        ))}
      </div>
      {search.trim() && (
        <section className="public-food-results">
          <header>
            <strong>공공데이터 검색 결과</strong>
            <span>
              {publicFoodsLoading
                ? "조회 중..."
                : `${publicFoods.length.toLocaleString()}건`}
            </span>
          </header>
          {publicSearchError && (
            <div className="public-search-toast" role="status" aria-live="polite">
              <span>{publicSearchError}</span>
              <button onClick={clearPublicSearchError} aria-label="공공 검색 안내 닫기">
                닫기
              </button>
            </div>
          )}
          {publicFoodsLoading && (
            <p className="public-food-empty">공공데이터를 조회하고 있어요.</p>
          )}
          {!publicFoodsLoading && !publicFoods.length && (
            <p className="public-food-empty">검색 결과가 없습니다.</p>
          )}
          {!publicFoodsLoading &&
            publicFoods.map((food) => {
              const key = `${(food.brand ?? "").toLowerCase()}::${food.name.toLowerCase()}`;
              const alreadySaved = savedPublicFoodKeys.has(key);
              const isSaving = savingPublicFoodIds.includes(String(food.id));
              return (
                <article className="food-row public" key={food.id}>
                  <div className="food-copy">
                    <div>
                      <span className="source-badge public">공공데이터</span>
                      <h3>
                        {food.brand ? `${food.brand} ${food.name}` : food.name}
                      </h3>
                    </div>
                    <p>
                      {food.amount}
                      {food.unit} 기준
                    </p>
                  </div>
                  <div className="food-nutrition">
                    <strong>
                      {food.calories}
                      <small> kcal</small>
                    </strong>
                    <p>
                      <span>탄 {food.carbs}g</span>
                      <span>단 {food.protein}g</span>
                      <span>지 {food.fat}g</span>
                    </p>
                  </div>
                  <div className="food-actions">
                    <button
                      className="save-public-food"
                      onClick={() => savePublicFood(food)}
                      disabled={alreadySaved || isSaving}
                      aria-label={`${food.name} 재료를 내 보관함에 저장`}
                    >
                      {alreadySaved ? "저장완료" : isSaving ? "저장 중" : "DB 저장"}
                    </button>
                  </div>
                </article>
              );
            })}
        </section>
      )}
    </>
  );
}
