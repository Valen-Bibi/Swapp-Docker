"use client";
import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";

interface AuthContextType {
	token: string | null;
	user: any | null;
	login: (token: string, userData: any) => void;
	logout: () => void;
	isAuthenticated: boolean;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [user, setUser] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const storedToken = localStorage.getItem("swapp_token");
		const storedUser = localStorage.getItem("swapp_user");

		if (storedToken && storedUser) {
			setToken(storedToken);
			setUser(JSON.parse(storedUser));
		}

		setIsLoading(false);
	}, []);

	const login = (newToken: string, userData: any) => {
		localStorage.setItem("swapp_token", newToken);
		localStorage.setItem("swapp_user", JSON.stringify(userData));
		setToken(newToken);
		setUser(userData);
	};

	const logout = () => {
		localStorage.removeItem("swapp_token");
		localStorage.removeItem("swapp_user");
		setToken(null);
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{
				token,
				user,
				login,
				logout,
				isAuthenticated: !!token,
				isLoading,
			}}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
