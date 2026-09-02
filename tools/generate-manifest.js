#!/usr/bin/env node
/**
 * Scans /games and writes /games/games.json.
 *
 * Run this any time you add, remove, or rename a game folder:
 *    node tools/generate-manifest.js
 *
 * Convention per game folder (games/<folder-name>/):
 *   - index.html       required — the game's entry point
 *   - README.md        optional — first paragraph becomes the description
 *   - thumbnail.png    optional — shown on the game card (falls back to a glyph)
 *
 * Why a generated manifest instead of live directory listing?
 * Browsers can't read a folder's contents directly for security reasons,
 * so a manifest file is the standard way to make a static site "discover"
 * content. This script is the one manual step; everything else about
 * detecting descriptions, thumbnails, etc. is automatic.
 */

const fs = require('fs');
const path = require('path');

const GAMES_DIR = path.join(__dirname, '..', 'games');
const OUT_FILE = path.join(GAMES_DIR, 'games.json');

function titleCase(slug) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function firstParagraph(markdown) {
  const lines = markdown.split(/\r?\n/);
  let buffer = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) continue; // skip headings
    if (trimmed === '') {
      if (buffer.length) break;
      continue;
    }
    buffer.push(trimmed);
  }
  return buffer.join(' ').trim();
}

function main() {
  if (!fs.existsSync(GAMES_DIR)) {
    console.error('No games/ directory found next to tools/.');
    process.exit(1);
  }

  const entries = fs.readdirSync(GAMES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  const games = [];

  for (const folder of entries) {
    const dir = path.join(GAMES_DIR, folder);
    const indexPath = path.join(dir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.warn(`Skipping "${folder}" — no index.html found.`);
      continue;
    }

    const readmePath = path.join(dir, 'README.md');
    let description = 'No description available.';
    if (fs.existsSync(readmePath)) {
      const raw = fs.readFileSync(readmePath, 'utf8');
      const para = firstParagraph(raw);
      if (para) description = para;
    }

    let thumbnail = null;
    for (const candidate of ['thumbnail.png', 'thumbnail.jpg', 'thumbnail.gif', 'thumb.png']) {
      if (fs.existsSync(path.join(dir, candidate))) { thumbnail = candidate; break; }
    }

    games.push({
      id: folder,
      name: titleCase(folder),
      folder,
      entry: 'index.html',
      thumbnail,
      description
    });
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(games, null, 2) + '\n');
  console.log(`Wrote ${games.length} game(s) to games/games.json`);
}

main();
