import * as Joi from 'joi';
export declare const configValidationSchema: Joi.ObjectSchema<any>;
export declare const configuration: () => {
    database: {
        url: string | undefined;
    };
    jwt: {
        secret: string | undefined;
        expiresIn: string | undefined;
    };
    port: number;
    stripe: {
        secretKey: string | undefined;
        webhookSecret: string | undefined;
    };
    smtp: {
        host: string | undefined;
        port: number;
        user: string | undefined;
        pass: string | undefined;
        from: string | undefined;
    };
    pharmacy: {
        name: string;
        address: string;
    };
};
