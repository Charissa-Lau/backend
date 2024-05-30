import config from './config.json';

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

export const SERVER = `http://${HOST}:${PORT}`;
