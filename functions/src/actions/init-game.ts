import { Context } from 'types/telegraf';
import { Extra } from 'telegraf';

async function initGame(context: any) {
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
}

export default initGame;
