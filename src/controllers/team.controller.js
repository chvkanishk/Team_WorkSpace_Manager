const Team = require('../models/team.model');
const User = require('../models/user.model');
const logActivity = require('../utils/logActivity');


// Create team
const createTeam = async (req, res) => {
  try {
    const { name } = req.body;

    const team = await Team.create({
      name,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'owner'
        }
      ]
    });
    await logActivity(team._id, req.user._id, 'CREATE_TEAM', {
    teamName: name
  });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Add member
const addMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    // Check if already a member
    const alreadyMember = team.members.some(
      m => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User already a member' });
    }

    team.members.push({
      user: userToAdd._id,
      role: 'member'
    });

    await team.save();
    await logActivity(team._id, req.user._id, 'ADD_MEMBER', {
    addedUser: userToAdd._id
    });


    res.json({ message: 'Member added successfully', team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//Delete member

const removeMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const userToRemove = await User.findOne({ email });
    if (!userToRemove) return res.status(404).json({ message: 'User not found' });

    // Prevent removing owner
    if (team.owner.toString() === userToRemove._id.toString()) {
      return res.status(400).json({ message: 'Cannot remove the owner' });
    }

    team.members = team.members.filter(
      m => m.user.toString() !== userToRemove._id.toString()
    );

    await team.save();
    await logActivity(team._id, req.user._id, 'REMOVE_MEMBER', {
    removedUser: userToRemove._id
  });


    res.json({ message: 'Member removed successfully', team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Delete team
const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    // Find team
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Check ownership
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this team' });
    }

    // Delete team
    await Team.findByIdAndDelete(teamId);

    await logActivity(team._id, req.user._id, 'DELETE_TEAM');


    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Get teams for logged-in user
const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      "members.user": req.user._id
    })
    .populate("owner", "name email")
    .populate("members.user", "name email");

    res.json({ teams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Transfer ownership
const transferOwnership = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Only current owner can transfer
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can transfer ownership' });
    }

    const newOwner = await User.findOne({ email });
    if (!newOwner) return res.status(404).json({ message: 'User not found' });

    // Check membership
    const isMember = team.members.some(
      m => m.user.toString() === newOwner._id.toString()
    );
    if (!isMember) {
      return res.status(400).json({ message: 'User must be a member to become owner' });
    }

    // Update roles
    team.members = team.members.map(m => {
      if (m.user.toString() === req.user._id.toString()) {
        return { ...m.toObject(), role: 'member' };
      }
      if (m.user.toString() === newOwner._id.toString()) {
        return { ...m.toObject(), role: 'owner' };
      }
      return m;
    });

    // Update owner field
    team.owner = newOwner._id;

    await team.save();

    await logActivity(team._id, req.user._id, 'TRANSFER_OWNERSHIP', {
    newOwner: newOwner._id
    });


    res.json({ message: 'Ownership transferred successfully', team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Promote member to admin
const promoteToAdmin = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Only owner can promote
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can promote admins' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const member = team.members.find(
      m => m.user.toString() === user._id.toString()
    );

    if (!member) {
      return res.status(400).json({ message: 'User is not a member of this team' });
    }

    if (member.role === 'owner') {
      return res.status(400).json({ message: 'Owner cannot be promoted' });
    }

    if (member.role === 'admin') {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    // Promote
    member.role = 'admin';
    await team.save();

    await logActivity(team._id, req.user._id, 'PROMOTE_ADMIN', {
      promotedUser: user._id
    });

    res.json({ message: 'User promoted to admin', team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Demote admin to member
const demoteAdmin = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Only owner can demote
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can demote admins' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const member = team.members.find(
      m => m.user.toString() === user._id.toString()
    );

    if (!member) {
      return res.status(400).json({ message: 'User is not a member of this team' });
    }

    if (member.role === 'owner') {
      return res.status(400).json({ message: 'Owner cannot be demoted' });
    }

    if (member.role === 'member') {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Demote
    member.role = 'member';
    await team.save();

    await logActivity(team._id, req.user._id, 'DEMOTE_ADMIN', {
      demotedUser: user._id
    });

    res.json({ message: 'Admin demoted to member', team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const ActivityLog = require('../models/activityLog.model');

const getActivityLogs = async (req, res) => {
  try {
    const { teamId } = req.params;

    const logs = await ActivityLog.find({ team: teamId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send Invite
const Invite = require('../models/invite.model');

const sendInvite = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Check if already a member
    const alreadyMember = team.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    // Check if invite already exists
    const existingInvite = await Invite.findOne({ team: teamId, email, status: 'pending' });
    if (existingInvite) {
      return res.status(400).json({ message: 'Invite already sent' });
    }

    const invite = await Invite.create({
      team: teamId,
      email,
      invitedBy: req.user._id
    });

    await logActivity(teamId, req.user._id, 'SEND_INVITE', { email });

    res.json({ message: 'Invite sent', invite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept Invite 
const acceptInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;

    const invite = await Invite.findById(inviteId);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    if (invite.status !== 'pending') {
      return res.status(400).json({ message: 'Invite already processed' });
    }

    // Only the invited user can accept
    if (invite.email !== req.user.email) {
      return res.status(403).json({ message: 'You cannot accept this invite' });
    }

    const team = await Team.findById(invite.team);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Add user as member
    team.members.push({
      user: req.user._id,
      role: 'member'
    });

    await team.save();

    invite.status = 'accepted';
    await invite.save();

    await logActivity(team._id, req.user._id, 'ACCEPT_INVITE');

    res.json({ message: 'Invite accepted', team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//Decline Invite
const declineInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;

    const invite = await Invite.findById(inviteId);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    if (invite.status !== 'pending') {
      return res.status(400).json({ message: 'Invite already processed' });
    }

    // Only the invited user can decline
    if (invite.email !== req.user.email) {
      return res.status(403).json({ message: 'You cannot decline this invite' });
    }

    invite.status = 'declined';
    await invite.save();

    await logActivity(invite.team, req.user._id, 'DECLINE_INVITE');

    res.json({ message: 'Invite declined' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Cancel Invite
const cancelInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;

    const invite = await Invite.findById(inviteId);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    const team = await Team.findById(invite.team);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Only owner/admin can cancel
    const member = team.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return res.status(403).json({ message: 'Not allowed to cancel invites' });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ message: 'Invite already processed' });
    }

    invite.status = 'cancelled';
    await invite.save();

    await logActivity(team._id, req.user._id, 'CANCEL_INVITE', {
      email: invite.email
    });

    res.json({ message: 'Invite cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//List Pending Invites

const getTeamInvites = async (req, res) => {
  try {
    const { teamId } = req.params;

    const invites = await Invite.find({
      team: teamId,
      status: 'pending'
    }).sort({ createdAt: -1 });

    res.json(invites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//List my invites 
const getMyInvites = async (req, res) => {
  try {
    const invites = await Invite.find({
      email: req.user.email,
      status: 'pending'
    })
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    res.json(invites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Active log Filtering 
const ActivityLog = require('../models/activityLog.model');

const getFilteredActivityLogs = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { action, user, startDate, endDate, page = 1, limit = 20 } = req.query;

    const filter = { team: teamId };

    // Filter by action
    if (action) {
      filter.action = action;
    }

    // Filter by user
    if (user) {
      filter.user = user;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ActivityLog.countDocuments(filter);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      logs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update team setting 

const updateTeamSettings = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { description, avatar, visibility, tags } = req.body;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Only owner/admin can update settings
    const member = team.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ message: "Not allowed to update settings" });
    }

    // Apply updates
    if (description !== undefined) team.description = description;
    if (avatar !== undefined) team.avatar = avatar;
    if (visibility !== undefined) team.visibility = visibility;
    if (tags !== undefined) team.tags = tags;

    await team.save();

    await logActivity(team._id, req.user._id, "UPDATE_SETTINGS", {
      description,
      avatar,
      visibility,
      tags
    });

    res.json({ message: "Team settings updated", team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get team settings
const getTeamSettings = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId).select(
      "name description avatar visibility tags owner members"
    );

    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createTeam,
  addMember,
  getMyTeams,
  removeMember,
  deleteTeam,
  transferOwnership,
  promoteToAdmin,
  demoteAdmin,
  getActivityLogs,
  sendInvite,
  declineInvite,
  cancelInvite,
  getTeamInvites,
  getMyInvites,
  acceptInvite,
  getFilteredActivityLogs,
  updateTeamSettings,
  getTeamSettings
};


