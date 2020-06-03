export enum Options {
  Stone = 'Stone',
  Paper = 'Paper',
  Scissors = 'Scissors',
}

export type GameData = {
  user1: string;
  user1Choice: Options;
  user2: string;
  user2Choice: string;
};

export type Config = {
  bot: {
    token: string;
  };
  redis: {
    host: string;
    password: string;
    port: number;
    ttl: number;
  };
  images: {
    initial: string;
  };
};
