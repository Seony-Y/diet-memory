export interface Ingredient {
  id: number | string;
  name: string;
  category: string;
  categoryColor: string;
  amount: number;
  unit: string;
  stockAmount: number;
  stockUnit: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  favorite: boolean;
}

export const categories = [
  "전체",
  "즐겨찾기",
  "야채",
  "과일",
  "육류",
  "수산",
  "소스",
  "완제품",
  "기타",
];

export const stockUnits = ["g", "ml", "개", "회분"];

export const categoryColors: Record<string, string> = {
  야채: "#DDF1E8",
  과일: "#FAEBD8",
  육류: "#F8E3DE",
  수산: "#DCEEF8",
  소스: "#EEE5F6",
  완제품: "#E2E7F8",
  기타: "#E8ECEE",
};

export const categoryColorPalette = [
  "#DDF1E8",
  "#DCEEF8",
  "#E2E7F8",
  "#EEE5F6",
  "#F8E3DE",
  "#FAEBD8",
  "#E8ECEE",
];
