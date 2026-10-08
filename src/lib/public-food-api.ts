import type { Ingredient } from "../features/ingredients/model";

type PublicFoodRow = Record<string, string | number | null | undefined>;

interface FoodsafetyResponse {
  I2790?: {
    row?: PublicFoodRow[];
  };
}

interface DataGoResponse {
  header?: {
    resultCode?: string;
    resultMsg?: string;
  };
  body?: {
    items?: PublicFoodRow[];
  };
}

const publicSearchCache = new Map<string, Ingredient[]>();
const popularKeywords = [
  "닭가슴살",
  "계란",
  "우유",
  "고구마",
  "바나나",
  "사과",
  "두부",
  "현미",
  "오트밀",
  "샐러드",
];

export interface PublicFoodSearchOptions {
  signal?: AbortSignal;
}

const isAbortError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  (error as { name?: string }).name === "AbortError";

const parsePublicFoodRows = (rows: PublicFoodRow[]): Ingredient[] => {
  const syncedAt = new Date().toISOString();
  const results: Ingredient[] = [];
  for (const row of rows) {
    const name = pickString(row, ["DESC_KOR", "FOOD_NM_KR", "FOOD_NM"]);
    const brand = pickString(row, ["MAKER_NAME", "BSSH_NM", "CMPNY_NM"]);
    const serving = extractServing(
      pickString(row, ["SERVING_SIZE", "SERVING_UNIT", "SERV_SIZE"]),
    );
    const calories = toNumber(row.ENERC_KCAL ?? row.NUTR_CONT1);
    const carbs = toNumber(row.CHO ?? row.NUTR_CONT2);
    const protein = toNumber(row.PROT ?? row.NUTR_CONT3);
    const fat = toNumber(row.FATCE ?? row.NUTR_CONT4);
    const foodCode = pickString(row, ["FOOD_CD", "DESC_KOR_SEQ", "NUM"]);

    if (!name) continue;
    const normalizedName = brand ? `${brand} ${name}` : name;
    const idKey = foodCode || `${normalizedName}-${serving.amount}-${serving.unit}`;

    results.push({
      id: `public-${idKey}`,
      name,
      brand,
      sourceOrigin: "식품의약품안전처 공공데이터",
      sourceSyncedAt: syncedAt,
      category: "공공데이터",
      categoryColor: "#e6edf7",
      amount: serving.amount,
      unit: serving.unit,
      stockAmount: 0,
      stockUnit: serving.unit,
      calories,
      carbs,
      protein,
      fat,
      favorite: false,
      source: "public" as const,
    });
  }
  return results;
};

async function fetchPublicFoodsByKeyword(
  keyword: string,
  apiKey: string,
  baseUrl: string,
  serviceId: string,
  signal?: AbortSignal,
): Promise<Ingredient[]> {
  const endpoint = `${baseUrl}/${apiKey}/${serviceId}/json/1/80/DESC_KOR=${encodeURIComponent(keyword)}`;
  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error("공공데이터 검색 요청에 실패했습니다.");
  }
  const payload = (await response.json()) as FoodsafetyResponse;
  return parsePublicFoodRows(payload.I2790?.row ?? []);
}

