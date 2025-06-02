import mongoose from 'mongoose';

// QR Code yang di-generate terlebih dahulu
const QRCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  qrCode: {
    type: String,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  lockerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Locker',
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
}, {
  timestamps: true,
});

const LockerSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  label: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  qrCode: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  lockerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Locker',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index for unique category names per user
CategorySchema.index({ name: 1, userId: 1 }, { unique: true });

export const QRCode = mongoose.models.QRCode || mongoose.model('QRCode', QRCodeSchema);
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Locker = mongoose.models.Locker || mongoose.model('Locker', LockerSchema);
export const Item = mongoose.models.Item || mongoose.model('Item', ItemSchema);
export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
