const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true, // Store hashed password
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  console.log('Pre-save hook triggered');

  if (!this.isModified('password')) {
    console.log('Password not modified');
    return;
  }

  try {
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
  } catch (err) {
    console.log('Error in pre-save hook:', err);
    throw err; // Mongoose 8 requires throwing errors, not next(err)
  }
});




module.exports = mongoose.model('User', userSchema);
