import * as functions from 'firebase-functions';
import { promisify } from 'util';
import { Telegraf, Extra } from 'telegraf';
import { v1 as uuidv1 } from 'uuid';
import redis from 'redis';

import config from './config';
import { TelegrafContext } from 'telegraf/typings/context';

const bot = new Telegraf(config.bot.token);

enum Options {
  Stone = 'Stone',
  Paper = 'Paper',
  Scissors = 'Scissors',
}

const redisClient = redis.createClient({
  host: config.redis.host,
  password: config.redis.password,
  port: config.redis.port,
});

const hset = promisify(redisClient.hset).bind(redisClient);
const hget = promisify(redisClient.hget).bind(redisClient);
const hincrBy = promisify(redisClient.hincrby).bind(redisClient);
const hgetAll = promisify(redisClient.hgetall).bind(redisClient);

bot.command('init', async (ctx) => {
  const user = ctx.from?.username;
  const gameId = uuidv1();

  await hset(gameId, 'user1', user!);
  await hset(gameId, 'configured', 'false');

  return ctx.reply(
    `<b>${user}</b> desea jugar a piedra papel y tijera`,
    Extra.HTML().markup((m: any) =>
      m.inlineKeyboard([
        m.callbackButton('Aceptar Duelo', `init_fight ${gameId} ${user}`),
      ])
    )
  );
});

bot.action(/init_fight (.+) (.+)/, async (ctx) => {
  await ctx.answerCbQuery();

  const user2 = ctx.from?.username;
  const gameId = ctx.match![1];
  const user1 = ctx.match![2];

  await hset(gameId, 'user2', user2!);
  await hset(gameId, 'configured', 'true');
  await hset(gameId, 'plays', '0');

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

type HashData = {
  user1: string;
  user1Choice: Options;
  user2: string;
  user2Choice: string;
};

async function getResults(gameId: string): Promise<string> {
  const { user1, user2, user1Choice, user2Choice } = <HashData>(
    await hgetAll(gameId)
  );
  const game = `${user1Choice}-${user2Choice}`;

  switch (game) {
    case `${Options.Stone}-${Options.Scissors}`:
    case `${Options.Scissors}-${Options.Paper}`:
    case `${Options.Paper}-${Options.Stone}`:
      return `Ganador ${user1} - Perdedor ${user2}\n${game}`;
    case `${Options.Stone}-${Options.Paper}`:
    case `${Options.Scissors}-${Options.Stone}`:
    case `${Options.Paper}-${Options.Scissors}`:
      return `Perdedor ${user1} - Ganador ${user2}\n${game}`;
    default:
      return `Empate\n${game}`;
  }
}

async function runPlay(gameId: string, ctx: TelegrafContext) {
  await hincrBy(gameId, 'plays', 1);
  const plays = await hget(gameId, 'plays');
  if (plays === '2') {
    const results = await getResults(gameId);
    await ctx.reply(results);
    redisClient.del(gameId, (err) => {
      if (err) {
        console.log('Error deleting a key');
        console.log(err);
      } else {
        console.log('Key delete correctly');
      }
    });
  } else {
    await ctx.answerCbQuery('Esperando que juege el otro jugador');
  }
}

function processChoice(choice: Options) {
  return async function (ctx: TelegrafContext) {
    await ctx.answerCbQuery();

    const gameId = ctx.match![1];
    const user = ctx.from?.username;

    if (user === (await hget(gameId, 'user1'))) {
      await hset(gameId, 'user1Choice', choice);
      runPlay(gameId, ctx);
    } else if (user === (await hget(gameId, 'user2'))) {
      await hset(gameId, 'user2Choice', choice);
      runPlay(gameId, ctx);
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
    res.status(200);
  }
});
