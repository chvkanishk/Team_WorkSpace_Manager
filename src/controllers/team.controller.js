const Team = require('../models/team.model');
const User = require('../models/user.model');

// Create team
const createTeam = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    const team = await Team.create({
      name,
      owner: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({ message: 'Team created', team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add member
const addMember = async (req, res) => {
  try {
    const { email } = req.body;
    const { teamId } = req.params;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find team 
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    //Check if already a member
    if (team.members.includes(user._id)) {
      return res.status(400).json({ message: 'User already a member' });
    }
    // Add member
    team.members.push(user._id);
    await team.save();

    res.json({ message: 'Member added', team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Delete member

const removeMember = async (req, res) => {
  try {
    const { email } = req.body;
    const { teamId } = req.params;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find team
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Check if user is a member
    if (!team.members.includes(user._id)) {
      return res.status(400).json({ message: 'User is not a member of this team' });
    }

    // Prevent owner from removing themselves
    if (team.owner.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Owner cannot remove themselves' });
    }

    // Remove member
    team.members = team.members.filter(
      (memberId) => memberId.toString() !== user._id.toString()
    );

    await team.save();

    res.json({ message: 'Member removed', team });
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


module.exports = {
  createTeam,
  addMember,
  getMyTeams,
  removeMember,
  deleteTeam
};
