import * as jwt from 'jsonwebtoken';
import { NextFunction, Response } from "express";
import { iUser } from '../user/iUser';

/**
 * http(s) middleware guard
 * @param {e.Request} req
 * @param {e.Response} res
 * @param {e.NextFunction} next
 * @returns {Response}
 */
export const guard = (req: any, res: Response, next: NextFunction) => {
  const token = req.headers['authorization'];
  const APPLICATION_SECRET = process.env.SESSION_SECRET || '';

  if (token) {
    jwt.verify(token.toString(), APPLICATION_SECRET, async (err: any, user: any) => {

      if (err) {
        console.error(err);
        return res.status(403).send({ success: false, message: 'Failed to authenticate token.' });
      }

      let myUser: iUser = {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      };

      req.user = myUser;
      next();

    });
  } else {
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });
  }
};