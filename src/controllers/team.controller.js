const Team = require('../models/team.model');
const User = require('../models/user.model');

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

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Get teams for logged-in user
const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      members: req.user._id,
    }).populate('owner', 'name email');

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

    res.json({ message: 'Admin demoted to member', team });
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
  demoteAdmin
};


