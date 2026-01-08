import fs from 'fs';
import path from 'path';

const streetsPath = path.join(process.cwd(), 'src', 'data', 'streets.json');
const outputPath = path.join(process.cwd(), 'streets.csv');

try {
  const data = fs.readFileSync(streetsPath, 'utf8');
  const streets = JSON.parse(data);

  // CSV Header
  let csvContent = 'Tier,Name,Segments\n';

  // Sort by Tier, then Name
  streets.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.name.localeCompare(b.name);
  });

  streets.forEach(street => {
    // Escape quotes in names if necessary, though unlikely for street names usually
    const safeName = street.name.includes(',') ? `"${street.name}"` : street.name;
    csvContent += `${street.tier},${safeName},${street.geometry.length}\n`;
  });

  fs.writeFileSync(outputPath, csvContent);
  console.log(`Exported ${streets.length} streets to ${outputPath}`);
} catch (err) {
  console.error('Error exporting CSV:', err);
}
