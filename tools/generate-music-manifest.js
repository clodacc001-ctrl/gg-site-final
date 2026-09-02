#!/usr/bin/env node
/**
 * Scans /music and writes /music/music.json.
 *
 * Run this any time you add or remove a track:
 *    node tools/generate-music-manifest.js
 *
 * Drop any .mp3 / .ogg / .wav file straight into /music — the display
 * name is derived from the filename (dashes/underscores become spaces).
 */
const fs = require('fs');
const path = require('path');

const MUSIC_DIR = path.join(__dirname, '..', 'music');
const OUT_FILE = path.join(MUSIC_DIR, 'music.json');
const EXTS = ['.mp3', '.ogg', '.wav', '.m4a', '.flac', '.aac', '.opus', '.weba', '.webm'];

function niceName(filename) {
  const base = filename.replace(/\.[^.]+$/, '');
  return base.replace(/[-_]+/g, ' ').trim();
}

function main() {
  if (!fs.existsSync(MUSIC_DIR)) {
    console.error('No music/ directory found next to tools/.');
    process.exit(1);
  }
  const files = fs.readdirSync(MUSIC_DIR)
    .filter(f => EXTS.includes(path.extname(f).toLowerCase()))
    .sort();

  const tracks = files.map(file => ({ name: niceName(file), file }));
  fs.writeFileSync(OUT_FILE, JSON.stringify(tracks, null, 2) + '\n');
  console.log(`Wrote ${tracks.length} track(s) to music/music.json`);
}

main();
