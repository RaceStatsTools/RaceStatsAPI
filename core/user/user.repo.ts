import { BaseRepo } from '../../utils/base.repo';
import { UserFactory } from './user.factory';
import { iUser } from './iUser'

export class BoUserRepo {

  private static _instance: BoUserRepo;

  /**
   * Singleton
   */
  static getInstance(): BoUserRepo {
    this._instance = this._instance || new BoUserRepo();
    return this._instance;
  }

  baseRepo: BaseRepo;
  userFactory: UserFactory;

  constructor() {
    this.baseRepo = BaseRepo.getInstance();
    this.userFactory = UserFactory.getInstance();
  }

  async getByEmail(email: String): Promise<any> {
    const sql = "SELECT * FROM public.user WHERE email=($1)";
    const sqlParams = [email];
    let res = await BaseRepo.getInstance().selectSingle(sql, sqlParams);
    return res;
  }

  async getById(id: string): Promise<any> {
    const sql = "SELECT * FROM public.user WHERE id=$1;";
    const sqlParams = [id];

    try {
      let res = await this.baseRepo.selectSingle(sql, sqlParams);
      if (!res) return null;
      return this.userFactory.mapFromDb(res);
    } catch (e) {
      console.error(new Error(e));
      console.error(`sql: ${sql}, sqlParams: ${JSON.stringify(sqlParams)}`);
      throw new Error('Database exception');
    }
  }

  async update(id: string, boUser: iUser) {
    const sql = 'UPDATE public.user set nickname=$2, email=$3, updated_at=NOW() where id=$1;'
    const sqlParams = [
      id,
      boUser.nickname,
      boUser.email
    ];

    try {
      await this.baseRepo.executeSql(sql, sqlParams);
      return boUser;
    } catch (e) {
      console.error(new Error(e));
      console.error(`sql: ${sql}, sqlParams: ${JSON.stringify(sqlParams)}`);
      throw new Error('Database exception');
    }
  }

  async create(boUser: iUser) {
    const sql = `INSERT INTO public.user (nickname, email, created_at) VALUES ($1, $2, NOW()) RETURNING *;`
    const sqlParams = [
      boUser.nickname,
      boUser.email
    ];

    try {
      let rows = await this.baseRepo.executeSql(sql, sqlParams);
      return this.userFactory.mapFromDb(rows[0]);
    } catch (e) {
      console.error(new Error(e));
      console.error(`sql: ${sql}, sqlParams: ${JSON.stringify(sqlParams)}`);
      throw new Error('Database exception');
    }
  }

  async updatePassword(userId: string, salt: string, hashedPassword: string) {
    const sql = 'UPDATE public.user set passwordhash=$2, salt=$3, updated_at=NOW() where id=$1';
    const sqlParams = [
      userId,
      hashedPassword,
      salt
    ];
    let res = await BaseRepo.getInstance().executeSql(sql, sqlParams);
    return;
  }

}