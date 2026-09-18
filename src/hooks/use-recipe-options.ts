import { useEffect, useState } from "react";

import { fetchCuisines, fetchDietaryRestrictions } from "@/services/api";

type RecipeOption = { id: number; name: string };

export function useRecipeOptions() {
	const [dietaryOptions, setDietaryOptions] = useState<RecipeOption[]>([]);
	const [cuisineOptions, setCuisineOptions] = useState<RecipeOption[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.allSettled([fetchDietaryRestrictions(), fetchCuisines()]).then(
			([restrictions, cuisines]) => {
				if (restrictions.status === "fulfilled")
					setDietaryOptions(restrictions.value);
				if (cuisines.status === "fulfilled")
					setCuisineOptions(cuisines.value);
				setLoading(false);
			},
		);
	}, []);

	return { dietaryOptions, cuisineOptions, loading };
}
