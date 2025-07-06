// @ts-nocheck
import 'reflect-metadata';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { AppDataSource } from '../backend/src/data-source';
import MongoUser from '../backend/src/models/User';
import MongoTodo from '../backend/src/models/Todo';
import { User } from '../backend/src/entities/User';
import { Todo } from '../backend/src/entities/Todo';

dotenv.config();

async function migrate() {
  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/todolist';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // Connect to MySQL
  await AppDataSource.initialize();
  console.log('Connected to MySQL');

  const userRepo = AppDataSource.getRepository(User);
  const todoRepo = AppDataSource.getRepository(Todo);

  // Migrate users
  const mongoUsers = await MongoUser.find().lean();
  console.log(`Found ${mongoUsers.length} users in MongoDB`);

  for (const mu of mongoUsers) {
    const existing = await userRepo.findOne({ where: { email: mu.email } });
    if (!existing) {
      const u = userRepo.create({
        username: mu.username,
        email: mu.email,
        password: mu.password, // already hashed
      });
      await userRepo.save(u);
    }
  }
  console.log('Users migration complete');

  // Migrate todos
  const mongoTodos = await MongoTodo.find().lean();
  console.log(`Found ${mongoTodos.length} todos in MongoDB`);

  for (const mt of mongoTodos) {
    const t = todoRepo.create({
      title: mt.title,
      description: mt.description,
      dueDate: mt.dueDate,
      status: mt.status as 'pending' | 'completed',
      priority: mt.priority as 'low' | 'medium' | 'high',
      xmlContent: mt.xmlContent,
      isAIGenerated: mt.isAIGenerated,
      userId: mt.user.toString(),
    });
    await todoRepo.save(t);
  }
  console.log('Todos migration complete');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});