import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Функція для отримання ролі з БД
    const fetchProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (error) throw error;
        return data?.role || "worker";
      } catch (error) {
        console.error("[Auth] Помилка завантаження ролі:", error.message);
        return "worker"; // Безпечний fallback
      }
    };

    // 2. Єдина функція обробки сесії (щоб уникнути дублювання)
    const handleSession = async (session) => {
      if (session?.user) {
        const role = await fetchProfile(session.user.id);
        if (isMounted) {
          setUser(session.user);
          setUserRole(role);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setUserRole(null);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    // 3. Зчитуємо поточну сесію при старті
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error("[Auth] Помилка отримання сесії:", error);
      handleSession(session);
    });

    // 4. Підписуємось на зміни (логін, логаут, оновлення токена)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Ігноруємо INITIAL_SESSION, бо ми вже обробили його через getSession() вище
      if (event === "INITIAL_SESSION") return;
      handleSession(session);
    });

    // Очищення при розмонтуванні
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true); // Показуємо завантаження під час виходу
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
