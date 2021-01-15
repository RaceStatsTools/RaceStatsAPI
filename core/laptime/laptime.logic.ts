import { LaptimeRepo } from './laptime.repo';
import { HttpResponse } from '../../utils/httpResponse';
import { iLaptime } from './iLaptime';

export class LaptimeLogic {

  private static _instance: LaptimeLogic

  /**
   * Singleton
   */
  static getInstance(): LaptimeLogic {
    if (this._instance === undefined) {
      this._instance = new LaptimeLogic();
    }
    return this._instance;
  }

  async getById(id: number): Promise<any | undefined> {
    try {
      let Laptime: iLaptime = await LaptimeRepo.getInstance().getById(id);
      
      return new HttpResponse(200, Laptime || {});
    } catch (e) {
      console.error(`[LaptimeLogic.getById] error with Laptime with id ${id} `);
      console.error(e);
      return new HttpResponse(500);
    }
  }

  async postLaptime(Laptime: iLaptime) {
    try {
      let result = await LaptimeRepo.getInstance().postLaptime(Laptime);
      return new HttpResponse(200, result);
    } catch (e) {
      console.error(`[LaptimeLogic.postLaptime] error with Laptime`);
      console.error(e);
      return new HttpResponse(500);
    }
  }

  async search(requestString: string, type: string, status: string, pageSize: number, pageIndex: number, sortColumn: string, sortDirection: string): Promise<HttpResponse> {
    try {
      let result;
      result = await LaptimeRepo.getInstance().search(requestString, type, status, pageSize, pageIndex, sortColumn, sortDirection);
      return new HttpResponse(200, result);
    } catch (error) {
      return new HttpResponse(500);
    }
  }
}
