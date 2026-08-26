import { Echo, readEchoConfigFromDocument } from '@pondoknusa/echo';

const config = readEchoConfigFromDocument();
if (!config) {
  // Broadcasting is disabled (log/null driver) — @echo renders no client bundle.
} else {
  const echo = new Echo(config);

  if (typeof window !== 'undefined') {
    (window as Window & { Echo?: Echo }).Echo = echo;
  }
}
