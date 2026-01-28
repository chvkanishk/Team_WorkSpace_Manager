const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    avatar: { type: String, default: "" },
    visibility: { type: String, enum: ["private", "public"], default: "private" },
    tags: { type: [String], default: [] },

    name: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'member'],
          default: 'member',
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
