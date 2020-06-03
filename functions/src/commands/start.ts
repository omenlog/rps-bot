import config from '@bot/config';
import { Extra } from 'telegraf';

async function startCommand(ctx: any) {
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
          m.callbackButton('Aceptar 😎👊', `init_game ${ctx.state.gameId}`),
        ])
      )
  );
}

export default startCommand;
