import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ICAL from 'ical.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePath =
  process.argv[2] || path.resolve(__dirname, '../fixtures/sample-airbnb.ics');

if (!fs.existsSync(samplePath)) {
  console.error('Sample ICS not found:', samplePath);
  process.exit(1);
}

const content = fs.readFileSync(samplePath, 'utf8');
const jcal = ICAL.parse(content);
const comp = new ICAL.Component(jcal);
const vevents = comp.getAllSubcomponents('vevent');

console.log(`Parsed ${vevents.length} events from ${samplePath}`);
for (const vevent of vevents) {
  const event = new ICAL.Event(vevent);
  console.log('-', event.summary, event.uid?.slice(0, 24) + '...');
}
