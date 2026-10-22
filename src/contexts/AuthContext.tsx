import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import { KEY_AUTH } from "@/constants/constants";
import type { User } from "@/services/user-service";
import {
  deleteValueFromStorage,
  getValueFromLocalStorage,
  setValueToLocalStorage,
} from "@/utils/storage";
import userService from "@/services/user-service";
import authService from "@/services/auth-service";

interface AuthState {
  user: User | null;
  loading: boolean;
  is_authenticated: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "AUTH_START" }
  | {
      type: "AUTH_SUCCESS";
      payload: { user: User };
    }
  | { type: "AUTH_FAILURE"; error?: string | null }
  | { type: "AUTH_COMPLETED" }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: User }
  | { type: "AUTH_TOKEN"; token: string };

interface AuthContextType {
  state: AuthState;
  login: (_username: string, _password: string) => Promise<void>;
  logout: () => void;
  updateUser: (_user: User) => void;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  is_authenticated: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, loading: true };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        loading: false,
        is_authenticated: true,
      };
    case "AUTH_TOKEN":
      return {
        ...state,
        loading: false,
        is_authenticated: true,
      };
    case "AUTH_FAILURE":
      return {
        user: null,
        loading: false,
        is_authenticated: false,
        error: action?.error ?? null,
      };
    case "LOGOUT":
      return {
        ...initialState,
        loading: false,
      };
    case "AUTH_COMPLETED":
      return {
        ...state,
        loading: false,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const logout = async (): Promise<void> => {
    deleteValueFromStorage(KEY_AUTH.TOKEN);
    dispatch({ type: "LOGOUT" });
    location.reload();
  };

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getValueFromLocalStorage(KEY_AUTH.TOKEN);
        if (token) {
          dispatch({ type: "AUTH_START" });
          const user = await userService.getMe();
          dispatch({ type: "AUTH_SUCCESS", payload: { user } });
        } else {
          dispatch({ type: "AUTH_COMPLETED" });
        }
      } catch (error: unknown) {
        dispatch({
          type: "AUTH_FAILURE",
          error: error instanceof Error ? error.message : "Xác thực thất bại",
        });
        await logout();
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      dispatch({ type: "AUTH_START" });
      const res = await authService.login({ username, password });
      setValueToLocalStorage(KEY_AUTH.TOKEN, res.token);
      dispatch({ type: "AUTH_COMPLETED" });
      location.href = "/";
    } catch (error) {
      dispatch({ type: "AUTH_FAILURE" });
      throw error;
    }
  };

  const value: AuthContextType = {
    state,
    login,
    logout,
    updateUser: (user) => dispatch({ type: "UPDATE_USER", payload: user }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
