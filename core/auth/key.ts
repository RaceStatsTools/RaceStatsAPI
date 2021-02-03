import { NextFunction, Response } from "express";

/**
 * http(s) middleware guard
 * @param {e.Request} req
 * @param {e.Response} res
 * @param {e.NextFunction} next
 * @returns {Response}
 */
export const key = (req: any, res: Response, next: NextFunction) => {
  const key = req.headers['x-api-key'];
  const API_KEY = process.env.API_KEY || null;
  console.log(API_KEY)

  if (API_KEY == key) {
      next();
  } else {
    return res.status(403).send({
      success: false,
      message: 'Not authorized'
    });
  }
};