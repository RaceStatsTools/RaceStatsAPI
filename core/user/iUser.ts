export interface iUser {
  id: number;
  email: string;
  nickname: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}