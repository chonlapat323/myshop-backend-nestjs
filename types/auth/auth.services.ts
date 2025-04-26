export interface LoginUserPayload {
  id: number;
  email: string | null;
  role_id: string | null;
}

export interface UserPayload {
  id: number;
  email: string;
  role: string;
}
