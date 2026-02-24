import { supabase } from '../db/supabase.js';
import { generateGeneralInfo, generateAttractions } from '../services/gemini.js';

const DESTINATIONS = [
  // March — International (Spring / Cherry Blossom / Pre-Summer)
  'Tokyo, Japan', 'Kyoto, Japan', 'Dubai, UAE', 'Marrakech, Morocco',
  'Rome, Italy', 'Barcelona, Spain', 'Lisbon, Portugal',
  'Amsterdam, Netherlands', 'Hanoi, Vietnam',
  // March — India (Holi / Last pleasant month)
  'Varanasi, India', 'Jaipur, India', 'Goa, India', 'Rishikesh, India',
  // April — International (Shoulder Season)
  'Santorini, Greece', 'Istanbul, Turkey', 'Bali, Indonesia',
  'Maldives', 'Phuket, Thailand', 'New York City, USA', 'London, England',
  // April — India (Hill Stations Before Summer Peak)
  'Munnar, India', 'Ooty, India', 'Coorg, India',
  'Darjeeling, India', 'Hampi, India',
  // May-June — International (Summer)
  'Paris, France', 'Swiss Alps, Switzerland', 'Reykjavik, Iceland',
  'Cappadocia, Turkey', 'Prague, Czech Republic', 'Dubrovnik, Croatia',
  'Singapore', 'Seoul, South Korea', 'Amalfi Coast, Italy',
  'Mykonos, Greece', 'Edinburgh, Scotland', 'Copenhagen, Denmark',
  'Zanzibar, Tanzania', 'Banff, Canada',
  // May-June — India (Summer Vacation + Char Dham Yatra)
  'Shimla, India', 'Manali, India', 'Leh Ladakh, India',
  'Mussoorie, India', 'Nainital, India', 'Badrinath, India',
  'Kedarnath, India', 'Gangotri, India', 'Yamunotri, India',
  'Spiti Valley, India', 'Andaman Islands, India',
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const seed = async () => {
  console.log(`Seeding ${DESTINATIONS.length} destinations...\n`);
  let seeded = 0, skipped = 0, failed = 0;

  for (let i = 0; i < DESTINATIONS.length; i++) {
    const name = DESTINATIONS[i];
    try {
      // Check if already cached
      const { data: existing } = await supabase
        .from('destinations')
        .select('general_info')
        .ilike('name', name)
        .single();

      if (existing?.general_info) {
        console.log(`[${i + 1}/${DESTINATIONS.length}] SKIP (cached): ${name}`);
        skipped++;
        continue;
      }

      // Generate AI data
      const generalInfo = await generateGeneralInfo(name);
      await delay(2000);
      const attractions = await generateAttractions(name);
      await delay(2000);

      // Upsert to DB
      const { error } = await supabase
        .from('destinations')
        .upsert({
          name,
          general_info: generalInfo,
          attractions,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'name' });

      if (error) throw error;

      console.log(`[${i + 1}/${DESTINATIONS.length}] SEEDED: ${name}`);
      seeded++;
    } catch (err) {
      console.error(`[${i + 1}/${DESTINATIONS.length}] FAILED: ${name} — ${err.message}`);
      failed++;
      await delay(5000); // extra cooldown on failure
    }
  }

  console.log(`\nDone! Seeded: ${seeded} | Skipped: ${skipped} | Failed: ${failed}`);
  process.exit(0);
};

seed().catch(err => { console.error('Seed aborted:', err); process.exit(1); });
