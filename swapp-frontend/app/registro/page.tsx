"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860";

export default function RegistroPage() {
	const router = useRouter();
	const { login } = useAuth();
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setErrorMsg("");

		try {
			// 1. REGISTRO
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

			// 2. AUTO-LOGIN DESPUÉS DE REGISTRARSE
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

			// Decodificamos el JWT
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
			});

			// ¡Éxito! Redirigimos al usuario a la pantalla principal o dashboard
			router.push("/");
		} catch (err: any) {
			setErrorMsg(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-swapp-navy flex flex-col justify-center items-center p-4">
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
							<label className="text-sm font-medium text-swapp-mint ml-1">
								Nombre
							</label>
							<input
								type="text"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-swapp-mint transition placeholder-gray-600"
								placeholder="Juan"
								required
							/>
						</div>
						<div className="space-y-1.5 w-1/2">
							<label className="text-sm font-medium text-swapp-mint ml-1">
								Apellido
							</label>
							<input
								type="text"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-swapp-mint transition placeholder-gray-600"
								placeholder="Pérez"
								required
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<label className="text-sm font-medium text-swapp-mint ml-1">
							Email de tu equipo
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-swapp-mint transition placeholder-gray-600"
							placeholder="tu@swapp.com.ar"
							required
						/>
					</div>

					<div className="space-y-1.5">
						<label className="text-sm font-medium text-swapp-mint ml-1">
							Contraseña
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-swapp-mint transition placeholder-gray-600"
							placeholder="••••••••"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full mt-4 bg-gradient-to-r from-swapp-teal to-swapp-mint text-swapp-dark font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 disabled:scale-100 text-lg">
						{loading ? "Creando cuenta..." : "Registrarme"}
					</button>
				</form>

				<div className="mt-8 text-center">
					<p className="text-gray-400">
						¿Ya tienes una cuenta?{" "}
						<Link
							href="/login"
							className="text-swapp-mint font-semibold hover:underline">
							Inicia sesión aquí
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
