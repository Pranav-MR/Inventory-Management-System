export interface User {
  id: string;
  email: string;
  name: string | null;
  timezone: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
