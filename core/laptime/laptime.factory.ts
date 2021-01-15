export class LaptimeFactory {

    private static _instance: LaptimeFactory;

    /**
     * Singleton
     */
    static getInstance(): LaptimeFactory {
        if (this._instance === undefined) {
            this._instance = new LaptimeFactory();
        }
        return this._instance;
    }

    map(item: any) {

        let ret : any = {
            id: item.id || 0,
            pilot: item.pilot,
            track: item.track,
            created_at: item.created_at,
            lap_time: item.lap_time,
            lap: item.lap
        };

        return ret;
    }

    mapCollection(list: any[]) {
        return list.map(b => this.map(b));
      }
}