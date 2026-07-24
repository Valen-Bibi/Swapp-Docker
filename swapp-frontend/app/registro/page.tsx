"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import BackButton from "@/components/swapp/BackButton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

export default function RegistroPage() {
	const router = useRouter();
	const { login } = useAuth();
	const [loading, setLoading] = useState(false);
	const [loadingText, setLoadingText] = useState("Registrarme"); // <-- Estado dinámico para el botón
	const [errorMsg, setErrorMsg] = useState("");

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setLoadingText("Creando cuenta...");
		setErrorMsg("");

		try {
			const resReg = await fetch(`${API_URL}/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					first_name: firstName,
					last_name: lastName,
					email,
					password,
					role: "user",
				}),
			});

			if (!resReg.ok) {
				const data = await resReg.json();
				throw new Error(data.detail || "Error al registrarse");
			}

			setLoadingText("Iniciando sesión...");

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

			const payloadBase64 = dataToken.access_token.split(".")[1];
			const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
			const jsonPayload = decodeURIComponent(
				window
					.atob(base64)
					.split("")
					.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
					.join(""),
			);
			const decodedPayload = JSON.parse(jsonPayload);

			login(dataToken.access_token, {
				email: email,
				rol: decodedPayload.rol || "user",
				id: decodedPayload.id,
				first_name: firstName,
				last_name: lastName,
			});

			// --- EL PUENTE DEL ESCÁNER ---
			// Si hay un escaneo pendiente, cambiamos el texto para darle feedback al usuario
			if (localStorage.getItem("swapp_escaneo_pendiente")) {
				setLoadingText("Recuperando tu producto...");
				// Un mini delay opcional para que el usuario llegue a leer el mensaje (mejora la UX)
				await new Promise((resolve) => setTimeout(resolve, 800));
			}

			// Redirigimos siempre al HUB, donde el MainScannerApp atajará el escaneo y abrirá las opciones
			router.push("/hub");
		} catch (err: any) {
			setErrorMsg(err.message);
			setLoadingText("Registrarme");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-swapp-azul-petroleo flex flex-col justify-center items-center p-4">
			<BackButton className="absolute top-6 left-6" />
			<div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h1>
					<p className="text-gray-400">Únete al equipo y empieza a reciclar</p>
				</div>

				{errorMsg && (
					<div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
						{errorMsg}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-5">
					<div className="flex gap-4">
						<div className="space-y-1.5 w-1/2">
							<label className="text-sm font-medium text-swapp-verde-agua ml-1">
								Nombre
							</label>
							<input
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-swapp-verde-agua transition placeholder-gray-600"
								placeholder="Juan"
								required
							/>
						</div>
						<div className="space-y-1.5 w-1/2">
							<label className="text-sm font-medium text-swapp-verde-agua ml-1">
								Apellido
							</label>
							<input
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-swapp-verde-agua transition placeholder-gray-600"
								placeholder="Pérez"
								required
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<label className="text-sm font-medium text-swapp-verde-agua ml-1">
							Email de tu equipo
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-swapp-verde-agua transition placeholder-gray-600"
							placeholder="tu@swapp.com.ar"
							required
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-sm font-medium text-swapp-verde-agua ml-1">
							Contraseña
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-swapp-verde-agua transition placeholder-gray-600"
							placeholder="••••••••"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full mt-4 bg-gradient-to-r from-swapp-turquesa-oscuro to-swapp-verde-agua text-swapp-negro-azulado font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 disabled:scale-100 text-lg">
						{loadingText}
					</button>
				</form>

				<div className="mt-8 text-center">
					<p className="text-gray-400">
						¿Ya tienes una cuenta?{" "}
						<Link
							href="/login"
							className="text-swapp-verde-agua font-semibold hover:underline">
							Inicia sesión aquí
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
