import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUserId = useRef(null);

  useEffect(() => {
    const fetchRoleAndSetState = async (sessionUser) => {
      if (!sessionUser) {
        setUser(null);
        setRole(null);
        currentUserId.current = null;
        setLoading(false);
        return;
      }

      try {
        setUser(sessionUser);
        currentUserId.current = sessionUser.id;
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", sessionUser.id)
          .maybeSingle();

        if (error) {
          console.error("[Auth] Роль не знайдено:", error);
        }

        setRole(data?.role || "worker");
      } catch (error) {
        console.error("[Auth] Критична помилка запиту ролі:", error);
        setRole("worker");
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[Auth] Помилка getSession:", error);
        setLoading(false);
        return;
      }
      fetchRoleAndSetState(session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setRole(null);
        currentUserId.current = null;
        setLoading(false);
      } else if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        // Якщо сесія оновлюється для того ж користувача, який вже залогінений,
        // ми НЕ вмикаємо екран завантаження, а просто тихо оновлюємо дані
        if (session?.user?.id === currentUserId.current) {
          setUser(session.user);
        } else {
          setLoading(true);
          fetchRoleAndSetState(session?.user);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setRole(null);
    currentUserId.current = null;
    await supabase.auth.signOut().catch(console.error);
    window.location.href = "/login";
  };

  const value = {
    user,
    role,
    userRole: role,
    loading,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
