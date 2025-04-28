export interface LoginUserPayload {
  id: number;
  email: string | null;
  role_id: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface UserPayload {
  id: number;
  email: string;
  role: string;
}
