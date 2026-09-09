import { useRouter } from "expo-router";
import { useState } from "react";

export default function useAuth() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

}