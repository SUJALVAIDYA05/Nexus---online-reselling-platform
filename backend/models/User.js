const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // excluded from queries by default
    },
    phone: {
      type: String,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// --- Pre-save hook: hash password when new or modified ---
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// --- Instance method: compare a candidate password ---
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// --- Strip password and __v from JSON output ---
userSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
