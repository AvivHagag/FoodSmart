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
  token?: string;
  email?: string;
}

interface GlobalContextProps {
  isLogged: boolean;
  user: User | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const GlobalContext = createContext<GlobalContextProps>({
  isLogged: false,
  user: null,
  loading: true,
  register: async () => false,
  login: async () => false,
  logout: async () => {},
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
        if (token) {
          setIsLogged(true);
          setUser({ token });
        }
        console.log("user:", user);
      } catch (error) {
        console.log("Error reading token from storage:", error);
      } finally {
        setLoading(false);
      }
    };
    checkToken();
  }, []);

  const register = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        email,
        password,
      });
      console.log("Register response:", response.data);
      return true;
    } catch (error: any) {
      console.log(
        "Register error:",
        error.response?.data || error.message || error
      );
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log(
      "Attempting login with email:",
      email,
      "and password:",
      password
    );

    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        username: email,
        password,
      });
      const { token } = response.data;
      if (!token) {
        console.log("No token received from server.");
        return false;
      }
      await AsyncStorage.setItem("token", token);
      const storedToken = await AsyncStorage.getItem("token");
      setIsLogged(true);
      setUser({ token: storedToken ? storedToken : "null", email });

      return true;
    } catch (error: any) {
      console.log(
        "Login error:",
        error.response?.data || error.message || error
      );
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem("token");
      setIsLogged(false);
      setUser(null);
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const providerValue: GlobalContextProps = {
    isLogged,
    user,
    loading,
    register,
    login,
    logout,
  };

  return (
    <GlobalContext.Provider value={providerValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export default AuthProvider;
