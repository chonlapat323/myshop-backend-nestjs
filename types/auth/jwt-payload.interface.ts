export interface JwtPayload {
  userId: number;
  email: string;
  role_id: string;
  name?: string;
  image_url?: string;
}
