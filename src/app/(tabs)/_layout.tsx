import { Redirect } from "expo-router";

import AppTabs from "@/components/app-tabs";
import { useAuthContext } from "@/lib/auth/auth-context";

export default function TabsLayout() {
	const { currentUser, loading } = useAuthContext();

	if (loading) {
		return null;
	}

	if (!currentUser) {
		return <Redirect href="/signup" />;
	}

	return <AppTabs />;
}
