import { supabase } from "../../lib/supabase";

export async function fetchDietaryRestrictions() {
  const { data, error } = await supabase
    .from('dietary_restrictions')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchCuisines() {
  const { data, error } = await supabase
    .from('cuisines')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}