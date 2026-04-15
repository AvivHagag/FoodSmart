export interface User {
  _id: string;
  email: string;
  fullname: string;
  createdAt?: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  image?: string | null;
  gender?: string | null;
  activityLevel?: string | null;
  goal?: string | null;
  bmi?: number | null;
  tdee?: number | null;
  isAdmin?: boolean | null;
}

export interface MealItem {
  name: string;
  time: string;
  calories: number;
  fat: number;
  protein: number;
  carbo: number;
  items: string;
  imageUri?: string | null;
}

export interface MealDay {
  _id: string;
  userId: string;
  date: string;
  totalCalories: number;
  totalFat: number;
  totalProtein: number;
  totalCarbo: number;
  mealsList: MealItem[];
}

export interface UserGoals {
  tdee: number;
  goal?: string | null;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  gender?: string | null;
  activityLevel?: string | null;
}

export interface StatisticsResponse {
  meals: MealDay[];
  userGoals: UserGoals;
  range: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface AnalyzedFoodItem {
  label: string;
  confidence: number;
  estimated_grams: number;
  unit: "piece" | "gram";
  count: number | null;
  piece_avg_weight: number | null;
  cal: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}
