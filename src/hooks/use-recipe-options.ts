import { useEffect, useState } from "react";

import { fetchCuisines, fetchDietaryRestrictions } from "@/services/api/recipe-options";

type RecipeOption = { id: number; name: string };

export function useRecipeOptions() {
	const [dietaryOptions, setDietaryOptions] = useState<RecipeOption[]>([]);
	const [cuisineOptions, setCuisineOptions] = useState<RecipeOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		Promise.allSettled([fetchDietaryRestrictions(), fetchCuisines()]).then(
			([restrictions, cuisines]) => {
				const failures = [restrictions, cuisines]
					.filter((result): result is PromiseRejectedResult => result.status === "rejected")
					.map((result) => result.reason instanceof Error ? result.reason.message : "Unable to load recipe options.");
				if (restrictions.status === "fulfilled")
					setDietaryOptions(restrictions.value);
				if (cuisines.status === "fulfilled")
					setCuisineOptions(cuisines.value);
				setError(failures.length ? failures.join(" ") : null);
				setLoading(false);
			},
		);
	}, []);

	return { dietaryOptions, cuisineOptions, loading, error };
}
