import { ServiceProvider } from '@pondoknusa/core';

export class AppServiceProvider extends ServiceProvider {
  override async register() {
    this.app.instance('app.name', 'HEIF Converter');
  }
}
