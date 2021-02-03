import { BaseRepo } from '../../utils/base.repo';
import { UserFactory } from './user.factory';
import { iUser } from './iUser'

export class UserRepo {

  private static _instance: UserRepo;

  /**
   * Singleton
   */
  static getInstance(): UserRepo {
    this._instance = this._instance || new UserRepo();
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

  async getByNickname(nickname: String): Promise<any> {
    const sql = "SELECT id, nickname, country FROM public.user WHERE LOWER(nickname)=($1)";
    const sqlParams = [nickname];
    let res = await BaseRepo.getInstance().selectSingle(sql, sqlParams);
    return res;
  }

  async getTrackRoundCountByUserId(id: number) {
    const sql = `SELECT t.id, t.name, t.country, count(r.id) as count FROM public.track t
    INNER JOIN public.race r ON r.track = t.length
    WHERE r.user_id=$1
    GROUP BY t.id, t.name, t.country
    ORDER BY count(r.id) DESC`;
    const sqlParams = [id];
    let res = await BaseRepo.getInstance().select(sql, sqlParams);
    return res;
  }

  async getRaceLapCountByUserId(id: number) {
    const sql = `select count(DISTINCT r.uuid) as race_count, count(*) as lap_count, SUM(r.time) as race_time from public.lap l
    INNER JOIN public.race r ON l.race_uuid = r.uuid
    WHERE l.user_id = $1`;
    const sqlParams = [id];
    let res = await BaseRepo.getInstance().selectSingle(sql, sqlParams);
    return res;
  }

  async getVictoryCountByUserId(id: number) {
    const sql = `select count(*) as victory_count
    FROM public.race r
    WHERE r.user_id = $1 AND r.position = 1`;
    const sqlParams = [id];
    let res = await BaseRepo.getInstance().selectSingle(sql, sqlParams);
    return res;
  }

  async getPodiumCountByUserId(id: number) {
    const sql = `select count(*) as podium_count
    FROM public.race r
    WHERE r.user_id = $1 AND (r.position = 2 OR r.position = 3)`;
    const sqlParams = [id];
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

  async getByIds(ids: Array<number>): Promise<any> {
    let sql = `SELECT * FROM public.user u WHERE u.id IN (`;
    let userCount=0;
    ids.forEach(userId => {
      if (userCount > 0) {
        sql += ","
      }
      sql += userId.toString();
      userCount++;
    });
    sql +=`)
    ORDER BY u.nickname;`;
    const sqlParams:Array<any> = [];
    try {
      let res = await this.baseRepo.select(sql, sqlParams);
      if (!res) return null;
      return this.userFactory.mapFromDbColl(res);
    } catch (e) {
      console.error(new Error(e));
      console.error(`sql: ${sql}, sqlParams: ${JSON.stringify(sqlParams)}`);
      throw new Error('Database exception');
    }
  }

  async update(id: string, user: iUser) {
    const sql = 'UPDATE public.user set nickname=$2, email=$3, updated_at=NOW() where id=$1;'
    const sqlParams = [
      id,
      user.nickname,
      user.email
    ];

    try {
      await this.baseRepo.executeSql(sql, sqlParams);
      return user;
    } catch (e) {
      console.error(new Error(e));
      console.error(`sql: ${sql}, sqlParams: ${JSON.stringify(sqlParams)}`);
      throw new Error('Database exception');
    }
  }

  async create(user: iUser) {
    const sql = `INSERT INTO public.user (nickname, email, country, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *;`
    const sqlParams = [
      user.nickname,
      user.email,
      user.country
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