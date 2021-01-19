export class StatsFactory {

    private static _instance: StatsFactory;

    /**
     * Singleton
     */
    static getInstance(): StatsFactory {
        if (this._instance === undefined) {
            this._instance = new StatsFactory();
        }
        return this._instance;
    }

    mapLap(item: any) {

        let ret : any = {
            id: item.id || 0,
            userId: item.user_id,
            track: item.track,
            createdAt: item.created_at,
            time: item.time,
            lap: item.lap,
            race: item.race_uuid
        };

        return ret;
    }

    mapLapCollection(list: any[]) {
        return list.map(b => this.mapLap(b));
        }

    mapRace(item: any) {

    let ret : any = {
        id: item.id || 0,
        userId: item.user_id,
        track: item.track,
        position: item.position,
        createdAt: item.created_at,
        time: item.lap_time,
        lap: item.lap,
        uuid: item.uuid

    };

    return ret;
}

    mapRaceCollection(list: any[]) {
        return list.map(b => this.mapRace(b));
        }
    
    /*mapFullRace(list: any[]) {
        for 
        return list.map(b => this.mapRace(b));
    }*/

}