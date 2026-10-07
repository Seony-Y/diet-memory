import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import type { Sheet } from "../../app/types";
import { categories } from "./model";
import type { Ingredient } from "./model";
import { PageTitle } from "../../shared/ui";

interface IngredientsPageProps {
  foods: Ingredient[];
  category: string;
  search: string;
  setCategory: (value: string) => void;
  setSearch: (value: string) => void;
  openSheet: (sheet: Sheet) => void;
  toggleFavorite: (id: number | string) => void;
  editFood: (food: Ingredient) => void;
}

export function IngredientsPage({
  foods,
  category,
  search,
  setCategory,
  setSearch,
  openSheet,
  toggleFavorite,
  editFood,
}: IngredientsPageProps) {
  const categoryList = useRef<HTMLDivElement>(null);
  const [categoryScroll, setCategoryScroll] = useState({
    left: false,
    right: false,
  });

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
  }, []);

  const moveCategories = (direction: -1 | 1) => {
    const list = categoryList.current;
    if (!list) return;
    list.scrollBy({
      left: direction * Math.max(140, list.clientWidth * 0.65),
      behavior: "smooth",
    });
  };

  return (
    <>
      <PageTitle
        eyebrow="MY PANTRY"
        title="재료 보관함"
        description="자주 먹는 재료의 영양정보를 저장해 두세요."
      >
        <button onClick={() => openSheet("ingredient")}>
          <Plus size={17} /> 재료 등록
        </button>
      </PageTitle>
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
          {categories.map((item) => (
            <button
              className={item === category ? "active" : ""}
              onClick={() => setCategory(item)}
              key={item}
            >
              {item}
            </button>
          ))}
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
                  className="category-badge"
                  style={
                    {
                      "--category-color": food.categoryColor,
                    } as CSSProperties
                  }
                >
                  {food.category}
                </span>
                <h3>{food.name}</h3>
              </div>
              <p>
                보유 {food.stockAmount.toLocaleString()}
                {food.stockUnit} · {food.amount}
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
    </>
  );
}
