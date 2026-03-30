import matches from './lfc-match.json';

export interface LFCMatch {
  id: string;
  opponent: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (Beijing Time)
  competition: string;
  venue: 'Home' | 'Away';
  result?: string;
  isHome: boolean;
}

const lfcMatches: LFCMatch[] = matches as LFCMatch[];

export default lfcMatches;
