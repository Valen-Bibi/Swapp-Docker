"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { api } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
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

			if (err.message === "Network Error") {
				setError("Error de red: El panel no puede comunicarse con la API.");
			} else {
				setError(
					err.response?.data?.detail || "Problema de conexión con el servidor.",
				);
			}
			setIsLoading(false);
		}
	};

	return (
		<div className="flex h-screen items-center justify-center bg-swapp-azul-petroleo">
			<form
				onSubmit={handleLogin}
				className="w-full max-w-md rounded-xl bg-swapp-blanco/10 p-8 shadow-2xl backdrop-blur-md border-t-4 border-t-swapp-verde-oscuro">
				<h2 className="mb-6 text-2xl font-bold text-center text-swapp-blanco">
					Swapp Admin Access
				</h2>

				{error && (
					<div className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-200 border border-red-500/50 flex items-center gap-2 animate-in fade-in">
						{error}
					</div>
				)}

				<div className="space-y-4 mb-6">
					<input
						type="email"
						placeholder="Correo electrónico"
						className="w-full rounded-lg border border-swapp-blanco/20 bg-swapp-blanco/5 p-3 text-swapp-blanco placeholder-swapp-tiza-verdoso/50 focus:border-swapp-verde-menta focus:outline-none focus:ring-1 focus:ring-swapp-verde-menta disabled:opacity-50 transition-colors"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						disabled={isLoading}
					/>

					{/* CONTENEDOR RELATIVO PARA LA CONTRASEÑA */}
					<div className="relative">
						<input
							type={showPassword ? "text" : "password"}
							placeholder="Contraseña"
							className="w-full rounded-lg border border-swapp-blanco/20 bg-swapp-blanco/5 p-3 pr-10 text-swapp-blanco placeholder-swapp-tiza-verdoso/50 focus:border-swapp-verde-menta focus:outline-none focus:ring-1 focus:ring-swapp-verde-menta disabled:opacity-50 transition-colors"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							disabled={isLoading}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							disabled={isLoading}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-swapp-tiza-verdoso/50 hover:text-swapp-blanco transition-colors disabled:opacity-50"
							aria-label={
								showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
							}>
							{showPassword ? (
								<EyeOff className="h-5 w-5" />
							) : (
								<Eye className="h-5 w-5" />
							)}
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className="w-full rounded-lg bg-swapp-verde-pastel p-3 font-semibold text-swapp-blanco transition-colors hover:bg-swapp-verde-oscuro focus:outline-none focus:ring-2 focus:ring-swapp-verde-menta focus:ring-offset-2 focus:ring-offset-swapp-azul-petroleo disabled:bg-swapp-verde-oscuro/50 disabled:cursor-not-allowed flex justify-center items-center">
					{isLoading ? (
						<>
							<svg
								className="animate-spin -ml-1 mr-3 h-5 w-5 text-swapp-blanco"
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
