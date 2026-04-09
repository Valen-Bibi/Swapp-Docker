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
	isFirstTimeUser: boolean; // <-- NUEVO: Estado para saber si es la primera vez
	completeTutorial: () => void; // <-- NUEVO: Función para marcar el tutorial como visto
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [user, setUser] = useState<any | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isFirstTimeUser, setIsFirstTimeUser] = useState(true); // Asumimos que sí hasta revisar

	useEffect(() => {
		const storedToken = localStorage.getItem("swapp_token");
		const storedUser = localStorage.getItem("swapp_user");
		const seenTutorial = localStorage.getItem("swapp_seen_tutorial"); // Buscamos la bandera

		if (storedToken && storedUser) {
			setToken(storedToken);
			setUser(JSON.parse(storedUser));
		}

		if (seenTutorial === "true") {
			setIsFirstTimeUser(false); // Ya lo vio, no es su primera vez
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

	// Función para llamar cuando el usuario omite el tutorial o lo termina
	const completeTutorial = () => {
		localStorage.setItem("swapp_seen_tutorial", "true");
		setIsFirstTimeUser(false);
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
				isFirstTimeUser, // <-- Lo pasamos al provider
				completeTutorial, // <-- Lo pasamos al provider
			}}>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => useContext(AuthContext);