function parseDataGoRows(rows: PublicFoodRow[]): Ingredient[] {
  const syncedAt = new Date().toISOString();
  const results: Ingredient[] = [];
  for (const row of rows) {
    const name = pickString(row, ["FOOD_NM_KR", "FOOD_NM"]);
    const brand = pickString(row, ["MAKER_NM", "IMP_MANUFAC_NM", "SELLER_MANUFAC_NM"]);
    const serving = extractServing(
      pickString(row, ["SERVING_SIZE", "NUTRI_AMOUNT_SERVING", "Z10500"]),
    );
    const calories = toNumber(row.AMT_NUM1);
    const carbs = toNumber(row.AMT_NUM6);
    const protein = toNumber(row.AMT_NUM3);
    const fat = toNumber(row.AMT_NUM4);
    const foodCode = pickString(row, ["FOOD_CD", "NUM"]);

    if (!name) continue;
    const normalizedName = brand ? `${brand} ${name}` : name;
    const idKey = foodCode || `${normalizedName}-${serving.amount}-${serving.unit}`;

    results.push({
      id: `public-datagokr-${idKey}`,
      name,
      brand,
      sourceOrigin: "공공데이터포털 식품영양성분DB",
      sourceSyncedAt: syncedAt,
      category: "공공데이터",
      categoryColor: "#e6edf7",
      amount: serving.amount,
      unit: serving.unit,
      stockAmount: 0,
      stockUnit: serving.unit,
      calories,
      carbs,
      protein,
      fat,
      favorite: false,
      source: "public" as const,
    });
  }
  return results;
}

async function fetchDataGoFoodsByKeyword(
  keyword: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<Ingredient[]> {
  const endpoint =
    "https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo03/getFoodNtrCpntDbInq03" +
    `?serviceKey=${encodeURIComponent(apiKey)}` +
    "&pageNo=1&numOfRows=80&type=json" +
    `&FOOD_NM_KR=${encodeURIComponent(keyword)}`;
  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error("공공데이터포털 검색 요청에 실패했습니다.");
  }
  const payload = (await response.json()) as DataGoResponse;
  return parseDataGoRows(payload.body?.items ?? []);
}

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pickString = (row: PublicFoodRow, keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const CHOSEONG = [
  "g",
  "kk",
  "n",
  "d",
  "tt",
  "r",
  "m",
  "b",
  "pp",
  "s",
  "ss",
  "",
  "j",
  "jj",
  "ch",
  "k",
  "t",
  "p",
  "h",
] as const;

const JUNGSEONG = [
  "a",
  "ae",
  "ya",
  "yae",
  "eo",
  "e",
  "yeo",
  "ye",
  "o",
  "wa",
  "wae",
  "oe",
  "yo",
  "u",
  "wo",
  "we",
  "wi",
  "yu",
  "eu",
  "ui",
  "i",
] as const;

const JONGSEONG = [
  "",
  "k",
  "k",
  "ks",
  "n",
  "nj",
  "nh",
  "t",
  "l",
  "lk",
  "lm",
  "lb",
  "ls",
  "lt",
  "lp",
  "lh",
  "m",
  "p",
  "ps",
  "t",
  "t",
  "ng",
  "t",
  "t",
  "k",
  "t",
  "p",
  "h",
] as const;

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

const romanizeHangulSyllable = (char: string) => {
  const code = char.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_END) return char;
  const syllableIndex = code - HANGUL_BASE;
  const choseongIndex = Math.floor(syllableIndex / 588);
  const jungseongIndex = Math.floor((syllableIndex % 588) / 28);
  const jongseongIndex = syllableIndex % 28;
  return `${CHOSEONG[choseongIndex]}${JUNGSEONG[jungseongIndex]}${JONGSEONG[jongseongIndex]}`;
};

export const romanizeKoreanText = (text: string) =>
  text
    .split("")
    .map((char) => romanizeHangulSyllable(char))
    .join("")
    .replace(/\s+/g, " ")
    .trim();

const extractServing = (value: string) => {
  const text = value.trim();
  const match = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(g|ml)/i);
  if (match) {
    return {
      amount: Number(match[1]),
      unit: match[2].toLowerCase() as "g" | "ml",
    };
  }
  return { amount: 100, unit: "g" as const };
};

const hasAllTokens = (haystack: string, query: string) => {
  const normalized = haystack.toLowerCase();
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.every((token) => normalized.includes(token));
};

const hasAllTokensFromList = (haystack: string, tokens: string[]) => {
  const normalized = haystack.toLowerCase();
  return tokens.every((token) => normalized.includes(token));
};

