import * as passport from 'passport';
import { Router } from 'express';

import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { LaptimeController } from './laptime.controller';

const App: Router = Router();

App.use(passport.initialize());
AuthController.create(App);
UserController.create(App);
LaptimeController.create(App);

export const MainRouter: Router = App;