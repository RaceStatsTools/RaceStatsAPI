import * as passport from 'passport';
import { Router } from 'express';

import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { StatsController } from './stats.controller';

const App: Router = Router();

App.use(passport.initialize());
AuthController.create(App);
UserController.create(App);
StatsController.create(App);

export const MainRouter: Router = App;