import * as passport from 'passport';
import * as localStrategy from 'passport-local';
import * as crypto from 'crypto'
import * as JWT from 'jsonwebtoken'
import { AuthService } from '../core/auth/auth.service'
import { Router, Request, Response, NextFunction } from 'express';
import { BodyValidator } from './body.validator';

export class AuthController {

    public static create(router: Router) {
        router.post('/auth/', new AuthController().Post);
    }

    strategyOptions!: localStrategy.IStrategyOptions
    strategy!: localStrategy.Strategy;

    constructor() {
        this.strategyOptions = {
            usernameField: 'email',
            passwordField: 'password'
        }
        this.strategy = new localStrategy.Strategy(this.strategyOptions, this.verify.bind(this));
        passport.use(this.strategy);
    }

    async verify(username: String, password: string, done: Function): Promise<any> {
        let foundUser = await AuthService.getInstance().login(username);

        if (!foundUser) {
            return done({ "message": "No user with this email" });
        }

        let samePassword = this.validatePassword(password, foundUser.salt, foundUser.passwordhash);
        if (!samePassword) {
            return done({ "message": "Invalid password" });
        }

        return done(false, foundUser, null);
    }

    validatePassword(password: string, passwordsalt: string, passwordHash: String): boolean {
        if (!passport || !passwordsalt || !passwordHash) {
            return false;
        }

        var salt = Buffer.from(passwordsalt, 'base64');
        let encryptedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha1').toString('base64');
        return passwordHash === encryptedPassword;
    }


    async Post(req: Request, res: Response, next: NextFunction) {
        let user = req.body;
        let error: any = BodyValidator.getInstance().validateLoginRoute(user)

        if (error) {
            return res.status(400).json(error);
        } else {

            return passport.authenticate('local', (err: Error, User: any, Info: any) => {
                if (err) {
                    return res.status(400).json(err);
                }

                if (!User) {
                    return res.status(400).end();
                }

                let sessionSecret: any = process.env.SESSION_SECRET;
                let sessionTimeout: any = process.env.SESSION_TIMEOUT;

                let token = JWT.sign({ id: User.id, email: User.email, nickname: User.nickname }, sessionSecret, { expiresIn: '300d' });

                let response: any = {
                    token: token,
                    duration: sessionTimeout
                }

                return res.status(200).json(response);

            })(req, res, next);
        }
    }
}