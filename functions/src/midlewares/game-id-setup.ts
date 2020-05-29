import { v1 as uuidv1 } from 'uuid';
import { TelegrafContext } from 'telegraf/typings/context';
import { Context } from '../types/telegraf';

async function gameIdSetup(context: TelegrafContext, next: any) {
  const ctx = context as Context;
  if (ctx.message !== undefined) {
    const message = ctx.message.text;
    const initResults = /\/start@rps/g.exec(message!);
    if (initResults !== null) {
      ctx.state.gameId = uuidv1();
    } else {
      ctx.reply('Operacion desconocida');
    }
  } else if (ctx.updateType === 'callback_query') {
    const message = ctx.update.callback_query!.data;
    const generalResults = /(\S+) (\S+)/g.exec(message!);
    if (generalResults !== null) {
      ctx.state.gameId = generalResults[2];
    } else {
      ctx.reply('Operacion desconocida');
    }
  } else {
    ctx.reply('Operacion desconocida');
  }

  return next();
}

export default gameIdSetup;
