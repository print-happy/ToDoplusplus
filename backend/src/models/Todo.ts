import mongoose from 'mongoose';

export interface ITodo extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  xmlContent: string;
  customListId?: mongoose.Types.ObjectId;
}

const todoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  xmlContent: {
    type: String,
    required: true
  },
  customListId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomList',
    required: false
  }
}, {
  timestamps: true
});

// 索引
todoSchema.index({ user: 1, dueDate: 1 });
todoSchema.index({ status: 1 });

export default mongoose.model<ITodo>('Todo', todoSchema); 