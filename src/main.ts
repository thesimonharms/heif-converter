import { join } from 'node:path';
import {
  Application,
  BroadcastServiceProvider,
  CacheServiceProvider,
  ConfigRepository,
  ConfigServiceProvider,
  LocaleServiceProvider,
  LogServiceProvider,
  DatabaseServiceProvider,
  EventServiceProvider,
  HttpKernel,
  MailServiceProvider,
  NotificationServiceProvider,
  QueueServiceProvider,
  StorageServiceProvider,
  prepareHttpServer,
  setBroadcastApplication,
  setCacheApplication,
  setEventApplication,
  setLangApplication,
  setUrlApplication,
  setLogApplication,
  setMailApplication,
  setNotificationApplication,
  setQueueApplication,
  setRouteApplication,
  setStorageApplication,
  setViewApplication,
  ViewServiceProvider,
  serve,
} from '@pondoknusa/core';
import { AppServiceProvider } from './providers/app-service-provider.js';

const appRoot = join(import.meta.dirname, '..');
const app = new Application(appRoot);

setRouteApplication(app);
setLangApplication(app);
setUrlApplication(app);
setViewApplication(app);
setQueueApplication(app);
setEventApplication(app);
setBroadcastApplication(app);
setCacheApplication(app);
setStorageApplication(app);
setLogApplication(app);
setMailApplication(app);
setNotificationApplication(app);

app.register(ConfigServiceProvider);
app.register(DatabaseServiceProvider);
app.register(CacheServiceProvider);
app.register(StorageServiceProvider);
app.register(LogServiceProvider);
app.register(MailServiceProvider);
app.register(NotificationServiceProvider);
app.register(QueueServiceProvider);
app.register(EventServiceProvider);
app.register(BroadcastServiceProvider);
app.register(ViewServiceProvider);
app.register(LocaleServiceProvider);
app.register(AppServiceProvider);

await app.boot();

const { registerRoutes, registerChannels } = await import('./routes/index.js');
registerChannels();
registerRoutes();

await prepareHttpServer(app, app.make(ConfigRepository));

const kernel = new HttpKernel(app);
await serve(kernel);
