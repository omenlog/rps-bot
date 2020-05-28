import * as functions from 'firebase-functions';
import { Telegraf, Extra } from 'telegraf';
import { TelegrafContext } from 'telegraf/typings/context';

import config from './config';
import { gameIdSetup, redisSession } from './midlewares';
import { Options, GameData } from './types/game';
import { Context } from './types/telegraf';

const bot = new Telegraf(config.bot.token);

bot.use(gameIdSetup);
bot.use(redisSession);

bot.command('init', async (context) => {
  const ctx = context as Context;
  const user = ctx.from?.username;

  ctx.session = {
    user1: user,
    configured: false,
  };

  return ctx.reply(
    `<b>${user}</b> desea jugar a piedra papel y tijera`,
    Extra.HTML().markup((m: any) =>
      m.inlineKeyboard([
        m.callbackButton(
          'Aceptar Duelo',
          `init_fight ${ctx.state.gameId} ${user}`
        ),
      ])
    )
  );
});

bot.action(/init_fight (.+) (.+)/, async (context) => {
  const ctx = context as Context;
  await ctx.answerCbQuery();

  const user2 = ctx.from?.username;
  const user1 = ctx.match![2];

  ctx.session.user2 = user2;
  ctx.session.configured = true;
  ctx.session.plays = 0;

  const gameId = ctx.state.gameId;

  return ctx.reply(
    `<b>${user2} ha aceptado jugar con ${user1}</b>`,
    Extra.HTML().markup((m: any) =>
      m.inlineKeyboard([
        m.callbackButton('Piedra', `stone ${gameId}`),
        m.callbackButton('Papel', `paper ${gameId}`),
        m.callbackButton('Tijera', `scissor ${gameId}`),
      ])
    )
  );
});

async function getResults(game: GameData): Promise<string> {
  const { user1, user2, user1Choice, user2Choice } = game;
  const gameString = `${user1Choice}-${user2Choice}`;

  switch (gameString) {
    case `${Options.Stone}-${Options.Scissors}`:
    case `${Options.Scissors}-${Options.Paper}`:
    case `${Options.Paper}-${Options.Stone}`:
      return `Ganador ${user1} - Perdedor ${user2}\n${game.user1Choice} - ${game.user2Choice}`;
    case `${Options.Stone}-${Options.Paper}`:
    case `${Options.Scissors}-${Options.Stone}`:
    case `${Options.Paper}-${Options.Scissors}`:
      return `Perdedor ${user1} - Ganador ${user2}\n${game.user1Choice} - ${game.user2Choice}`;
    default:
      return `Empate\n${gameString}`;
  }
}

async function runPlay(ctx: Context) {
  ctx.session.plays++;
  const { plays } = ctx.session;
  if (plays === 2) {
    const results = await getResults(ctx.session as GameData);
    await ctx.reply(results);
    /* destroying data */
  } else {
    await ctx.answerCbQuery('Esperando que juege el otro jugador');
  }
}

function processChoice(choice: Options) {
  return async function (context: TelegrafContext) {
    const ctx = context as Context;
    await ctx.answerCbQuery();

    const user = ctx.from?.username;

    if (user === ctx.session.user1) {
      ctx.session.user1Choice = choice;
      runPlay(ctx);
    } else if (user === ctx.session.user2) {
      ctx.session.user2Choice = choice;
      runPlay(ctx);
    } else {
      await ctx.answerCbQuery('No estas permitido en este juego');
    }
  };
}

bot.action(/stone (.+)/, processChoice(Options.Stone));
bot.action(/scissor (.+)/, processChoice(Options.Scissors));
bot.action(/paper (.+)/, processChoice(Options.Paper));

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