const buildSearchText = (item: Ingredient) => {
  const brand = item.brand ?? "";
  const name = item.name;
  const romanizedBrand = romanizeKoreanText(brand);
  const romanizedName = romanizeKoreanText(name);
  return `${brand} ${name} ${romanizedBrand} ${romanizedName}`;
};

const getPrimaryNameSegment = (name: string) => {
  const segments = name.split(/[>_\/|]/).map((segment) => segment.trim());
  return segments.at(-1)?.toLowerCase() ?? name.toLowerCase();
};

const getMatchBucket = (item: Ingredient, queryTokens: string[]) => {
  const primaryName = getPrimaryNameSegment(item.name);
  const romanizedPrimary = romanizeKoreanText(primaryName).toLowerCase();
  const fullName = item.name.toLowerCase();
  const romanizedFullName = romanizeKoreanText(item.name).toLowerCase();

  if (
    hasAllTokensFromList(primaryName, queryTokens) ||
    hasAllTokensFromList(romanizedPrimary, queryTokens)
  ) {
    return 0;
  }
  if (
    hasAllTokensFromList(fullName, queryTokens) ||
    hasAllTokensFromList(romanizedFullName, queryTokens)
  ) {
    return 1;
  }
  return 2;
};

const scoreMatch = (item: Ingredient, query: string) => {
  const normalizedQuery = query.toLowerCase();
  const name = item.name.toLowerCase();
  const primaryName = getPrimaryNameSegment(item.name);
  const brand = (item.brand ?? "").toLowerCase();
  const romanizedName = romanizeKoreanText(item.name).toLowerCase();
  const romanizedBrand = romanizeKoreanText(item.brand ?? "").toLowerCase();
  let score = 0;

  if (primaryName === normalizedQuery) score += 160;
  if (name === normalizedQuery) score += 140;
  if (primaryName.startsWith(normalizedQuery)) score += 110;
  if (name.startsWith(normalizedQuery)) score += 90;
  if (primaryName.includes(normalizedQuery)) score += 70;
  if (name.includes(normalizedQuery)) score += 50;
  if (brand.includes(normalizedQuery)) score += 12;
  if (romanizedName.includes(normalizedQuery)) score += 10;
  if (romanizedBrand.includes(normalizedQuery)) score += 6;
  if (!name.includes(normalizedQuery) && !primaryName.includes(normalizedQuery)) {
    score -= 40;
  }
  if (item.brand) score += 1;

  return score;
};

