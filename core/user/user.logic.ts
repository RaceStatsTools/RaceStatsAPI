import { BoUserRepo } from "./user.repo";
import { HttpResponse } from "../../utils/httpResponse";
import { iUser } from "./iUser";
import * as crypto from 'crypto';

export class UserLogic {
  private static _instance: UserLogic;

  private boUserRepo: BoUserRepo;
  /**
   * Singleton
   */
  static getInstance(): UserLogic {
    this._instance = this._instance || new UserLogic();
    return this._instance;
  }

  constructor() {
    this.boUserRepo = BoUserRepo.getInstance();
  }

  async getByEmail(email: String) {
    let userMatch = await this.boUserRepo.getByEmail(email);
    return userMatch;
  }

  async getById(id: string): Promise<HttpResponse> {
    let result = await this.boUserRepo.getById(id);
    if (result) {
      return new HttpResponse(200, result);
    }
    return new HttpResponse(404);
  }

  async update(id: string, boUser: iUser) {
    try {
      await this.boUserRepo.update(id, boUser);
      return new HttpResponse(200, boUser);
    } catch (error) {
      return new HttpResponse(500);
    }
  }

  async create(boUser: iUser) {
    try {
      let ret = await this.boUserRepo.create(boUser);
      return new HttpResponse(201, ret);
    } catch (error) {
      return new HttpResponse(500);
    }
  }

  async setPassword(boUserId: string, password: string) {

    const salt = crypto.randomBytes(16).toString('base64');
    const saltBuffer = Buffer.from(salt, 'base64');
    let hashedPassword = crypto.pbkdf2Sync(password, saltBuffer, 10000, 64, 'sha1').toString('base64');

    await this.boUserRepo.updatePassword(boUserId, salt, hashedPassword);

  }
}