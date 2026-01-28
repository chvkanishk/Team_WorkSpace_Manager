const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth.middleware');
const {
  createTeam,
  addMember,
  getMyTeams,
  removeMember,
  deleteTeam,
  transferOwnership,
  promoteToAdmin,
  demoteAdmin
} = require('../controllers/team.controller');


router.post('/create', protect, createTeam);
router.post('/:teamId/add-member', protect, authorizeRole('owner', 'admin'), addMember);
router.get('/my-teams', protect, getMyTeams);
router.delete('/:teamId/remove-member', protect, authorizeRole('owner', 'admin'), removeMember);
router.delete('/:teamId', protect, authorizeRole('owner'), deleteTeam);
router.put('/:teamId/transfer-ownership', protect, authorizeRole('owner'), transferOwnership);
router.put('/:teamId/promote', protect, authorizeRole('owner'), promoteToAdmin);
router.put('/:teamId/demote', protect, authorizeRole('owner'), demoteAdmin);
router.post('/:teamId/remove-member', protect, authorizeRole('owner', 'admin'), removeMember);
router.get('/:teamId/logs', protect, authorizeRole('owner', 'admin'), getActivityLogs);
router.post('/:teamId/invite', protect, authorizeRole('owner', 'admin'), sendInvite);
router.post('/invite/:inviteId/accept', protect, acceptInvite);
router.post('/:teamId/invite', protect, authorizeRole('owner', 'admin'), sendInvite);
router.post('/invite/:inviteId/accept', protect, acceptInvite);
router.post('/invite/:inviteId/decline', protect, declineInvite);
router.post('/invite/:inviteId/cancel', protect, authorizeRole('owner', 'admin'), cancelInvite);

router.get('/:teamId/invites', protect, authorizeRole('owner', 'admin'), getTeamInvites);
router.get('/my/invites', protect, getMyInvites);


module.exports = router;
