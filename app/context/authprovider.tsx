import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@/constants/constants";
import moment from "moment";

interface User {
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

interface RegisterResponse {
  success: boolean;
  message: string | null;
}

interface LoginResponse {
  success: boolean;
  error?: string;
  token?: string;
  user?: User;
}

interface Meal {
  _id?: string;
  userId: string;
  date: string;
  totalCalories: number;
  totalFat: number;
  totalProtein: number;
  totalCarbo: number;
  mealsList: MealItem[];
}

interface MealItem {
  name: string;
  time: string;
  calories: number;
  fat: number;
  protein: number;
  carbo: number;
  items: string;
  imageUri?: string;
}

interface GlobalContextProps {
  isLogged: boolean;
  user: User | null;
  loading: boolean;
  userMeals: Meal[];
  fetchMeals: () => Promise<void>;
  register: (
    email: string,
    fullname: string,
    password: string
  ) => Promise<RegisterResponse>;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const GlobalContext = createContext<GlobalContextProps>({
  isLogged: false,
  user: null,
  loading: true,
  userMeals: [],
  fetchMeals: async () => {},
  register: async () => ({ success: false, message: "Default implementation" }),
  login: async () => ({
    success: false,
    error: "Default login implementation",
  }),
  logout: async () => {},
  updateUser: async () => {},
});

export const useGlobalContext = () => useContext(GlobalContext);

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userMeals, setUserMeals] = useState<Meal[]>([]);

  const getTodayString = () =>
    moment().tz("Asia/Jerusalem").format("YYYY-MM-DD");

  const fetchMeals = async () => {
    if (!user) return;
    const dateStr = getTodayString();
    try {
      const res = await fetch(
        `${BASE_URL}/api/user/${user._id}/get_meals?date=${dateStr}`
      );
      const data = await res.json();
      if (res.ok) {
        setUserMeals(data.meals || []);
      } else {
        console.log("Fetch meals error:", data.message);
      }
    } catch (err) {
      console.log("Error fetching meals:", err);
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userString = await AsyncStorage.getItem("user");
        if (token && userString) {
          const parsedUser: User = JSON.parse(userString);
          setIsLogged(true);
          setUser(parsedUser);
        } else {
          setIsLogged(false);
          setUser(null);
        }
      } catch (error) {
        console.log("Error reading storage:", error);
        setIsLogged(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  const register = async (
    email: string,
    fullname: string,
    password: string
  ): Promise<RegisterResponse> => {
    try {
      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullname, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message);
      return { success: true, message: null };
    } catch (error: any) {
      console.log("Register error:", error);
      return { success: false, message: error.message };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      const { token, user: fetchedUser } = data;
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(fetchedUser));
      setIsLogged(true);
      setUser(fetchedUser);
      await fetchMeals();
      return { success: true, token, user: fetchedUser };
    } catch (error: any) {
      console.log("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(["token", "user"]);
      setIsLogged(false);
      setUser(null);
      setUserMeals([]);
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const updateUser = async (updatedUser: User): Promise<void> => {
    try {
      const res = await fetch(`${BASE_URL}/api/user/${updatedUser._id}`);
      const data = await res.json();
      const freshUser = data.user || updatedUser;
      await AsyncStorage.setItem("user", JSON.stringify(freshUser));
      setUser(freshUser);
    } catch (error) {
      console.log("Update user error:", error);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const providerValue: GlobalContextProps = {
    isLogged,
    user,
    loading,
    userMeals,
    fetchMeals,
    register,
    login,
    logout,
    updateUser,
  };

  return (
    <GlobalContext.Provider value={providerValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export default AuthProvider;