export async function searchPublicFoods(
  query: string,
  options: PublicFoodSearchOptions = {},
): Promise<Ingredient[]> {
  const { signal } = options;
  const keyword = query.trim();
  if (!keyword) return [];
  if (signal?.aborted) {
    throw new DOMException("검색 요청이 취소되었습니다.", "AbortError");
  }

  const cacheKey = keyword.toLowerCase();
  const cached = publicSearchCache.get(cacheKey);
  if (cached) return cached;

  const apiKey =
    import.meta.env.VITE_PUBLIC_FOODS_API_KEY ??
    import.meta.env.VITE_PUBLIC_FOOD_API_KEY;
  if (!apiKey) return [];

  let normalizedApiKey = apiKey;
  try {
    normalizedApiKey = decodeURIComponent(apiKey);
  } catch {
    normalizedApiKey = apiKey;
  }

  const baseUrl =
    import.meta.env.VITE_PUBLIC_FOODS_API_BASE_URL ??
    "https://openapi.foodsafetykorea.go.kr/api";
  const serviceId = import.meta.env.VITE_PUBLIC_FOODS_SERVICE_ID ?? "I2790";
  const tokenized = keyword.split(/\s+/).filter(Boolean);
  const fallbackKeyword = tokenized.at(-1);

  const safeFetch = async (job: Promise<Ingredient[]>) => {
    try {
      return await job;
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) throw error;
      return [];
    }
  };

  const foodsafetyJobs: Array<Promise<Ingredient[]>> = [
    safeFetch(
      fetchPublicFoodsByKeyword(
        keyword,
        normalizedApiKey,
        baseUrl,
        serviceId,
        signal,
      ),
    ),
  ];
  if (fallbackKeyword && fallbackKeyword !== keyword) {
    foodsafetyJobs.push(
      safeFetch(
        fetchPublicFoodsByKeyword(
          fallbackKeyword,
          normalizedApiKey,
          baseUrl,
          serviceId,
          signal,
        ),
      ),
    );
  }
  const [primaryResults = [], fallbackResults = []] = await Promise.all(foodsafetyJobs);

  if (!primaryResults.length && !fallbackResults.length) {
    const dataGoJobs: Array<Promise<Ingredient[]>> = [
      safeFetch(fetchDataGoFoodsByKeyword(keyword, normalizedApiKey, signal)),
    ];
    if (fallbackKeyword && fallbackKeyword !== keyword) {
      dataGoJobs.push(
        safeFetch(
          fetchDataGoFoodsByKeyword(fallbackKeyword, normalizedApiKey, signal),
        ),
      );
    }
    const [dataGoPrimary = [], dataGoFallback = []] = await Promise.all(dataGoJobs);
    primaryResults.push(...dataGoPrimary);
    fallbackResults.push(...dataGoFallback);
  }

  const deduped = new Map<string, Ingredient>();
  for (const item of [...primaryResults, ...fallbackResults]) {
    const key = `${(item.brand ?? "").toLowerCase()}::${item.name.toLowerCase()}`;
    if (!deduped.has(key)) deduped.set(key, item);
  }

  const queryTokens = keyword.toLowerCase().split(/\s+/).filter(Boolean);

  const sortedResults = [...deduped.values()]
    .filter((item) => hasAllTokens(buildSearchText(item), keyword))
    .sort((left, right) => {
      const leftBucket = getMatchBucket(left, queryTokens);
      const rightBucket = getMatchBucket(right, queryTokens);
      if (leftBucket !== rightBucket) return leftBucket - rightBucket;

      if (leftBucket === 0) {
        const leftHasBrand = left.brand ? 1 : 0;
        const rightHasBrand = right.brand ? 1 : 0;
        if (leftHasBrand !== rightHasBrand) return rightHasBrand - leftHasBrand;
      }

      const scoreGap = scoreMatch(right, keyword) - scoreMatch(left, keyword);
      if (scoreGap !== 0) return scoreGap;

      const leftPrimary = getPrimaryNameSegment(left.name);
      const rightPrimary = getPrimaryNameSegment(right.name);
      const normalizedQuery = keyword.toLowerCase();
      const leftIndex = leftPrimary.indexOf(normalizedQuery);
      const rightIndex = rightPrimary.indexOf(normalizedQuery);
      if (leftIndex !== rightIndex) {
        return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
      }

      if (leftPrimary.length !== rightPrimary.length) {
        return leftPrimary.length - rightPrimary.length;
      }

      return left.name.length - right.name.length;
    })
    .slice(0, 20);

  publicSearchCache.set(cacheKey, sortedResults);
  if (publicSearchCache.size > 120) {
    const firstKey = publicSearchCache.keys().next().value;
    if (firstKey) publicSearchCache.delete(firstKey);
  }

  return sortedResults;
}

export function prefetchPopularPublicFoods(prefix: string) {
  const keyword = prefix.trim();
  if (keyword.length !== 1) return;
  const lower = keyword.toLowerCase();

  const candidates = popularKeywords
    .filter((item) => item.toLowerCase().startsWith(lower))
    .slice(0, 4);

  for (const candidate of candidates) {
    const cacheKey = candidate.toLowerCase();
    if (publicSearchCache.has(cacheKey)) continue;
    searchPublicFoods(candidate).catch(() => {
      // Prefetch should never affect user flow.
    });
  }
}
