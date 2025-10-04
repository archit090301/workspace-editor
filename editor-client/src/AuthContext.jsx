import { createContext, useContext, useState, useEffect } from "react";
import api from "./api";
import { socket } from "./socket"; // 🆕 Import socket instance

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Check session when app loads
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/me");
        if (res.data.authenticated) {
          setUser(res.data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // 🆕 Whenever user logs in / registers / loads, register socket
  useEffect(() => {
    if (user?.user_id && user?.username) {
      socket.emit("auth:register", {
        userId: user.user_id,
        username: user.username,
      });
      console.log(`🔗 Registered socket for ${user.username}`);
    }
  }, [user]);

  // 🔹 Login
  const login = async (email, password) => {
    const res = await api.post("/login", { email, password });
    setUser(res.data.user);
    return res.data;
  };

  // 🔹 Register
  const register = async (username, email, password) => {
    const res = await api.post("/register", { username, email, password });
    setUser(res.data.user);
    return res.data;
  };

  // 🔹 Logout
  const logout = async () => {
    await api.post("/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
