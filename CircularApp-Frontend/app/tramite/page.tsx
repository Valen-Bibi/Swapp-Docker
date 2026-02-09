"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// 👇 IMPORTANTE: Ruta corregida apuntando desde la raíz del proyecto
import { useAuth } from "@/app/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:7860";

function TramiteContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { login, user, token, isAuthenticated } = useAuth();

	const productScan = searchParams.get("scan") || "Producto Desconocido";
	const confidence = searchParams.get("conf") || "0";

	const [isRegistering, setIsRegistering] = useState(false);
	const [usuarioForm, setUsuarioForm] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	const base64ToBlob = async (base64: string) => {
		const res = await fetch(base64);
		const blob = await res.blob();
		return blob;
	};

	const handleSaveScan = async () => {
		if (!isAuthenticated || !token || !user) {
			alert("Sesión expirada.");
			return;
		}

		setLoading(true);
		try {
			const formData = new FormData();
			formData.append("producto", productScan);
			formData.append("confianza", confidence);
			formData.append("usuario_id", user.id);

			const storedImage = localStorage.getItem("tempScanImage");
			if (storedImage) {
				const blob = await base64ToBlob(storedImage);
				formData.append("archivo", blob, "captura.jpg");
			}

			const res = await fetch(`${API_URL}/registrar-escaneo`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			});

			if (!res.ok) throw new Error("Error al guardar");

			const data = await res.json();
			localStorage.removeItem("tempScanImage");

			alert(`¡Recibido! Estado: ${data.estado}`);
			router.push("/");
		} catch (error) {
			console.error(error);
			alert("Error al enviar.");
		} finally {
			setLoading(false);
		}
	};

	const handleAuthSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			if (isRegistering) {
				const res = await fetch(`${API_URL}/register`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						usuario: usuarioForm,
						email,
						password,
						rol: "cliente",
					}),
				});
				if (!res.ok) {
					const err = await res.json();
					throw new Error(err.detail || "Error en registro");
				}
			}

			const formData = new URLSearchParams();
			formData.append("username", email);
			formData.append("password", password);

			const resToken = await fetch(`${API_URL}/token`, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: formData,
			});

			if (!resToken.ok) throw new Error("Credenciales inválidas");
			const dataToken = await resToken.json();

			login(dataToken.access_token);
		} catch (error: any) {
			alert(error.message);
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isAuthenticated) setLoading(false);
	}, [isAuthenticated]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 transition-all">
				<div className="text-center mb-6">
					<h2 className="text-2xl font-bold text-gray-800">
						{isAuthenticated
							? `Hola, ${user?.sub?.split("@")[0]} 👋`
							: "Identifícate"}
					</h2>
					<p className="text-gray-500 text-sm">
						Vas a devolver:{" "}
						<strong className="text-green-600">{productScan}</strong>
					</p>
				</div>

				{isAuthenticated ? (
					<div className="space-y-4">
						<button
							onClick={handleSaveScan}
							disabled={loading}
							className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 shadow-lg">
							{loading ? "Enviando..." : "🚀 Confirmar Envío"}
						</button>
						<button
							onClick={() => router.push("/")}
							className="w-full text-gray-400 text-sm mt-4">
							Cancelar
						</button>
					</div>
				) : (
					<form onSubmit={handleAuthSubmit} className="space-y-4">
						{isRegistering && (
							<input
								type="text"
								placeholder="Usuario"
								value={usuarioForm}
								onChange={(e) => setUsuarioForm(e.target.value)}
								className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl"
								required
							/>
						)}
						<input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl"
							required
						/>
						<input
							type="password"
							placeholder="Contraseña"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl"
							required
						/>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-black">
							{loading
								? "Cargando..."
								: isRegistering
									? "Crear Cuenta"
									: "Ingresar"}
						</button>
						<div className="mt-4 text-center">
							<button
								type="button"
								onClick={() => setIsRegistering(!isRegistering)}
								className="text-sm text-gray-500 hover:text-green-600">
								{isRegistering ? "Ya tengo cuenta" : "Crear cuenta nueva"}
							</button>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}

export default function TramitePage() {
	return (
		<Suspense fallback={<div>Cargando...</div>}>
			<TramiteContent />
		</Suspense>
	);
}
