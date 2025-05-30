interface Usertype {
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
}

export type { Usertype };

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
}

export interface Recipe {
  image?: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface Advice {
  advice_type: "tips" | "recipe" | "warning";
  title: string;
  message: string;
  specific_recommendations?: string[];
  recipe?: Recipe;
  celebration?: string;
  micro_tip?: string;
}
