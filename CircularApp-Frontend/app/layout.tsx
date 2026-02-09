import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Bucle App",
	description: "Logística Inversa Inteligente",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="es">
			<body className={inter.className}>
				<AuthProvider>
					{/* 👇 2. AQUÍ LO PONEMOS: */}
					<Navbar />

					{children}
				</AuthProvider>
			</body>
		</html>
	);
}
