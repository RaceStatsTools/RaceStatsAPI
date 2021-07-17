import { Router, Request, Response, NextFunction } from "express";
import { guard } from "../core/auth/guard";
import { UserLogic } from "../core/user/user.logic";
import { iUser } from "../core/user/iUser";
import { BodyValidator } from "./body.validator";
import { ValidationError } from "joi";
import Joi = require("joi");

export class UserController {

  public static create(app: Router) {
    const router: Router = Router({ mergeParams: true });

    app.use('/users/', router);
    router.get('/me', guard, new UserController().GetMe);
    router.get('/:userId', new UserController().GetById);
    router.get('/nickname/:nickname', new UserController().GetByNickname);
    router.put('/:userId', new UserController().Update);
    router.post('/', new UserController().Create);
  }

  constructor() {

  }

  async GetMe(req: Request, res: Response, next: NextFunction) {
    const user: iUser = req.user as iUser;
    let result = await UserLogic.getInstance().getById(user.id.toString());
    return res.status(result.status).json(result.data);
  }

  async GetById(req: Request, res: Response, next: NextFunction) {
    let userId = req.params.userId;
    let result = await UserLogic.getInstance().getById(userId);
    return res.status(result.status).json(result.data);
  }

  async GetByNickname(req: Request, res: Response, next: NextFunction) {
    let nickname = req.params.nickname;
    let result = await UserLogic.getInstance().getByNickname(nickname);
    return res.status(result.status).json(result.data);
  }

  async Update(req: Request, res: Response, next: NextFunction) {

    let userId = req.params.userId;
    let user: iUser = req.body;

    let result = await UserLogic.getInstance().update(userId, user);

    if (user.password) {
      await UserLogic.getInstance().setPassword(userId, user.password);
    }

    return res.status(result.status).json(result.data);

  }

  async Create(req: Request, res: Response, next: NextFunction) {

    let user: iUser = req.body;
    let error:any = BodyValidator.getInstance().validateRegisterRoute(user)
    console.log(error)
    if (error) {
      return res.status(400).json(error);
    } else {
      // Check if email is already present
      let existingUser = await UserLogic.getInstance().getByEmail(user.email);
      if (existingUser) {
        return res.status(409).json({ "message": "User with this email already exists" });
      }
      let existingNickname = await UserLogic.getInstance().getNicknameExists(user.nickname);
      if (existingNickname) {
        return res.status(409).json({ "message": "User with this nickname already exists" });
      }

      let result = await UserLogic.getInstance().create(user);
      if (result.status !== 201) {
        return res.status(result.status).json(result.data);
      }

      let createdUser: iUser = result.data;
      if (user.password) {
        await UserLogic.getInstance().setPassword(createdUser.id.toString(), user.password);
      }
      return res.status(result.status).json(result.data);

    }
  }

}