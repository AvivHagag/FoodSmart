import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
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
  hasCompleteProfile: boolean;
  fetchMeals: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  register: (
    email: string,
    fullname: string,
    password: string,
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
  hasCompleteProfile: false,
  fetchMeals: async () => {},
  authFetch: (url) => fetch(url),
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
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMeals, setUserMeals] = useState<Meal[]>([]);
  const [hasCompleteProfile, setHasCompleteProfile] = useState(false);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // Auto-logout on 401 (expired / revoked token)
      if (res.status === 401) {
        await _clearSession();
      }

      return res;
    },
    [],
  );

  const _clearSession = async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
    setIsLogged(false);
    setUser(null);
    setUserMeals([]);
  };

  const _persistSession = async (token: string, fetchedUser: User) => {
    await SecureStore.setItemAsync("token", token);
    await SecureStore.setItemAsync("user", JSON.stringify(fetchedUser));
    setIsLogged(true);
    setUser(fetchedUser);
  };

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        const userString = await SecureStore.getItemAsync("user");

        if (!token || !userString) {
          setIsLogged(false);
          setUser(null);
          return;
        }

        const parsedUser: User = JSON.parse(userString);

        // Validate token by fetching the user from the server
        const res = await fetch(`${BASE_URL}/api/user/${parsedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const freshUser = data.user || parsedUser;
          await SecureStore.setItemAsync("user", JSON.stringify(freshUser));
          setIsLogged(true);
          setUser(freshUser);
        } else {
          // Token expired or invalid
          await _clearSession();
        }
      } catch (error) {
        console.log("Error restoring session:", error);
        setIsLogged(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, []);

  useEffect(() => {
    if (user) {
      const isComplete = !!(
        user.bmi &&
        user.tdee &&
        user.age &&
        user.weight &&
        user.height &&
        user.gender &&
        user.activityLevel &&
        user.goal
      );
      setHasCompleteProfile(isComplete);
    } else {
      setHasCompleteProfile(false);
    }
  }, [user]);

  const fetchMeals = async () => {
    if (!user) return;
    const dateStr = moment().tz("Asia/Jerusalem").format("YYYY-MM-DD");
    try {
      const res = await authFetch(
        `${BASE_URL}/api/user/${user._id}/get_meals?date=${dateStr}`,
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

  const register = async (
    email: string,
    fullname: string,
    password: string,
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
      return { success: false, message: error.message };
    }
  };

  const login = async (
    email: string,
    password: string,
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
      await _persistSession(token, fetchedUser);
      // fetchMeals needs user to be set — call after state settles
      setTimeout(fetchMeals, 100);
      return { success: true, token, user: fetchedUser };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async (): Promise<void> => {
    await _clearSession();
  };

  const updateUser = async (updatedUser: User): Promise<void> => {
    try {
      const res = await authFetch(`${BASE_URL}/api/user/${updatedUser._id}`);
      const data = await res.json();
      const freshUser = data.user || updatedUser;
      await SecureStore.setItemAsync("user", JSON.stringify(freshUser));
      setUser(freshUser);
    } catch (error) {
      console.log("Update user error:", error);
      await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        user,
        loading,
        userMeals,
        hasCompleteProfile,
        fetchMeals,
        authFetch,
        register,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default AuthProvider;
