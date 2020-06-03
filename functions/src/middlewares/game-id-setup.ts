import { v1 as uuidv1 } from 'uuid';
import { TelegrafContext } from 'telegraf/typings/context';
import { Context } from '../types/telegraf';

async function gameIdSetup(context: TelegrafContext, next: any) {
  console.log('LLego el mensaje');
  const ctx = context as Context;
  if (ctx.message !== undefined) {
    const message = ctx.message.text;
    const initResults = /\/start@ppt/g.exec(message!);
    if (initResults !== null) {
      ctx.state.gameId = uuidv1();
      return next();
    } else {
      console.log('Mensaje desconocido');
      console.log(ctx);
      ctx.reply('');
    }
  } else if (ctx.updateType === 'callback_query') {
    const message = ctx.update.callback_query!.data;
    const generalResults = /(\S+) (\S+)/g.exec(message!);
    if (generalResults !== null) {
      ctx.state.gameId = generalResults[2];
      return next();
    } else {
      console.log('en el callback llego terror');
      ctx.reply('Operacion desconocida');
    }
  } else {
    console.log('Last Else');
    console.log(ctx);
    ctx.reply('');
  }

  return next();
}

export default gameIdSetup;
