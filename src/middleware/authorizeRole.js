const Team = require('../models/team.model');

const authorizeRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { teamId } = req.params;

      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ message: 'Team not found' });

      // Find the logged-in user's membership
      const member = team.members.find(
        m => m.user.toString() === req.user._id.toString()
      );

      if (!member) {
        return res.status(403).json({ message: 'You are not a member of this team' });
      }

      // Check if their role is allowed
      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({ message: 'You do not have permission for this action' });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
};

module.exports = authorizeRole;
