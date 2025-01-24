import 'colors';
import cookieSession from 'cookie-session';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import passport from 'passport';
import { env, validateEnv } from './config/env.config';
import { NotFoundException } from './lib/exceptions';
import { devConsole, sessionOptions } from './lib/utils';
import { handleErrorRequest } from './middlewares/handle-error-request';
import { handleSessionRegenerate } from './middlewares/handle-session-regenerate';
import { openApiSpecs, serveApiReference } from './openapi';
import { GoogleStrategy } from './passport/google.strategy';
import { LocalStrategy } from './passport/local.strategy';
import { serializer } from './passport/serializer';
import { authRoute } from './routes/auth.route';
import { notificationsRoute } from './routes/notifications.route';
import { usersRoute } from './routes/users.route';

const app = express();
validateEnv();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (env.NODE_ENV === 'development') {
  app.use(morgan('common'));
}
app.use(cors({ origin: env.FRONTEND_URLS, credentials: true }));
app.enable('trust proxy');
app.use(cookieSession(sessionOptions));
app.use(handleSessionRegenerate);
app.use(passport.initialize());
app.use(passport.session());

passport.use('google', GoogleStrategy);
passport.use('local', LocalStrategy);
serializer();

app.get('/', async (req, res) => {
  res.json({
    message: 'Api is running fine...',
    env: env.NODE_ENV,
    date: new Date().toISOString()
  });
});

/* --------- routes --------- */
app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/notifications', notificationsRoute);
app.get('/doc', (req, res) => {
  res.json(openApiSpecs);
});
app.get('/reference', serveApiReference);
app.use(async () => {
  throw new NotFoundException();
});
app.use(handleErrorRequest);

app.listen(env.PORT, () => {
  devConsole(`⚡[Server]: listening at http://localhost:${env.PORT}`.yellow);
});

export default app;
