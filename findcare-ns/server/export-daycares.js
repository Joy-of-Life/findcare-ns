const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const Daycare = require('./models/Daycare');
const toPublicDaycare = require('./daycarePrivacy');
require('dotenv').config();

const outputPath = path.join(__dirname, 'data', 'daycares.json');
const seedOwnerId = '000000000000000000000001';

async function exportDaycares() {
  await mongoose.connect(process.env.MONGO_URI);
  const daycares = await Daycare.find({}).sort({ name: 1, _id: 1 }).lean();
  const snapshot = daycares.map(daycare => {
    const {
      _id,
      owner,
      __v,
      createdAt,
      updatedAt,
      complianceAttestation,
      ...fields
    } = toPublicDaycare(daycare);
    return { owner: seedOwnerId, ...fields };
  });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, outputPath);
  } catch (err) {
    await fs.rm(temporaryPath, { force: true });
    throw err;
  }

  console.log(`Exported ${snapshot.length} daycares to ${path.relative(__dirname, outputPath)}`);
}

async function main() {
  try {
    await exportDaycares();
  } catch (err) {
    console.error('Daycare export failed:', err);
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
