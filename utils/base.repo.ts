import * as pg from 'pg';

export class BaseRepo {

  private static _instance: BaseRepo;

  /**
   * Singleton
   */
  static getInstance(): BaseRepo {
    if (this._instance === undefined) {
      this._instance = new BaseRepo();
    }
    return this._instance;
  }

  private connected: boolean;
  private _client!: pg.Client;

  constructor() {
    this.connected = false;
  }

  async connect(): Promise<boolean> {
    if (this.connected) { return Promise.resolve(true); }

    let config: pg.ClientConfig = {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };
    this._client = new pg.Client(config);

    return new Promise<boolean>((resolve) => {
      this._client.connect((err) => {
        if (err) {
          console.error('ERROR: Unable to connect to database', process.env.DB_HOST, process.env.DB_NAME, process.env.DB_USER);
          return resolve(false);
        }
        this.connected = true;
        console.log(`DATABASE:   ${config.database}`);
        resolve(true);
      });
    });
  }

  private async disconnect(): Promise<boolean> {
    if (!this.connected) { return Promise.resolve(true); }

    return this._client.end()
      .then(() => {
        this.connected = false;
        return true;
      }).catch(() => {
        return false;
      });
  }

  private async getConn(): Promise<pg.Client> {
    if (this.connected) {
      return Promise.resolve(this._client);
    }
    await this.connect();
    return Promise.resolve(this._client);
  }

  async select(sql: string, params: any[]): Promise<any[]> {
    var conn = await this.getConn();
    return new Promise<any>((resolve, reject) => {

      conn.query(sql, params,
        (err: Error | undefined, data: any) => {
          if (err) {
            console.error(err);
            console.error(`sql: ${sql}, sqlParams: ${JSON.stringify(params)}`);
            reject(err);
          }
          resolve(data ? data.rows : []);
        }
      );
    });

  }

  async selectSingle(sql: string, params: any[]): Promise<any> {
    var conn = await this.getConn();
    return new Promise<any>((resolve, reject) => {

      conn.query(sql, params, (err: Error | undefined, data: pg.QueryResult) => {
        if (err) {
          console.error(err);
          console.error(`sql: ${sql}, sqlParams: ${JSON.stringify(params)}`);
          return reject(err);
        }
        if (!data.rows.length) {
          return resolve(null);
        }
        return resolve(data.rows[0]);
      });
    });
  }

  async executeSql(sql: string, params: any[]): Promise<any> {
    var conn = await this.getConn();

    return new Promise<any>((resolve, reject) => {
      conn.query(sql, params,
        (err: Error | undefined, data: pg.QueryResult) => {
          if (err) {
            console.error(err);
            console.error(`sql: ${sql}, sqlParams: ${JSON.stringify(params)}`);
            return reject(err);
          }
          return resolve(data.rows);
        }
      );
    });
  }

}