import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { adminFetch, getToken, setToken } from "../adminApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  // Si hay token guardado, arrancamos "verificando" hasta saber si sigue válido
  const [checking, setChecking] = useState(() => !!getToken());

  useEffect(() => {
    if (!getToken()) return;

    adminFetch("/api/auth/me")
      .then((data) => setAdmin(data.admin))
      .catch((e) => {
        // Solo borramos el token si el servidor dice que no sirve más
        if (e.status === 401) setToken(null);
      })
      .finally(() => setChecking(false));
  }, []);

  const login = async (email, password) => {
    const data = await adminFetch("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(data.token);
    setAdmin(data.admin);
  };

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
