// import React, { createContext, useState, useContext } from "react";
// import * as SecureStore from "expo-secure-store";
// import axios from "axios";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const login = async (username, password) => {
//     try {
//       setLoading(true);
//       const response = await axios.post("http://<your-backend-url>/login", {
//         username,
//         password,
//       });
//       const { token } = response.data;

//       await SecureStore.setItemAsync("token", token);
//       setUser({ username });
//     } catch (error) {
//       console.error("Login error:", error.response?.data || error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const register = async (username, password) => {
//     try {
//       setLoading(true);
//       await axios.post("http://<your-backend-url>/register", {
//         username,
//         password,
//       });
//     } catch (error) {
//       console.error("Register error:", error.response?.data || error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = async () => {
//     await SecureStore.deleteItemAsync("token");
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, login, register, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);
