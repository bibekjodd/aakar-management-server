import { apiReference } from '@scalar/express-api-reference';
import packageJson from 'package.json';
import { createDocument } from 'zod-openapi';
import { assignmentsDoc } from './assignments.doc';
import { authDoc } from './auth.doc';
import { defaultDoc } from './default.doc';
import { notificationsDoc } from './notifications.doc';
import { usersDoc } from './users.doc';

export const openApiSpecs = createDocument({
  info: {
    title: 'Aakar Management',
    version: packageJson.version,
    description: 'Express server with scalar for openapi documentation'
  },
  openapi: '3.1.0',
  paths: {
    ...defaultDoc,
    ...authDoc,
    ...usersDoc,
    ...assignmentsDoc,
    ...notificationsDoc
  }
});

export const serveApiReference = apiReference({
  spec: { content: openApiSpecs },
  theme: 'kepler',
  darkMode: true,
  layout: 'modern',
  defaultHttpClient: {
    targetKey: 'javascript',
    clientKey: 'fetch'
  },
  metaData: {
    title: 'Aakar Management Server Api Reference'
  }
});
