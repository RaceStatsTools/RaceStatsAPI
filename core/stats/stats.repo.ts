import { BaseRepo } from '../../utils/base.repo';
import { StatsFactory } from './stats.factory';
import { iLap } from './iLap';
import { iRace } from './iRace';

export class StatsRepo {


  private static _instance: StatsRepo;

  /**
   * Singleton
   */
  static getInstance(): StatsRepo {
    if (this._instance === undefined) {
      this._instance = new StatsRepo();
    }
    return this._instance;
  }

  private baseRepo: BaseRepo;
  private factory: StatsFactory;

  constructor() {
    this.baseRepo = BaseRepo.getInstance();
    this.factory = StatsFactory.getInstance();
  }
/*
  async getById(id: number): Promise<iLap> {

    let sql;
    var sqlParams: any[] = [];

    sql = `SELECT
    Laptime.*, organisation.name as organisation_name
    FROM lap 
    LEFT JOIN organisation on organisation.id = Laptime.organisation_id
    WHERE Laptime.id = ($1)`;
    sqlParams.push(id);

    const res = await BaseRepo.getInstance().selectSingle(sql, sqlParams);
    return StatsFactory.getInstance().mapLap(res);

  }
*/
  async listTracks() {
    let sql;
    var sqlParams: any[] = [];

    sql = `SELECT * FROM public.track
    ORDER BY name ASC`;

    const res = await BaseRepo.getInstance().select(sql, sqlParams);
    return res;
     
  }

  async listUserRacesByTrackId(userId: number, id: number) {
    let sql;
    var sqlParams: any[] = [
    ];
    if (id != 0) {
      sqlParams.push(userId)
      sqlParams.push(id)
      sql = `SELECT  
      r.uuid,
      r.created_at as race_date,
      r.position,
      r.time as race_time,
      t.*, l.* FROM public.race r
      INNER JOIN public.track t
      ON r.track = t.length
      INNER JOIN public.lap l
      ON l.race_uuid = r.uuid
      WHERE t.id = $2 AND l.user_id = $1
      ORDER BY r.created_at DESC, lap ASC`;
    } else {
      sqlParams.push(userId)
      sql = `SELECT 
      r.uuid,
      r.created_at as race_date,
      r.position,
      r.time as race_time,
      t.*, l.* FROM public.race r
      INNER JOIN public.track t
      ON r.track = t.length
      INNER JOIN public.lap l
      ON l.race_uuid = r.uuid
      WHERE l.user_id = $1
      ORDER BY r.created_at DESC, lap ASC`;
    }

    const res = await BaseRepo.getInstance().select(sql, sqlParams);
    //this.factory.mapFullRace(res)
    return res;
     
  }

  
  async listBestLaps(userId: number) {
    let sql;
    var sqlParams: any[] = [
    ];
    if (userId != 0) {
      sqlParams.push(userId)
      sql = `SELECT t.name, t.country, u.nickname, MIN(l.time) as time
      FROM public.track t
      INNER JOIN public.lap l
      ON t.length = l.track
      INNER JOIN public.user u
      ON u.id = l.user_id
      WHERE user_id=$1
      GROUP BY l.track, t.name, t.country, u.nickname
      ORDER BY t.name ASC`;
    } else {
      sql = `SELECT t.name, t.country, u.nickname, MIN(l.time) as time
      FROM public.track t
      INNER JOIN public.lap l
      ON t.length = l.track
      INNER JOIN public.user u
      ON u.id = l.user_id
      GROUP BY l.track, t.name, t.country, u.nickname
      ORDER BY t.name ASC`;
    }

    const res = await BaseRepo.getInstance().select(sql, sqlParams);
    //this.factory.mapFullRace(res)
    return res;
  }

  async postLap(lap: iLap) {
    const sql = `INSERT INTO lap
    (
        track,
        time,
        created_at,
        lap,
        race_uuid,
        user_id
    )
    VALUES
    (
      $1,
      $2,
      NOW(),
      $3,
      $4,
      $5
    )
    RETURNING *`;
    const sqlParams = [
      lap.track,
      lap.time,
      lap.lap,
      lap.race,
      lap.userId
      ];
    try {
      let result = await this.baseRepo.selectSingle(sql, sqlParams);
      return this.factory.mapLap(result);
    } catch (e) {
      console.error(new Error(e));
      console.error(`sql: ${sql}, sqlParams: ${JSON.stringify(sqlParams)}`);
      throw new Error('Database exception');
    }
  }

  async postRace(race: iRace) {
    const sql = `INSERT INTO race
    (
        track,
        position,
        time,
        user_id,
        created_at,
        uuid
    )
    VALUES
    (
      $1,
      $2,
      $3,
      $4,
      NOW(),
      $5
    )
    RETURNING *`;
    const sqlParams = [
      race.track,
      race.position,
      race.time,
      race.userId,
      race.uuid
      ];
    try {
      let result = await this.baseRepo.selectSingle(sql, sqlParams);
      return this.factory.mapRace(result);
    } catch (e) {
      console.error(new Error(e));
      console.error(`sql: ${sql}, sqlParams: ${JSON.stringify(sqlParams)}`);
      throw new Error('Database exception');
    }
  }

 /* async search(requestString: string, type: string, status: string, pageSize: number, pageIndex: number, sortColumn: string, sortDirection: string): Promise<any[]> {
    let searchTerm = '%' + requestString + '%'
    let whereClause = `WHERE (Laptime.id::TEXT ILIKE $1 OR Laptime.status ILIKE $1 OR organisation.name ILIKE $1)`;

    if (type != '') {
      whereClause += ` AND type = '${type}'`;
    }

    if (status != '') {
      whereClause += ` AND status = '${status}'`;
    }

    let orderByExp = `id desc`
    if (sortColumn != undefined && sortColumn != '' && sortDirection != undefined && sortDirection != '')
    {
        orderByExp = `${sortColumn} ${sortDirection} `;
    }
    const sql = `
    WITH cte_Laptime as (
      SELECT
      Laptime.*, organisation.name as organisation_name
      FROM Laptime 
      LEFT JOIN organisation on organisation.id = Laptime.organisation_id
      ${whereClause}
    )
    SELECT
    (SELECT count(*) FROM cte_Laptime) as total,
    cte_Laptime.*
    FROM cte_Laptime
    ORDER BY ${orderByExp}
    LIMIT $2 OFFSET $3
    ;`;

    const sqlParams = [
        searchTerm,
        pageSize,
        pageIndex * pageSize
    ];

    const res = await BaseRepo.getInstance().executeSql(sql, sqlParams);
    return Promise.resolve(LaptimeFactory.getInstance().mapCollection(res));
  }*/

}
