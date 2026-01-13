/* eslint-env node */
const fs = require('fs');
const path = require('path');

const logFile = '/tmp/analysis_output.txt';
// const logFile = path.join(process.cwd(), 'analysis_output.txt');
const log = msg => fs.appendFileSync(logFile, msg + '\n');

// Clear log file
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

log('Starting analysis...');

try {
  const streetsPath = path.join(process.cwd(), 'src/data/streets.json');
  log('Reading file: ' + streetsPath);

  if (!fs.existsSync(streetsPath)) {
    log('File does not exist!');
    process.exit(1);
  }

  const raw = fs.readFileSync(streetsPath, 'utf-8');
  log('File loaded. Bytes: ' + raw.length);

  const streets = JSON.parse(raw);
  log('JSON parsed. Items: ' + streets.length);

  // Helper to count points
  function getPointsCount(street) {
    return street.geometry.reduce((acc, seg) => acc + seg.length, 0);
  }

  // Group by tier
  const tiers = {};
  streets.forEach(s => {
    if (!tiers[s.tier]) tiers[s.tier] = [];
    tiers[s.tier].push(s);
  });

  log('Tier Counts:');
  Object.keys(tiers).forEach(t => log(`Tier ${t}: ${tiers[t].length}`));

  log('\nRandom Examples per Tier:');
  Object.keys(tiers).forEach(t => {
    const samples = tiers[t].slice(0, 3).map(s => `${s.name} (${s.geometry.length} segments)`);
    log(`Tier ${t}: ${samples.join(', ')}`);
  });

  const famous = [
    'La Rambla',
    'Rambla de Catalunya',
    "Portal de l'Àngel",
    'Carrer de Petritxol',
    'Gran Via de les Corts Catalanes',
    'Passeig de Gràcia',
    'Avinguda Diagonal',
  ];

  log('\nChecking specific famous streets:');
  famous.forEach(name => {
    const s = streets.find(st => st.name === name || st.name.includes(name));
    if (s) {
      log(`${s.name}: Tier ${s.tier}, Total Points: ${getPointsCount(s)}`);
    } else {
      log(`${name}: NOT FOUND`);
    }
  });
} catch (e) {
  log('Error: ' + e.message);
}
