import { Router, Request, NextFunction, Response } from 'express';
import { StatsLogic } from '../core/stats/stats.logic';
import { iLap } from '../core/stats/iLap';
import { iRace } from '../core/stats/iRace';
import { guard } from '../core/auth/guard';
import { iUser } from '../core/user/iUser';
import { key } from '../core/auth/key';

export class StatsController {

    public static create(app: Router) {
        const router: Router = Router();
        router.post('/laps/', key, guard, new StatsController().PostLap);
        router.post('/races/', key, guard, new StatsController().PostRace);
        router.get('/laps/best/:userId', new StatsController().listBestLaps)
        router.post('/tracks/:id/best-laps-history/:userId', new StatsController().ListBestLapsHistory);
        router.post('/events/:id/races/', new StatsController().ListRacesByDate);
        router.get('/tracks/', new StatsController().ListTracks);
        router.get('/tracks/:id', new StatsController().GetTrack);
        router.get('/tracks/:id/users/:userId/races', guard, new StatsController().ListRacesByTrackId);
        router.get('/tracks/:id/rankings', new StatsController().TrackRanking)
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

    async GetTrack(req: Request, res: Response) {
        let trackId = parseInt(req.params['id']) || 0;
        const result = await StatsLogic.getInstance().getTrack(trackId);
        return res.status(200).json(result.data);
    }

    async TrackRanking(req: Request, res: Response) {
        let track = parseInt(req.params['id']) || 0;
        let pageSize = 8;
        let pageIndex = 0;
        if (req.query.pageSize) {
            pageSize = parseInt(req.query.pageSize.toString()) || 8;
        }
        if (req.query.pageIndex) {
            pageIndex = parseInt(req.query.pageIndex.toString()) || 0;
        }

        const result = await StatsLogic.getInstance().trackRanking(track, pageSize, pageIndex);
        return res.status(200).json(result.data);
    }

    async ListRacesByDate(req: Request, res: Response) {
        const id = req.params['id'] || 0;
        const startDate = req.body.start || '';
        const endDate = req.body.end || '';
        const users = req.body.users || [];
        const result = await StatsLogic.getInstance().listRacesByDate(startDate, endDate, users);
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

    async ListBestLapsHistory(req: Request, res: Response) {
        let id: number = 0;
        let duration: number = 30;
        let track = req.params['id'] || '';

        if (parseInt(req.params['userId'])) {
            id = parseInt(req.params['userId'])
        }

        if (parseInt(req.body.duration)) {
            duration = parseInt(req.body.duration)
        }

        const result = await StatsLogic.getInstance().listBestLapsHistory(track, duration, id);
        return res.status(200).json(result.data);
    }

    async ListRacesByTrackId(req: Request, res: Response) {
        let id = parseInt(req.params['id']);
        let userId = parseInt(req.params['userId']);
        const result = await StatsLogic.getInstance().listUserRacesByTrackId(userId, id);
        return res.status(200).json(result.data);

    }

}