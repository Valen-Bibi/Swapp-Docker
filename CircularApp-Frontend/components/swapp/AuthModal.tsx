"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

// URL de tu Backend (ajústalo si es necesario)
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

interface AuthModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void; // Qué hacer cuando se loguea (ej: guardar el escaneo)
}

export default function AuthModal({
	isOpen,
	onClose,
	onSuccess,
}: AuthModalProps) {
	const { login } = useAuth();
	const [isRegistering, setIsRegistering] = useState(false);
	const [loading, setLoading] = useState(false);

	// Datos del formulario
	const [usuario, setUsuario] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errorMsg, setErrorMsg] = useState("");

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setErrorMsg("");

		try {
			// 1. REGISTRO (Si aplica)
			if (isRegistering) {
				const resReg = await fetch(`${API_URL}/register`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ usuario, email, password, rol: "cliente" }),
				});

				if (!resReg.ok) {
					const data = await resReg.json();
					throw new Error(data.detail || "Error al registrarse");
				}
			}

			// 2. LOGIN (Obtener Token)
			const formData = new URLSearchParams();
			formData.append("username", email);
			formData.append("password", password);

			const resToken = await fetch(`${API_URL}/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: formData,
			});

			if (!resToken.ok) throw new Error("Credenciales incorrectas");

			const dataToken = await resToken.json();

			// Decodificamos el usuario del token o usamos los datos locales
			// (Aquí simplificamos guardando el email/rol localmente)
			login(dataToken.access_token, {
				email,
				rol: "cliente",
				id: dataToken.id,
			}); // Asegúrate que tu backend devuelva ID o lo sacamos del token

			onSuccess(); // ¡Éxito! Cerramos y seguimos
		} catch (err: any) {
			setErrorMsg(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
			{/* Fondo oscuro borroso */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Tarjeta del Formulario */}
			<div className="relative w-full max-w-sm bg-swapp-navy border border-white/10 p-8 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slideUp">
				{/* Encabezado */}
				<div className="text-center mb-6">
					<h2 className="text-2xl font-bold text-white">
						{isRegistering ? "Crear Cuenta" : "Bienvenido"}
					</h2>
					<p className="text-gray-400 text-sm mt-1">
						{isRegistering
							? "Únete a Swapp para reciclar"
							: "Inicia sesión para guardar tu escaneo"}
					</p>
				</div>

				{/* Mensaje de Error */}
				{errorMsg && (
					<div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-xs text-center">
						{errorMsg}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					{isRegistering && (
						<div className="space-y-1">
							<label className="text-xs text-swapp-mint ml-1">Usuario</label>
							<input
								type="text"
								placeholder="Ej: ArmandoParedes"
								value={usuario}
								onChange={(e) => setUsuario(e.target.value)}
								className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-swapp-mint transition placeholder-gray-600"
								required
							/>
						</div>
					)}

					<div className="space-y-1">
						<label className="text-xs text-swapp-mint ml-1">Email</label>
						<input
							type="email"
							placeholder="tucorreo@email.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-swapp-mint transition placeholder-gray-600"
							required
						/>
					</div>

					<div className="space-y-1">
						<label className="text-xs text-swapp-mint ml-1">Contraseña</label>
						<input
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-swapp-mint transition placeholder-gray-600"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full mt-4 bg-gradient-to-r from-swapp-teal to-swapp-mint text-swapp-dark font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 disabled:scale-100">
						{loading
							? "Procesando..."
							: isRegistering
								? "Registrarme"
								: "Entrar"}
					</button>
				</form>

				{/* Toggle Login/Register */}
				<div className="mt-6 text-center">
					<p className="text-sm text-gray-400">
						{isRegistering ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}
						<button
							onClick={() => {
								setErrorMsg("");
								setIsRegistering(!isRegistering);
							}}
							className="ml-2 text-swapp-mint font-medium hover:underline focus:outline-none">
							{isRegistering ? "Ingresar" : "Regístrate"}
						</button>
					</p>
				</div>

				{/* Botón cerrar */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-500 hover:text-white">
					<svg
						className="w-6 h-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}
