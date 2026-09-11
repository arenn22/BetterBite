import { Redirect } from "expo-router";

import { useAuthContext } from "@/lib/auth/auth-context";

export default function Index() {
	const { currentUser } = useAuthContext();

	if (currentUser) {
		return <Redirect href="/home" />;
	}

	return <Redirect href="/login" />;
}
