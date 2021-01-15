import { Router, Request, NextFunction, Response } from 'express';
import { LaptimeLogic } from '../core/laptime/laptime.logic';
import { iLaptime } from '../core/Laptime/ILaptime';
import { guard } from '../core/auth/guard';
import { iUser } from '../core/user/iUser';

export class LaptimeController {

    public static create(app: Router) {
        const router: Router = Router();
        // router.get('/search', guard, new LaptimeController().Search);
        router.get('/:id', guard, new LaptimeController().GetById);
        router.post('/', guard, new LaptimeController().Post);
        app.use('/laptimes', router);
    }

    async GetById(req: Request, res: Response) {
        let id = parseInt(req.params['id']);
        const result = await LaptimeLogic.getInstance().getById(id);
        return res.status(200).json(result.data);
    }

    async Post(req: Request, res: Response, next: NextFunction) {
        const user: iUser = req.user as iUser;
        if (user && user.id) {
            const Laptime: iLaptime = {
                pilot: user.id.toString(),
                track: req.body.track,
                lap_time: req.body.lap_time,
                lap: req.body.lap
            }
            const result = await LaptimeLogic.getInstance().postLaptime(Laptime);
            return res.status(result.status).json(result.data);
        } else {
            res.status(403).json({"message": "You must be authentified to post laptimes"});
        }
        
    }
/*
    async Search(req: Request, res: Response) {
        let requestString = req.query.requestString || '';
        let pageSize = req.query.pageSize || 50;
        let pageIndex = req.query.pageIndex || 0;
        let sortColumn = req.query.sort_column || '';
        let sortDirection = req.query.sort_direction || '';
        let type = req.query.type || '';
        let status = req.query.status || '';
        const result = await LaptimeLogic.getInstance().search(requestString.toString(), type.toString(), status.toString(), pageSize, pageIndex, sortColumn, sortDirection);
        return res.status(200).json(result.data);
    */
}