import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginWithGitHub: (mock?: boolean) => Promise<boolean>;
  sendEmailCode: (email: string, purpose?: 'register' | 'login') => Promise<{ success: boolean; message?: string; error?: string; devCode?: string }>;
  registerWithEmail: (email: string, code: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (!res.ok) return false;
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[AuthContext] Google Login error:', err);
      return false;
    }
  };

  const loginWithGitHub = async (mock: boolean = true): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/github/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mock }),
      });

      if (!res.ok) return false;
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[AuthContext] GitHub Login error:', err);
      return false;
    }
  };

  const sendEmailCode = async (
    email: string,
    purpose: 'register' | 'login' = 'register'
  ): Promise<{ success: boolean; message?: string; error?: string; devCode?: string }> => {
    try {
      const res = await fetch('/api/auth/email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || '发送验证码失败' };
      }
      return { success: true, message: data.message, devCode: data.devCode };
    } catch {
      return { success: false, error: '网络连接失败，请检查网络设置' };
    }
  };

  const registerWithEmail = async (
    email: string,
    code: string,
    password: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/email/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password, displayName }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || '注册失败' };
      }
      if (data.user) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: '注册未返回有效用户信息' };
    } catch {
      return { success: false, error: '网络连接失败，请稍后重试' };
    }
  };

  const loginWithEmail = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/email/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || '登录失败' };
      }
      if (data.user) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: '登录未返回有效用户信息' };
    } catch {
      return { success: false, error: '网络连接失败，请稍后重试' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithGitHub,
        sendEmailCode,
        registerWithEmail,
        loginWithEmail,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
