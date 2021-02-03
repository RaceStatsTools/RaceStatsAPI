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
    let userStats = {
      id: 0,
      nickname: '',
      country: '',
      race_count: 0,
      lap_count: 0,
      victory_count: 0,
      podium_count: 0,
      race_time: 0,
      tracks: Array<any>()
    };
    let userMatch = await this.userRepo.getByNickname(nickname);
    if (userMatch) {
      userStats.id = userMatch.id
      userStats.nickname = userMatch.nickname
      userStats.country = userMatch.country
      let result = await this.userRepo.getRaceLapCountByUserId(userStats.id);
      if (result) {
        userStats.race_count = result.race_count
        userStats.lap_count = result.lap_count
        userStats.race_time = result.race_time
      }
      result = await this.userRepo.getVictoryCountByUserId(userStats.id);
      if (result) {
        userStats.victory_count = result.victory_count
      }
      result = await this.userRepo.getPodiumCountByUserId(userStats.id);
      if (result) {
        userStats.podium_count = result.podium_count
      }
      let tracks = await this.userRepo.getTrackRoundCountByUserId(userStats.id);
        tracks.forEach(track => {
          userStats.tracks.push(track)
        });
      return new HttpResponse(200, userStats);
    }
    return new HttpResponse(404);
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