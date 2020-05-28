import RedisSession from 'telegraf-session-redis';
import config from '../config';

const redisSession = new RedisSession({
  store: {
    host: config.redis.host,
    password: config.redis.password,
    port: config.redis.port,
  },
  ttl: 60,
  getSessionKey: (ctx) => ctx.state.gameId,
});

export default redisSession;
