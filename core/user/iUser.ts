export interface iUser {
  id: number;
  email: string;
  nickname: string;
  country: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}