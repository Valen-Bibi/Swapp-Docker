"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { api } from "@/lib/api";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false); // NUEVO: Estado de carga
	const router = useRouter();

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);

		console.log("1. Iniciando petición de login a la API...");

		try {
			const formData = new URLSearchParams();
			formData.append("username", email);
			formData.append("password", password);

			const response = await api.post("/api/auth/staff/login", formData, {
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
			});

			console.log("2. Respuesta HTTP recibida:", response.status);

			const data = response.data;
			const decoded: any = jwtDecode(data.access_token);
			console.log("3. Token decodificado correctamente:", decoded);

			if (decoded.user_type !== "staff") {
				setError("Acceso denegado. Se requieren privilegios de administrador.");
				setIsLoading(false);
				return;
			}

			Cookies.set("admin_token", data.access_token, { expires: 1 });
			console.log("4. Cookie seteada. Ejecutando router.push('/dashboard')...");

			router.push("/dashboard");
		} catch (err: any) {
			console.error("❌ Error capturado en login:", err);

			// Detecta si es un error de infraestructura (ej. CORS o Servidor caído)
			if (err.message === "Network Error") {
				setError("Error de red: El panel no puede comunicarse con la API.");
			} else {
				setError(
					err.response?.data?.detail || "Problema de conexión con el servidor.",
				);
			}
			setIsLoading(false); // Solo cortamos la carga si hay un error
		}
	};

	return (
		<div className="flex h-screen items-center justify-center bg-[#172638]">
			<form
				onSubmit={handleLogin}
				className="w-full max-w-md rounded-xl bg-white/10 p-8 shadow-2xl backdrop-blur-md">
				<h2 className="mb-6 text-2xl font-bold text-center text-white">
					Swapp Admin Accesssss
				</h2>

				{error && (
					<div className="mb-4 rounded bg-red-500/20 p-3 text-sm text-red-200 border border-red-500/50">
						{error}
					</div>
				)}

				<input
					type="email"
					placeholder="Correo electrónico"
					className="mb-4 w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					disabled={isLoading}
				/>
				<input
					type="password"
					placeholder="Contraseña"
					className="mb-6 w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					disabled={isLoading}
				/>

				<button
					type="submit"
					disabled={isLoading}
					className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#172638] disabled:bg-blue-800 disabled:cursor-not-allowed flex justify-center items-center">
					{isLoading ? (
						<>
							<svg
								className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24">
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Ingresando...
						</>
					) : (
						"Ingresar al Panel"
					)}
				</button>
			</form>
		</div>
	);
}
