const mongoose = require('mongoose');
const Daycare  = require('./models/Daycare');
const sampleDaycares = require('./data/daycares.json');
require('dotenv').config();

async function seedDaycares() {
  if (!sampleDaycares.length) {
    throw new Error('The daycare seed snapshot is empty; refusing to clear the collection');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB...');

  await Daycare.deleteMany({});
  console.log('Cleared existing daycares...');

  await Daycare.insertMany(sampleDaycares);
  console.log(`Seeded ${sampleDaycares.length} Nova Scotia daycares!`);
}

async function main() {
  try {
    await seedDaycares();
  } catch (err) {
    console.error('Daycare seed failed:', err);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch (err) {
      console.error('MongoDB disconnect failed:', err);
      process.exitCode = 1;
    }
  }
}

main();
