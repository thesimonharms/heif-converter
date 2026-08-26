import { Route } from '@pondoknusa/core';
import { ConvertController } from '../controllers/convert-controller.js';

export function registerWebRoutes(): void {
  Route.get('/', [ConvertController, 'index']).name('home');
  Route.post('/api/convert', [ConvertController, 'convert']).name('convert');
}
