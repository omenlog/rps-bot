import 'module-alias/register';
import * as functions from 'firebase-functions';
import { Telegraf } from 'telegraf';

import config from '@bot/config';
import { gameIdSetup, redisSession } from '@bot/middlewares';
import { Options } from '@bot/types';

import { startCommand } from '@bot/commands';
import { initGame } from '@bot/actions';
import { processChoice } from '@bot/utils';

const bot = new Telegraf(config.bot.token);

bot.use(gameIdSetup);
bot.use(redisSession);

bot.command('start@ppt', startCommand);

bot.action(/init_game (.+)/, initGame);
bot.action(/stone (.+)/, processChoice(Options.Stone));
bot.action(/scissor (.+)/, processChoice(Options.Scissors));
bot.action(/paper (.+)/, processChoice(Options.Paper));

bot.catch((err: any, ctx: any) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
  ctx.reply('');
});

if (process.env.NODE_ENV !== 'production') {
  bot.launch();
}

export const rps = functions.https.onRequest(async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).end();
  } catch (error) {
    console.log('Error');
    console.log(error);
    res.status(200).end();
  }
});
