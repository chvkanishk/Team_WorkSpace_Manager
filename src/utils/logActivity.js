const ActivityLog = require('../models/activityLog.model');

const logActivity = async (teamId, userId, action, details = {}) => {
  try {
    await ActivityLog.create({
      team: teamId,
      user: userId,
      action,
      details
    });
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
};

module.exports = logActivity;
