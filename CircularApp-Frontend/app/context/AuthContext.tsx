"use client";

import React from "react";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

interface UserPayload {
	sub: string; // email
	id: string;
	rol: string;
	exp: number;
}

interface AuthContextType {
	user: UserPayload | null;
	token: string | null;
	login: (token: string) => void;
	logout: () => void;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<UserPayload | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const router = useRouter();

	useEffect(() => {
		const storedToken = localStorage.getItem("circular_token");
		if (storedToken) {
			try {
				const decoded = jwtDecode<UserPayload>(storedToken);
				// Verificar si expiró
				if (decoded.exp * 1000 < Date.now()) {
					logout();
				} else {
					setToken(storedToken);
					setUser(decoded);
				}
			} catch (error) {
				logout();
			}
		}
	}, []);

	const login = (newToken: string) => {
		localStorage.setItem("circular_token", newToken); // 👇 AQUÍ TAMBIÉN
		const decoded = jwtDecode<UserPayload>(newToken);
		setToken(newToken);
		setUser(decoded);
	};

	const logout = () => {
		localStorage.removeItem("circular_token"); // 👇 Y AQUÍ
		setToken(null);
		setUser(null);
		router.push("/");
	};

	return (
		<AuthContext.Provider
			value={{ user, token, login, logout, isAuthenticated: !!user }}>
			{children}
		</AuthContext.Provider>
	);
}

// Hook personalizado para usarlo fácil
export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth debe usarse dentro de un AuthProvider");
	}
	return context;
}
