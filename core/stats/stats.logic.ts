import { StatsRepo } from './stats.repo';
import { HttpResponse } from '../../utils/httpResponse';
import { iLap } from './iLap';
import { iRace } from './iRace';

export class raceFull {
  uuid: string = '';
  name: string = '';
  country: string = '';
  created_at: Date = new Date;
  length: string = '';
  asphalt : number = 0;
  gravel : number = 0;
  position : number = 0;
  time : string = "";
  user_id : number = 0;
  laps : iLap[] = [];
} 

export class StatsLogic {

  private static _instance: StatsLogic

  /**
   * Singleton
   */
  static getInstance(): StatsLogic {
    if (this._instance === undefined) {
      this._instance = new StatsLogic();
    }
    return this._instance;
  }

  async postLap(Laptime: iLap) {
    try {
      let result = await StatsRepo.getInstance().postLap(Laptime);
      return new HttpResponse(200, result);
    } catch (e) {
      console.error(`[statsLogic.postLap] error with Lap`);
      console.error(e);
      return new HttpResponse(500);
    }
  }

  async postRace(race: iRace) {
    try {
      let result = await StatsRepo.getInstance().postRace(race);
      return new HttpResponse(200, result);
    } catch (e) {
      console.error(`[statsLogic.postLap] error with Lap`);
      console.error(e);
      return new HttpResponse(500);
    }
  }

  async listTracks() {
    try {
      let result = await StatsRepo.getInstance().listTracks();
      return new HttpResponse(200, result);
    } catch (e) {
      console.error(`[statsLogic.listTracks] error `);
      console.error(e);
      return new HttpResponse(500);
    }
  }

  async listRacesByTrackId(id: number) {
    try {
      let result = await StatsRepo.getInstance().listRacesByTrackId(id);

      result = this.parseRacesAndLaps(result)
      return new HttpResponse(200, result);
    } catch (e) {
      console.error(`[statsLogic.listRacesByLength] error `);
      console.error(e);
      return new HttpResponse(500);
    }
  }

  async listBestLaps(userId: number) {
    try {
      let result = await StatsRepo.getInstance().listBestLaps(userId);

      return new HttpResponse(200, result);
    } catch (e) {
      console.error(`[statsLogic.listRacesByLength] error `);
      console.error(e);
      return new HttpResponse(500);
    }
  }

  parseRacesAndLaps(laps: any[]): any[] {
    let races: raceFull[] = [];
    let currentRace = '';
    let race: raceFull = new raceFull();
    for(let lap of laps) {
      if (currentRace != lap.uuid) {
        if (currentRace != '') {
          races.push(race);
        }
          currentRace = lap.uuid
          race = new raceFull();
          race.uuid = lap.uuid;
          race.name = lap.name;
          race.country = lap.country;
          race.created_at = lap.race_date;
          race.length = parseInt(lap.length).toString();
          race.asphalt = lap.asphalt;
          race.gravel = lap.gravel;
          race.position = lap.position;
          race.time = this.formatRaceTime(lap.race_time);
          race.user_id = lap.user_id;

          var currentLap:iLap = {
            id: lap.id,
            userId: lap.user_id,
            track: lap.length,
            createdAt: lap.created_at,
            time: lap.time,
            lap: lap.lap,
            race: lap.uuid
          };
          
          race.laps.push(currentLap)
        } else {
          var currentLap:iLap = {
            id: lap.id,
            userId: lap.user_id,
            track: lap.length,
            createdAt: lap.created_at,
            time: lap.time,
            lap: lap.lap,
            race: lap.uuid
          };
          
          race.laps.push(currentLap)
        }
      }
      return races;
    }

    formatRaceTime(time: number) {
      let minutes = parseInt(`${time/60}`);
      let minutesString = "0"+minutes.toString()
      minutesString = minutesString.substring(minutesString.length-2, minutesString.length);

      let seconds = parseInt(`${time - minutes*60}`);
      let secondsString = "0"+seconds.toString()
      secondsString = secondsString.substring(secondsString.length-2, secondsString.length);

      let ms = parseInt(`${(time - minutes*60 - seconds) * 1000}`);
      let msString = ms.toString()+"000";
      msString = msString.substring(0, 3);
      let timeString = "";
      if (minutes > 0) {
        timeString = minutesString+":"+secondsString+"."+msString;
      } else {
        timeString = secondsString+"."+msString;
      }
      
      return timeString
    }

}
