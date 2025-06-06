import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomList extends Document {
  name: string;
  userId: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomListSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  color: {
    type: String,
    default: '#6366f1' // 默认蓝色
  },
  icon: {
    type: String,
    default: 'list' // 默认列表图标
  }
}, {
  timestamps: true
});

// 创建复合索引
CustomListSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<ICustomList>('CustomList', CustomListSchema);
