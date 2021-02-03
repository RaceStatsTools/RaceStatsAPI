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

  async trackRanking(track: number) {
    let sql;
    var sqlParams: any[] = [
      track
    ];

    sql = `SELECT min(l."time") as time, l.track, u.nickname, u.country
    FROM public.lap l
    INNER JOIN public.user u ON u.id = l.user_id
    INNER JOIN public.track t ON t.length = l.track
    WHERE t.id = $1
    GROUP BY l.track, u.nickname, u.country
    ORDER BY time`;
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
      t.*, l.*
      FROM public.race r
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
      t.*, l.*
      FROM public.race r
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

  async listRacesByDate(startDate: string, endDate: string, users: Array<number>) {
    let sql: string;
    sql = `SELECT r.*, t.name, t.country, t.length, t.gravel, t.asphalt
    FROM race r
    INNER JOIN track t ON t.length = r.track
    WHERE r.created_at BETWEEN $1 AND $2
    AND r.user_id IN (`;
    let userCount=0;
    users.forEach(userId => {
      if (userCount > 0) {
        sql += ","
      }
      sql += userId.toString();
      userCount++;
    })
    sql +=`)
    ORDER BY r.created_at, r.user_id, t.name, t.country, t.length, t.gravel, t.asphalt`;
    var sqlParams: any[] = [
      startDate,
      endDate
    ];
    const res = await BaseRepo.getInstance().select(sql, sqlParams);
    return res;
    ;
  }

  async listLapsForRaces(races: Array<number>) {
    let sql: string;
    sql = `SELECT l.*, u.nickname, u.country, r.position, r.id as race_id, r.time as total_time
    FROM lap l
    INNER JOIN public.user u
    ON u.id = l.user_id
    INNER JOIN race r
    ON l.race_uuid = r.uuid
    WHERE r.id IN (`;
    let raceCount=0;
    races.forEach(race => {
      if (raceCount > 0) {
        sql += ","
      }
      sql += race.toString();
      raceCount++;
    })
    sql +=`)
    GROUP BY l.id, u.nickname, u.country, r.position, r.id, r.time
    ORDER BY MIN(r.time), r.position, l.lap, u.nickname`;
    var sqlParams: any[] = [
    ];
    const res = await BaseRepo.getInstance().select(sql, sqlParams);
    return res;
  }
  
  async listBestLaps(userId: number) {
    let sql;
    var sqlParams: any[] = [
    ];
    if (userId != 0) {
      sqlParams.push(userId)
      sql = `WITH CTE_time AS (
        SELECT t.name, t.country, u.nickname, u.country as user_country, MIN(l.time) as time, l.track
        FROM public.track t
        INNER JOIN public.lap l
        ON t.length = l.track
        INNER JOIN public.user u
        ON u.id = l.user_id
        WHERE user_id=$1
        GROUP BY l.track, t.name, t.country, u.nickname, u.country
        ORDER BY t.name ASC
      )
      SELECT time.*, MIN(l.time) as best_time
      FROM CTE_time time
      INNER JOIN public.lap l
      ON time.track = l.track
      GROUP BY l.track, time.name, time.country, time.nickname, time.country, time.user_country, time.time, time.track
      ORDER BY time.name
      `;
    } else {
      sql = `WITH CTE_time AS (
        SELECT t.name, t.country, MIN(time) as time, l.track
          FROM public.lap l
          INNER JOIN public.track t
          ON t.length = l.track
          GROUP BY l.track, t.name, t.country
        )
        SELECT time.*, u.nickname, u.country as user_country FROM CTE_time time
        INNER JOIN public.lap l
        ON time.track = l.track AND time.time = l.time
        INNER JOIN public.user u
        ON u.id = l.user_id
        ORDER BY time.name`;
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

  async listBestLapsHistory(track: string, duration: number, userId: number) {
    let sql;
    var sqlParams: any[] = [
      track,
      duration
    ];
    if (userId != 0) {
      sqlParams.push(userId)
      sql = `SELECT MIN(l.time) as time, to_char(DATE(l.created_at),'YYYY-MM-DD') as date, to_char(DATE(NOW() - $2 * INTERVAL '1 day'),'YYYY-MM-DD') as mindate, to_char(DATE(NOW()),'YYYY-MM-DD') as maxdate
      FROM public.lap l
      INNER JOIN track t
      ON t.length = l.track
      WHERE t.id = $1 AND l.user_id = $3
      AND DATE(l.created_at) > NOW() - $2 * INTERVAL '1 day'
      GROUP BY date
      ORDER BY date`;
    } else {
      sql = `SELECT MIN(l.time) as time, to_char(DATE(l.created_at),'YYYY-MM-DD') as date, to_char(DATE(NOW() - $2 * INTERVAL '1 day'),'YYYY-MM-DD') as mindate, to_char(DATE(NOW()),'YYYY-MM-DD') as maxdate
      FROM public.lap l
      INNER JOIN track t
      ON t.length = l.track
      WHERE t.id = $1
      AND DATE(l.created_at) > NOW() - $2 * INTERVAL '1 day'
      GROUP BY date
      ORDER BY date`;
    }

    const res = await BaseRepo.getInstance().select(sql, sqlParams);

    //this.factory.mapFullRace(res)
    return res;
  }

}
