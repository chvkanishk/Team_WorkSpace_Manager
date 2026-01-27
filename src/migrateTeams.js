const mongoose = require('mongoose');
const Team = require('./models/team.model'); // adjust path if needed

require('dotenv').config();

async function migrateTeams() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const teams = await Team.find();

    for (const team of teams) {
      console.log(`Migrating team: ${team.name}`);

      // Convert old members array into new structure
      const newMembers = team.members.map(memberId => {
        return {
          user: memberId,
          role: memberId.toString() === team.owner.toString() ? 'owner' : 'member'
        };
      });

      team.members = newMembers;

      await team.save();
      console.log(`Team migrated: ${team.name}`);
    }

    console.log('Migration complete');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

migrateTeams();
