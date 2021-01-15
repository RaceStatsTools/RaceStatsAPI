import { BaseRepo } from '../../utils/base.repo';
import { LaptimeFactory } from './laptime.factory';
import { iLaptime } from './iLaptime';

export class LaptimeRepo {


  private static _instance: LaptimeRepo;

  /**
   * Singleton
   */
  static getInstance(): LaptimeRepo {
    if (this._instance === undefined) {
      this._instance = new LaptimeRepo();
    }
    return this._instance;
  }

  private baseRepo: BaseRepo;
  private factory: LaptimeFactory;

  constructor() {
    this.baseRepo = BaseRepo.getInstance();
    this.factory = LaptimeFactory.getInstance();
  }

  async getById(id: number): Promise<iLaptime> {

    let sql;
    var sqlParams: any[] = [];

    sql = `SELECT
    Laptime.*, organisation.name as organisation_name
    FROM Laptime 
    LEFT JOIN organisation on organisation.id = Laptime.organisation_id
    WHERE Laptime.id = ($1)`;
    sqlParams.push(id);

    const res = await BaseRepo.getInstance().selectSingle(sql, sqlParams);
    return LaptimeFactory.getInstance().map(res);

  }

  async postLaptime(Laptime: iLaptime) {

    const sql = `INSERT INTO laptime
    (
        pilot,
        track,
        created_at,
        lap_time,
        lap
    )
    VALUES
    (
      $1,
      $2,
      NOW(),
      $3,
      $4
    )
    RETURNING *`;
    const sqlParams = [
      Laptime.pilot,
      Laptime.track,
      Laptime.lap_time,
      Laptime.lap
      ];
    try {
      let result = await this.baseRepo.selectSingle(sql, sqlParams);
      return this.factory.map(result);
    } catch (e) {
      console.error(new Error(e));
      console.error(`sql: ${sql}, sqlParams: ${JSON.stringify(sqlParams)}`);
      throw new Error('Database exception');
    }
  }

  async search(requestString: string, type: string, status: string, pageSize: number, pageIndex: number, sortColumn: string, sortDirection: string): Promise<any[]> {
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
  }

}
