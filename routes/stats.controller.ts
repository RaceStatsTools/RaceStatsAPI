import { Router, Request, NextFunction, Response } from 'express';
import { StatsLogic } from '../core/stats/stats.logic';
import { iLap } from '../core/stats/iLap';
import { iRace } from '../core/stats/iRace';
import { guard } from '../core/auth/guard';
import { iUser } from '../core/user/iUser';

export class StatsController {

    public static create(app: Router) {
        const router: Router = Router();
        router.post('/laps/', guard, new StatsController().PostLap);
        router.get('/laps/best/:userId', new StatsController().listBestLaps)
        router.post('/races/', guard, new StatsController().PostRace);
        router.get('/tracks/', guard, new StatsController().ListTracks);
        router.get('/tracks/:id/races', guard, new StatsController().ListRacesByTrackId);
        app.use('/stats', router);
    }

    async PostLap(req: Request, res: Response, next: NextFunction) {
        const user: iUser = req.user as iUser;
        if (user && user.id) {
            const lap: iLap = {
                userId: user.id,
                track: req.body.track,
                time: req.body.time,
                lap: req.body.lap,
                race: req.body.race
            }

            const result = await StatsLogic.getInstance().postLap(lap);
            return res.status(result.status).json(result.data);
        } else {
            res.status(403).json({ "message": "You must be authentified to post laptimes" });
        }

    }

    async PostRace(req: Request, res: Response, next: NextFunction) {
        const user: iUser = req.user as iUser;
        if (user && user.id) {
            const race: iRace = {
                track: req.body.track,
                position: req.body.position,
                time: req.body.time,
                userId: user.id,
                uuid: req.body.uuid
            }
            const result = await StatsLogic.getInstance().postRace(race);
            return res.status(result.status).json(result.data);
        } else {
            res.status(403).json({ "message": "You must be authentified to post races" });
        }

    }

    async ListTracks(req: Request, res: Response) {
        const result = await StatsLogic.getInstance().listTracks();
        return res.status(200).json(result.data);
    }

    async listBestLaps(req: Request, res: Response) {
        let id: number = 0;
        if (parseInt(req.params['userId'])) {
            id = parseInt(req.params['userId'])
        }
        const result = await StatsLogic.getInstance().listBestLaps(id);
        return res.status(200).json(result.data);
    }

    async ListRacesByTrackId(req: Request, res: Response) {
        let id = parseInt(req.params['id']);
        const user: iUser = req.user as iUser;
        if (user && user.id) {
            const result = await StatsLogic.getInstance().listUserRacesByTrackId(user.id, id);
            return res.status(200).json(result.data);
        } else {
            res.status(403).json({ "message": "You must be authentified to get races" });
        }
    }

}