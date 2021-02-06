import { StatsRepo } from './stats.repo';
import { UserRepo } from '../user/user.repo';
import { HttpResponse } from '../../utils/httpResponse';
import { iLap } from './iLap';
import { iRace } from './iRace';
import { any, number } from 'joi';

export class raceFull {
  uuid: string = '';
  name: string = '';
  country: string = '';
  created_at: Date = new Date;
  length: string = '';
  asphalt: number = 0;
  gravel: number = 0;
  position: number = 0;
  time: string = "";
  user_id: number = 0;
  laps: iLap[] = [];
}

interface Index {
  [key: string]: any;
}

interface Event {
  start: string,
  end: string,
  users: Index,
  stages: Array<any>
}

interface Stage {
  track: string,
  created_at: Date,
  country: string,
  length: string,
  asphalt: number,
  gravel: number,
  points: Index,
  rounds: Array<any>
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

  async postLap(lap: iLap) {
    try {
      let result = await StatsRepo.getInstance().postLap(lap);
      return new HttpResponse(200, result);
    } catch (e) {
      console.error(`[statsLogic.postLap] error with Lap ${lap}`);
      console.error(e);
      return new HttpResponse(500);
    }
  }

  async postRace(race: iRace) {
    try {
      let result = await StatsRepo.getInstance().postRace(race);
      return new HttpResponse(200, result);
    } catch (e) {
      console.error(`[statsLogic.postLap] error with Race ${race}`);
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

  async trackRanking(track: number, pageSize: number, pageIndex: number) {
    try {
      let result = await StatsRepo.getInstance().trackRanking(track, pageSize, pageIndex);
      return new HttpResponse(200, result);
    } catch (e) {
      console.error(`[statsLogic.trackRanking] error `);
      console.error(e);
      return new HttpResponse(500);
    }
  }

  async listUserRacesByTrackId(userId: number, id: number) {
    try {
      let result = await StatsRepo.getInstance().listUserRacesByTrackId(userId, id);

      result = this.parseRacesAndLaps(result)
      return new HttpResponse(200, result);
    } catch (e) {
      console.error(`[statsLogic.listRacesByLength] error `);
      console.error(e);
      return new HttpResponse(500);
    }
  }

  async listRacesByDate(startDate: string, endDate: string, users: Array<number>) {
    try {
      let event: Event = {
        start: startDate,
        end: endDate,
        users: {},
        stages: Array<any>()
      }

      let userDetails: Index = await UserRepo.getInstance().getByIds(users);
      userDetails.forEach((element: { nickname: string; country: string; points: number }) => {
        /*let user = {
          nickname: element.nickname,
          country: element.country,
          points: 0,
        }*/
        event.users[element.nickname] = 0;
      });
      let result = await StatsRepo.getInstance().listRacesByDate(startDate, endDate, users);
      let currentRound = 0;
      let currentTrack = '';
      let currentTime = 0;

      let currentStage: Stage = {
        track: '',
        created_at: new Date(),
        country: '',
        length: '',
        asphalt: 0,
        gravel: 0,
        points: {},
        rounds: Array<any>()
      }
      result.forEach(race => {
        if (race.name != currentTrack) {
          if (currentTrack != '') {
            // Curent track changed
            event.stages.push(currentStage)
          }
          currentRound = -1;
          currentTrack = race.name;
          currentStage = {
            track: currentTrack,
            created_at: race.created_at,
            country: race.country,
            length: race.length,
            asphalt: race.asphalt,
            gravel: race.gravel,
            points: {},
            rounds: Array<any>()
          }
          // Create new currentStage
        }

        if (currentTime == 0) {
          // Create new round
          currentRound++
          let round = {
            number: currentRound,
            races: Array<any>(),
            pilots: Array<any>()
          }
          let myRace = {
            id: race.id,
            //position: race.position,
            time: race.time,
            user_id: race.user_id
          }
          round.races.push(myRace)
          currentStage.rounds.push(round)
          // Add round to stage
          currentTime = race.created_at
        } else {
          let diff = race.created_at - currentTime;

          if (diff < 220000 && diff > -220000) {
            // Add race to round
            let myRace = {
              id: race.id,
              //position: race.position,
              time: race.time,
              user_id: race.user_id
            }
            currentStage.rounds[currentRound].races.push(myRace)
          } else {
            // Create new round
            currentRound++
            currentTime = race.created_at
            let round = {
              number: currentRound,
              races: Array<any>(),
              pilots: Array<any>()
            }
            // Add round to stage
            let myRace = {
              id: race.id,
              //position: race.position,
              time: race.time,
              user_id: race.user_id
            }
            round.races.push(myRace)
            // Add race to round
            currentStage.rounds.push(round)
          }
        }
      })
      event.stages.push(currentStage)

      const qualifPoints = [50, 45, 42, 40, 39, 38, 37, 36];

      // Get all laps for this event
      for (let stage of event.stages) {
        let stagePoints: Index = {};
        for (let round of stage.rounds) {
          let raceIds: Array<number> = [];
          let races: Array<any> = round.races

          races.forEach(race => {
            raceIds.push(race.id)
          });
          let laps = await StatsRepo.getInstance().listLapsForRaces(raceIds);

          let currentLap = -1
          let currentPosition = -1
          let currentPilot = 0
          let cleanLaps: Array<any> = []

          laps.forEach(item => {
            if (currentPilot != item.user_id) {
              currentPilot = item.user_id
              currentPosition++
              if (!stagePoints[item.nickname]) {
                stagePoints[item.nickname] = 0
              }
              stagePoints[item.nickname] += qualifPoints[currentPosition];
              event.users[item.nickname] += qualifPoints[currentPosition];
              //console.log(stagePoints)
              if (event.users[item.nickname]) {
                event.users[item.nickname] += qualifPoints[currentPosition];
              }

              stage.points = stagePoints;
              // console.log(stage.points)
              let pilotLaps = {
                id: item.user_id,
                pilot: item.nickname,
                points: qualifPoints[currentPosition],
                time: item.total_time || 0,
                formated_time: this.formatRaceTime(item.total_time) || 0,
                penalty: 0,
                laps: Array<any>()
              }
              pilotLaps.laps.push({
                number: item.lap,
                time: item.time,
              })
              cleanLaps.push(pilotLaps)

            }
            else {
              let pilotLaps: Array<any> = cleanLaps[currentPosition].laps;
              pilotLaps.push({
                number: item.lap,
                time: item.time,
              })
              cleanLaps[currentPosition].laps = pilotLaps
            }
          })
          // Calculate penalty
          cleanLaps.forEach(pilot => {
            let penalty = 0;
            let totalLaps = 0;
            let laps: Array<any> = pilot.laps;
            laps.forEach(element => {
              totalLaps += element.time
            });
            if (pilot.time - totalLaps < -1 || pilot.time - totalLaps > 1) {
              penalty = pilot.time - totalLaps;
              console.log(penalty)
            }
          })
          // Push laps
          // cleanLaps
          round.pilots = cleanLaps
        }
      }
      //Order stage points as an Array and calcultage event total points
      for (let stage of event.stages) {
        let pilots = []
        let points: Index = stage.points;
        let players = Object.keys(stage.points);
        players.sort();
        for (let i = 0; i < players.length; i++) {
          pilots.push({
            nickname: players[i],
            points: stage.points[players[i]],
          })
        };
        stage.points = pilots;

      }

      //Order event points as an Array and calcultage event total points
      let pilots = []
      let points: Index = event.users;
      let players = Object.keys(event.users);
      let playersPoints = Object.values(event.users);
      playersPoints.sort((a: number, b: number) => {
        if (a > b)
          return -1;
        if (a < b)
          return 1;
        // a doit être égal à b
        return 0;
      });
      for (let i = 0; i < playersPoints.length; i++) {
        for (let j = 0; j < playersPoints.length; j++) {
          if (playersPoints[i] == event.users[players[j]]) {
            pilots.push({
              nickname: players[j],
              points: event.users[players[j]],
            })
          }
        }
      };
      event.users = pilots;

      return new HttpResponse(200, event);
    } catch (e) {
      console.error(`[statsLogic.listRaceByDate] error `);
      console.error(e);
      return new HttpResponse(500);
    }
  }

  sortObjectByKeys(myObj: Index) {
    let keys = Object.keys(myObj);
    let i, len = keys.length;

    keys.sort();

    for (i = 0; i < len; i++) {
      let k = keys[i];
      // console.log(k + ':' + myObj[k]);
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

  async listBestLapsHistory(track: string, duration: number, userId: number) {
    try {
      let result = await StatsRepo.getInstance().listBestLapsHistory(track, duration, userId);
      let formatedResult: Array<any> = [];
      const today = new Date(new Date().setHours(0, 0, 0, 0));
      const beginDate = new Date(today)
      beginDate.setDate(today.getDate() - duration);

      for (let i = 0; i < duration; i++) {
        formatedResult.push(null)
      }
      if (result.length > 0) {
        result.forEach(time => {
          const currentDate = new Date(time.date);
          const dateIndex = (currentDate.getTime() - beginDate.getTime()) / (24 * 3600 * 1000);
          formatedResult[Math.round(dateIndex)] = time.time
        })
      }
      return new HttpResponse(200, formatedResult);
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
    let raceToPush = 1;
    for (let lap of laps) {
      if (currentRace != lap.uuid) {
        if (currentRace != '') {
          races.push(race);
          raceToPush--;
        }
        currentRace = lap.uuid
        race = new raceFull();
        raceToPush++;
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

        var currentLap: iLap = {
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
        var currentLap: iLap = {
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
    if (raceToPush > 0 && race.laps.length > 0) {
      races.push(race);
    }
    return races;
  }

  formatRaceTime(time: number) {
    let minutes = parseInt(`${time / 60}`);
    let minutesString = "0" + minutes.toString()
    minutesString = minutesString.substring(minutesString.length - 2, minutesString.length);

    let seconds = parseInt(`${time - minutes * 60}`);
    let secondsString = "0" + seconds.toString()
    secondsString = secondsString.substring(secondsString.length - 2, secondsString.length);

    let ms = parseInt(`${(time - minutes * 60 - seconds) * 1000}`);
    let msString = ms.toString() + "000";
    msString = msString.substring(0, 3);
    let timeString = "";
    if (minutes > 0) {
      timeString = minutesString + ":" + secondsString + "." + msString;
    } else {
      timeString = secondsString + "." + msString;
    }

    return timeString
  }

}
