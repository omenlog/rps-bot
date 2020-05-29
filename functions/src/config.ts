import * as functions from 'firebase-functions';
import devConfig from '../etc/config.json';
import { Config } from './types/game';

let config: Config;

if (process.env.NODE_ENV === 'production') {
  config = <Config>functions.config();
} else {
  config = devConfig as any;
}

export default config;
