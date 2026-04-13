import { createContext, useContext, useState, type ReactNode } from 'react';
import { auth, type LocalUser, type AppRole } from '@/lib/store';

interface AuthState {
  user: LocalUser | null;
  role: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => { error: string | null };
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(() => auth.getSession());

  const signIn = async (email: string, password: string) => {
    const { user: u, error } = auth.signIn(email, password);
    if (u) setUser(u);
    return { error: error ? new Error(error) : null };
  };

  const signOut = async () => {
    auth.signOut();
    setUser(null);
  };

  const changePassword = (newPassword: string) => {
    if (!user) return { error: 'Not authenticated' };
    return auth.changePassword(user.id, newPassword);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role ?? null,
      isLoading: false,
      isAuthenticated: !!user,
      signIn,
      signOut,
      changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
