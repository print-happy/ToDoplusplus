import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Todo } from './entities/Todo';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  entities: [User, Todo],
  synchronize: true, // production: disable this and use migrations
});