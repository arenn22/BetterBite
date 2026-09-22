export interface PendingFriendRequest {
  id: number;
  sender_username?: string;
  username?: string;
  display_name?: string;
  sender_id?: string;
}

export interface Post {
  id: string;
  profile_id: string;
  date_created: Date | string;
  views: number;
  likes: number;
  title: string;
  description: string;
  difficulty: number;
  image_url: string;
  author_username: string;
  author_pfp_url?: string | null;
  recipe: Record<string, any>;
  restrictionIds: number[];
  cuisineIds: number[];
}

export interface CreatePostPayload {
  title: string;
  description: string;
  difficulty: number;
  imageUrl: string;
  authorUsername: string;
  recipeJson: Record<string, any>; // For your jsonb recipe data structure
  restrictionIds: number[];       // Array of IDs for post_restrictions
  cuisineIds: number[];           // Array of IDs for post_cuisines
}
// Type definitions matching your Postgres schema fields

/**
 * Creates a recipe post along with its junction table attachments (cuisines & dietary restrictions)
 * in a single atomic database operation.
 * 
 * @param payload The clean post data from your application state
 * @returns The newly created post UUID string
 */

export interface PostReview {
  id: string;
  created_at: Date | string;
  postS_id: string;
  profile_id: string;
  rating: number;
  description: string;
}

export interface CookedPost {
  id: string;
  created_at: Date | string;
  post_id: string;
  profile_id: string;
  image_url: string;
}