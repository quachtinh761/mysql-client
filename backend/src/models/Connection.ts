import mongoose, { Schema, Document } from 'mongoose';

export interface IConnection extends Document {
  userId: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password: string; // AES encrypted
  database?: string;
  createdAt: Date;
}

const ConnectionSchema = new Schema<IConnection>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  host: { type: String, required: true },
  port: { type: Number, default: 3306 },
  user: { type: String, required: true },
  password: { type: String, required: true },
  database: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IConnection>('Connection', ConnectionSchema);
