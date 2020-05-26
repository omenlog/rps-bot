import * as functions from 'firebase-functions';
import devConfig from '../env.json';

type Config = {
    bot:{
        key: string
    },
    redis:{
        host: string,
        password: string,
        port: number
    }
}

let config: Config;

if(process.env.NODE_ENV === 'production'){
    config = <Config>functions.config();
}
else{
    config = devConfig;
}


export default config;