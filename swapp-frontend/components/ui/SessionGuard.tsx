"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

export default function SessionGuard({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const checkSession = () => {
			const token = Cookies.get("admin_token");

			if (!token) {
				if (pathname !== "/login") {
					router.push("/login");
				}
				return;
			}

			try {
				const decoded: any = jwtDecode(token);
				const currentTime = Date.now() / 1000;

				if (decoded.exp && decoded.exp < currentTime) {
					Cookies.remove("admin_token");
					toast.error("Tu sesión ha expirado por seguridad. Volvé a ingresar.");
					router.push("/login");
				}
			} catch (error) {
				Cookies.remove("admin_token");
				router.push("/login");
			}
		};

		checkSession();

		const interval = setInterval(checkSession, 60000);

		return () => clearInterval(interval);
	}, [pathname, router]);

	return <>{children}</>;
}
