import { TelegrafContext } from 'telegraf/typings/context';

export type Context = TelegrafContext & {
  session: Record<string, any>;
  state: Record<string, any>;
};
