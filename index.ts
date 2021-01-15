import { config } from 'dotenv';
config();

import * as express from 'express';
import { Application } from 'express';
import * as bodyParser from 'body-parser';
import { MainRouter } from './routes';
import { BaseRepo } from './utils/base.repo';

import * as swaggerUi from 'swagger-ui-express';
import * as swaggerDocument from './swagger.json';

const App: Application = express();

App.use(bodyParser.json({limit: '5mb'}));
App.use('/', MainRouter);
App.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT: Number = parseInt(process.env.APP_PORT || '3000');

BaseRepo.getInstance().connect()
    .then(async (response) => {
        if (response) {
            const server = App.listen(PORT, () => {
                console.log('HTTP PORT:  ' + PORT);
            });
        }
    });

process.on('SIGTERM', () => {
    console.log('SIGTERM');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT');
    process.exit(0);
});