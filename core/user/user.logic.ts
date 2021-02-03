import { UserRepo } from "./user.repo";
import { HttpResponse } from "../../utils/httpResponse";
import { iUser } from "./iUser";
import * as crypto from 'crypto';

export class UserLogic {
  private static _instance: UserLogic;

  private userRepo: UserRepo;
  /**
   * Singleton
   */
  static getInstance(): UserLogic {
    this._instance = this._instance || new UserLogic();
    return this._instance;
  }

  constructor() {
    this.userRepo = UserRepo.getInstance();
  }

  async getByEmail(email: String) {
    let userMatch = await this.userRepo.getByEmail(email);
    return userMatch;
  }

  async getByNickname(nickname: String) {
    let userMatch = await this.userRepo.getByNickname(nickname);
    return userMatch;
  }

  async getById(id: string): Promise<HttpResponse> {
    let result = await this.userRepo.getById(id);
    if (result) {
      return new HttpResponse(200, result);
    }
    return new HttpResponse(404);
  }

  async update(id: string, user: iUser) {
    try {
      await this.userRepo.update(id, user);
      return new HttpResponse(200, user);
    } catch (error) {
      return new HttpResponse(500);
    }
  }

  async create(user: iUser) {
    try {
      let ret = await this.userRepo.create(user);
      return new HttpResponse(201, ret);
    } catch (error) {
      return new HttpResponse(500);
    }
  }

  async setPassword(userId: string, password: string) {

    const salt = crypto.randomBytes(16).toString('base64');
    const saltBuffer = Buffer.from(salt, 'base64');
    let hashedPassword = crypto.pbkdf2Sync(password, saltBuffer, 10000, 64, 'sha1').toString('base64');

    await this.userRepo.updatePassword(userId, salt, hashedPassword);

  }
}