//@ts-check

import Joi = require("joi");

export class BodyValidator{
    private static _instance: BodyValidator

    static getInstance(): BodyValidator {
        if (this._instance === undefined) {
          this._instance = new BodyValidator();
        }
        return this._instance;
      }

    constructor() {

    }

    validateRegisterRoute(data: any) {
        const schema = Joi.object({
            email: Joi.string()
                .email()
                .required(),
        
            password: Joi.string()
                .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
                .required(),
            
            nickname: Joi.string()
                .alphanum()
                .min(3)
                .max(30)
                .required(),

            country: Joi.string()
                .required(),
        });

        const { error, value } = schema.validate(data);
        return error ? error.details.map((item: { message: any; }) => item.message) : null;
    }

    validateLoginRoute(data: any) {
        const schema = Joi.object({
            email: Joi.string()
                .email()
                .required(),
        
            password: Joi.string()
                .required(),
        });

        const { error, value } = schema.validate(data);
        return error ? error.details.map((item: { message: any; }) => item.message) : null;
    }
}
