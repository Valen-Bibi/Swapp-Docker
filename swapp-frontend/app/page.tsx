"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TutorialView from "@/components/swapp/TutorialView";

export default function LandingPage() {
	const { isAuthenticated } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isAuthenticated) {
			router.push("/hub");
		}
	}, [isAuthenticated, router]);

	if (isAuthenticated) return null;

	return <TutorialView onRegisterClick={() => router.push("/registro")} />;
}
