import * as functions from 'firebase-functions';
import devConfig from '../etc/config.json';

type Config = {
  bot: {
    token: string;
  };
  redis: {
    host: string;
    password: string;
    port: number;
  };
};

let config: Config;

if (process.env.NODE_ENV === 'production') {
  config = <Config>functions.config();
} else {
  config = devConfig as any;
}

export default config;
