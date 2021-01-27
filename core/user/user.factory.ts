import { iUser } from './iUser'

export class UserFactory {

  private static _instance: UserFactory;

  static getInstance(): UserFactory {
    this._instance = this._instance || new UserFactory();
    return this._instance;
  }

  constructor() {

  }

  mapFromDb(item: any): iUser {
    return {
      id: item.id,
      email: item.email,
      nickname: item.nickname,
      country: item.country,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }
  }

  mapFromDbColl(items: any[]): iUser[] {
    return items.map(i => this.mapFromDb(i));
  }
}