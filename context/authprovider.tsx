import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import moment from "moment";
import { APIError, setUnauthorizedHandler } from "@/api/client";
import { loginUser, registerUser } from "@/api/authApi";
import { getMealsByDate } from "@/api/mealsApi";
import { getCurrentUser } from "@/api/userApi";
import type { MealDay, User } from "@/api/types";

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

type Meal = MealDay;

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
    setUnauthorizedHandler(() => {
      _clearSession();
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

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
        if (!token) {
          await _clearSession();
          return;
        }

        const freshUser = await getCurrentUser();
        await SecureStore.setItemAsync("user", JSON.stringify(freshUser));
        setIsLogged(true);
        setUser(freshUser || parsedUser);
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

  const loadTodayMeals = async () => {
    const dateStr = moment().tz("Asia/Jerusalem").format("YYYY-MM-DD");
    const data = await getMealsByDate(dateStr);
    setUserMeals(data.mealDay ? [data.mealDay] : []);
  };

  const fetchMeals = async () => {
    if (!user) return;
    try {
      await loadTodayMeals();
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
      await registerUser(email, fullname, password);
      return { success: true, message: null };
    } catch (error: unknown) {
      const message =
        error instanceof APIError ? error.message : "Registration failed";
      return { success: false, message };
    }
  };

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResponse> => {
    try {
      const { token, user: fetchedUser } = await loginUser(email, password);
      await _persistSession(token, fetchedUser);
      await loadTodayMeals();
      return { success: true, token, user: fetchedUser };
    } catch (error: unknown) {
      const message = error instanceof APIError ? error.message : "Login failed";
      return { success: false, error: message };
    }
  };

  const logout = async (): Promise<void> => {
    await _clearSession();
  };

  const updateUser = async (updatedUser: User): Promise<void> => {
    try {
      const freshUser = await getCurrentUser();
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
