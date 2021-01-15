import { UserLogic } from '../user/user.logic';
import { Request, Response, NextFunction } from 'express';

export class AuthService {

    private static _instance: AuthService;

    /**
     * Singleton
     */
    static getInstance(): AuthService {
        if (this._instance === undefined) {
            this._instance = new AuthService();
        }
        return this._instance;
    }

    constructor() {
    }

    async login(email: String): Promise<any> {
        let user = await UserLogic.getInstance().getByEmail(email);
        return user;
    }
}