import { Router } from 'express';
import { getCurrentUser, loginUser, logoutUser } from './auth-user.controller.js';

export const authUsersRouter = Router();

authUsersRouter.get('/me', getCurrentUser);
authUsersRouter.post('/login', loginUser);
authUsersRouter.post('/logout', logoutUser);
