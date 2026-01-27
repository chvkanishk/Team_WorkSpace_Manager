const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const {
  createTeam,
  addMember,
  getMyTeams,
  removeMember,
  deleteTeam,
  transferOwnership
} = require('../controllers/team.controller');

router.post('/create', protect, createTeam);
router.post('/:teamId/add-member', protect, addMember);
router.get('/my-teams', protect, getMyTeams);
router.delete('/:teamId/remove-member', protect, removeMember);
router.delete('/:teamId', protect, deleteTeam);
router.put('/:teamId/transfer-ownership', protect, transferOwnership);


module.exports = router;
