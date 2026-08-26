import { Broadcast } from '@pondoknusa/core';

export function registerChannels(): void {
  Broadcast.channel('orders', () => true);
}
