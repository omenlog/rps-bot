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

bot.command('start@rps', async (context) => {
  const ctx = context as any;
  const user = ctx.from?.username;

  ctx.session = {
    user1: user,
    configured: false,
  };

  return ctx.replyWithPhoto(
    {
      url: config.images.initial,
      filename: 'pepe',
    },
    Extra.load({ caption: `@${user} desea jugar a piedra papel y tijera` })
      .markdown()
      .markup((m: any) =>
        m.inlineKeyboard([
          m.callbackButton('Aceptar 😎👊', `init_fight ${ctx.state.gameId}`),
        ])
      )
  );
});

bot.action(/init_fight (.+)/, async (context) => {
  const ctx = context as Context;

  if (ctx.session.user1 === undefined) {
    await ctx.answerCbQuery('🙄 este juego caducó , inicia uno nuevo', true);
    return ctx.deleteMessage();
  }

  const user2 = ctx.from?.username;
  if (user2 === ctx.session.user1) {
    return ctx.answerCbQuery('Por el momento no puedes jugar contra ti 😀');
  }

  ctx.session.user2 = user2;
  ctx.session.configured = true;
  ctx.session.plays = 0;

  const gameId = ctx.state.gameId;

  await ctx.deleteMessage();
  return ctx.reply(
    `@${user2} enfrentando a @${ctx.session.user1}`,
    Extra.HTML().markup((m: any) =>
      m.inlineKeyboard([
        m.callbackButton('Piedra 🗿', `stone ${gameId}`),
        m.callbackButton('Papel 🧻', `paper ${gameId}`),
        m.callbackButton('Tijera ✂️', `scissor ${gameId}`),
      ])
    )
  );
});

async function getResults(game: GameData): Promise<string> {
  const { user1, user2, user1Choice, user2Choice } = game;
  const gameString = `${user1Choice}-${user2Choice}`;

  switch (gameString) {
    case `${Options.Stone}-${Options.Scissors}`:
      return `Ganador @${user1} 🗿 - Perdedor @${user2} ✂️`;
    case `${Options.Scissors}-${Options.Paper}`:
      return `Ganador @${user1} ✂️ - Perdedor @${user2} 🧻`;
    case `${Options.Paper}-${Options.Stone}`:
      return `Ganador @${user1} 🧻 - Perdedor ${user2} 🗿`;
    case `${Options.Stone}-${Options.Paper}`:
      return `Ganador @${user2} 🧻 - @${user1} 🗿`;
    case `${Options.Scissors}-${Options.Stone}`:
      return `Ganador @${user2} 🗿 - @${user1} ✂️`;
    case `${Options.Paper}-${Options.Scissors}`:
      return `Ganador @${user2} ✂️ - @${user1} 🧻`;
    case `${Options.Paper}-${Options.Paper}`:
      return `Ambos jugadores empapelados 🧻`;
    case `${Options.Scissors}-${Options.Scissors}`:
      return `Empatados por ✂️`;
    default:
      return `Ambos jugadores se ponen de 🗿`;
  }
}

async function runPlay(ctx: Context) {
  ctx.session.plays++;
  const { plays } = ctx.session;
  if (plays === 2) {
    const results = await getResults(ctx.session as GameData);
    await ctx.editMessageText(results);
  } else {
    await ctx.answerCbQuery('Esperando que juege el otro jugador');
  }
}

function processChoice(choice: Options) {
  return async function (context: TelegrafContext) {
    const ctx = context as Context;

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
