import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "@/constants/constants";

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
  user?: any;
}

interface GlobalContextProps {
  isLogged: boolean;
  user: User | null;
  loading: boolean;
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
  register: async (email: string, fullname: string, password: string) => {
    return { success: false, message: "Default implementation" };
  },
  login: async (email: string, password: string) => {
    return {
      success: false,
      error: "Default login implementation",
      token: undefined,
      user: undefined,
    };
  },
  logout: async () => {},
  updateUser: async (updatedUser: User) => {},
});

export const useGlobalContext = () => useContext(GlobalContext);

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const email = await AsyncStorage.getItem("email");
        const userString = await AsyncStorage.getItem("user");
        if (token && email && userString) {
          const parsedUser = JSON.parse(userString);
          setIsLogged(true);
          setUser({
            ...parsedUser,
          });
        } else {
          setIsLogged(false);
          setUser(null);
        }
      } catch (error) {
        console.log("Error reading data from storage:", error);
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
      const response = await axios.post(`${BASE_URL}/register`, {
        email,
        fullname,
        password,
      });
      console.log("Register response:", response.data);
      return { success: true, message: null };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred";
      console.log("Register error:", errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        email: email,
        password,
      });
      const { token, user } = response.data;
      if (!token || !user) {
        console.log(
          "Invalid response from server. Missing token or user data."
        );
        return { success: false, error: "Invalid response from server." };
      }
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("email", email);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setIsLogged(true);
      setUser({
        email,
        ...user,
      });
      return { success: true, token, user };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred.";
      console.log("Login error:", errorMessage);

      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("email");
      await AsyncStorage.removeItem("user");
      setIsLogged(false);
      setUser(null);
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const updateUser = async (updatedUser: User): Promise<void> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/user/${updatedUser._id}`
      );
      if (response.data && response.data.user) {
        const freshUserData = response.data.user;
        await AsyncStorage.setItem("user", JSON.stringify(freshUserData));
        setUser(freshUserData);
      } else {
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
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
