import { join } from 'node:path';
import {
  Application,
  BroadcastServiceProvider,
  CacheServiceProvider,
  ConfigServiceProvider,
  DatabaseServiceProvider,
  EventServiceProvider,
  LocaleServiceProvider,
  LogServiceProvider,
  MailServiceProvider,
  NotificationServiceProvider,
  QueueServiceProvider,
  StorageServiceProvider,
  ViewServiceProvider,
  setBroadcastApplication,
  setCacheApplication,
  setEventApplication,
  setLangApplication,
  setLogApplication,
  setMailApplication,
  setNotificationApplication,
  setQueueApplication,
  setRouteApplication,
  setStorageApplication,
  setUrlApplication,
  setViewApplication,
} from '@pondoknusa/core';
import {
  TestCase,
  createHttpKernel,
  createTestingMiddleware,
  wireFacades,
  HttpTestClient,
} from '@pondoknusa/testing';
import { AppServiceProvider } from '../../src/providers/app-service-provider.js';

export class AppTestCase extends TestCase {
  protected createApplication(): Application {
    return new Application(join(import.meta.dirname, '../..'));
  }

  protected override providers() {
    return [
      ConfigServiceProvider,
      DatabaseServiceProvider,
      CacheServiceProvider,
      StorageServiceProvider,
      LogServiceProvider,
      MailServiceProvider,
      NotificationServiceProvider,
      QueueServiceProvider,
      EventServiceProvider,
      BroadcastServiceProvider,
      ViewServiceProvider,
      LocaleServiceProvider,
      AppServiceProvider,
    ];
  }

  override async setUp(): Promise<void> {
    process.env.APP_KEY ??= 'test-app-key-heif-converter-000000000000';
    process.env.APP_NAME = 'HEIF Converter';
    process.env.DB_CONNECTION = 'sqlite';
    process.env.DB_DATABASE = ':memory:';
    process.env.QUEUE_CONNECTION = 'database';
    process.env.CACHE_STORE = 'array';
    process.env.MAIL_MAILER = 'array';

    this.app = await this.createApplication();
    this.app.use(createTestingMiddleware());

    for (const Provider of this.providers()) {
      this.app.register(Provider);
    }

    setRouteApplication(this.app);
    setViewApplication(this.app);
    setQueueApplication(this.app);
    setEventApplication(this.app);
    setCacheApplication(this.app);
    setBroadcastApplication(this.app);
    setMailApplication(this.app);
    setNotificationApplication(this.app);
    setStorageApplication(this.app);
    setLogApplication(this.app);
    setLangApplication(this.app);
    setUrlApplication(this.app);

    await this.app.boot();

    const { registerRoutes } = await import('../../src/routes/index.js');
    registerRoutes();

    wireFacades(this.app);
    this.kernel = createHttpKernel(this.app);
    this.http = new HttpTestClient(this.kernel);
  }
}
