import { TelegrafContext } from 'telegraf/typings/context';
import { Context, Options, GameData } from '@bot/types';

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

export { processChoice };
