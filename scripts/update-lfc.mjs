import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICS_URL = 'https://ics.fixtur.es/v2/liverpool.ics';
const TARGET_FILE = path.resolve(__dirname, '../src/data/lfc-match.json');

async function updateLfcMatches() {
  console.log('🔄 Fetching LFC matches from fixtur.es...');
  try {
    const response = await axios.get(ICS_URL);
    const icsContent = response.data;
    
    const events = icsContent.split('BEGIN:VEVENT');
    const matches = [];

    for (const event of events) {
      if (!event.includes('END:VEVENT')) continue;

      const summaryMatch = event.match(/SUMMARY:(.*)/);
      const dtStartMatch = event.match(/DTSTART:(.*)/);

      if (summaryMatch && dtStartMatch) {
        const fullSummary = summaryMatch[1].trim();
        const rawDate = dtStartMatch[1].trim();
        
        // Parse date (UTC)
        const year = rawDate.slice(0, 4);
        // Filter for 2026 as requested by user
        if (year !== '2026') continue;

        const month = rawDate.slice(4, 6);
        const day = rawDate.slice(6, 8);
        const hour = rawDate.slice(9, 11);
        const minute = rawDate.slice(11, 13);
        
        const utcDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
        const beijingTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);
        
        const dateStr = beijingTime.toISOString().split('T')[0];
        const timeStr = beijingTime.toISOString().split('T')[1].slice(0, 5);

        // Format: "Team1 - Team2 (Score)" or "Team1 - Team2"
        let titlePart = fullSummary;
        let result = '';
        const scoreMatch = fullSummary.match(/\((.*)\)/);
        if (scoreMatch) {
          result = scoreMatch[1].trim();
          titlePart = fullSummary.replace(/\(.*\)/, '').trim();
        }

        let opponent = '';
        let isHome = false;
        
        // Clean titlePart: "Liverpool - Team" or "Team - Liverpool"
        if (titlePart.startsWith('Liverpool - ')) {
          opponent = titlePart.replace('Liverpool - ', '').trim();
          isHome = true;
        } else if (titlePart.endsWith(' - Liverpool')) {
          opponent = titlePart.replace(' - Liverpool', '').trim();
          isHome = false;
        } else if (titlePart.includes(' - ')) {
            const parts = titlePart.split(' - ');
            if (parts[0].includes('Liverpool')) {
                opponent = parts[1].trim();
                isHome = true;
            } else {
                opponent = parts[0].trim();
                isHome = false;
            }
        } else {
          opponent = titlePart;
        }

        // Determine competition from brackets in opponent name
        let competition = 'Premier League';
        if (opponent.includes('[LC]')) {
          competition = 'League Cup';
          opponent = opponent.replace('[LC]', '').trim();
        } else if (opponent.includes('[FA]')) {
          competition = 'FA Cup';
          opponent = opponent.replace('[FA]', '').trim();
        } else if (opponent.includes('[CL]') || opponent.includes('[UCL]')) {
          competition = 'Champions League';
          opponent = opponent.replace(/\[(C|UC)L\]/, '').trim();
        }

        matches.push({
          id: `lfc-${dateStr}-${opponent.substring(0, 3).toLowerCase().replace(/[^a-z]/g, '')}`,
          opponent,
          date: dateStr,
          time: timeStr,
          competition,
          venue: isHome ? 'Home' : 'Away',
          isHome,
          result
        });
      }
    }

    // Sort by date
    matches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    await fs.writeFile(TARGET_FILE, JSON.stringify(matches, null, 2));
    console.log(`✅ Successfully updated ${matches.length} LFC matches for 2026 in src/data/lfc-match.json`);
  } catch (error) {
    console.error('❌ Failed to update LFC matches:', error.message);
  }
}

updateLfcMatches();
