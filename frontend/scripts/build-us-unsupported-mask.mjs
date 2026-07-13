/**
 * One-time / dev script: builds unsupported-area GeoJSON (world minus CONUS + HI, excluding AK).
 * Run: node scripts/build-us-unsupported-mask.mjs
 */
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as turf from '@turf/turf';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcPath = join(root, 'scripts/data/ne_110m_admin_1_states_provinces.geojson');
const outPath = join(root, 'public/data/us-unsupported-area-mask.geojson');

const data = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

const supported = data.features.filter(
  (f) => f.properties.adm0_a3 === 'USA' && f.properties.iso_3166_2 !== 'US-AK'
);

if (supported.length < 2) {
  console.error('Need at least 2 supported state features');
  process.exit(1);
}

const merged = turf.union(turf.featureCollection(supported));
if (!merged) {
  console.error('union returned null');
  process.exit(1);
}

const world = turf.polygon([[
  [-180, -90],
  [180, -90],
  [180, 90],
  [-180, 90],
  [-180, -90],
]]);

const unsupported = turf.difference(
  turf.featureCollection([world, merged])
);
if (!unsupported) {
  console.error('difference returned null');
  process.exit(1);
}

fs.writeFileSync(outPath, JSON.stringify(unsupported));
console.log('Wrote', outPath, 'bytes', fs.statSync(outPath).size);
