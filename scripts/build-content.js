#!/usr/bin/env node
/**
 * build-content.js — Markdown-driven CMS build script
 * 
 * Reads .md files from content/ subfolders (achievements, experience, works, reels, scripts)
 * and compiles them into JSON files under data/ that the frontend consumes at runtime.
 * 
 * Usage:  node scripts/build-content.js
 * Vercel: Runs automatically as part of the build step.
 * 
 * To add new content: just create a new .md file in the right folder, commit & push.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const DATA_DIR = path.join(ROOT, 'data');

// Ensure data/ directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Read all .md files in a directory, parse frontmatter + body, sort by `order` field.
 */
function readContentFolder(folderName) {
  const folderPath = path.join(CONTENT_DIR, folderName);
  if (!fs.existsSync(folderPath)) {
    console.warn(`⚠  content/${folderName}/ not found, skipping.`);
    return [];
  }

  const files = fs.readdirSync(folderPath)
    .filter(f => f.endsWith('.md'))
    .sort(); // alphabetical ensures numeric prefixes (01-, 02-) order correctly

  const items = files.map(filename => {
    const raw = fs.readFileSync(path.join(folderPath, filename), 'utf-8');
    const { data: frontmatter, content } = matter(raw);
    return {
      ...frontmatter,
      body: content.trim(),
      _filename: filename
    };
  });

  // Sort by explicit `order` field if present, otherwise keep filename order
  items.sort((a, b) => (a.order || 999) - (b.order || 999));

  return items;
}

/**
 * Build achievements.json
 */
function buildAchievements() {
  const items = readContentFolder('achievements');
  const output = items.map(item => ({
    title: item.title,
    year: item.year,
    tag: item.tag,
    image: item.image,
    imageAlt: item.imageAlt || item.title,
    description: item.description,
    bio: item.body
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'achievements.json'), JSON.stringify(output, null, 2));
  console.log(`✓  achievements.json — ${output.length} entries`);
  return output;
}

/**
 * Build experience.json
 */
function buildExperience() {
  const items = readContentFolder('experience');
  const output = items.map(item => ({
    title: item.title,
    year: item.year,
    tag: item.tag,
    organization: item.organization,
    subtitle: item.subtitle,
    image: item.image,
    imageAlt: item.imageAlt || item.title,
    bio: item.body
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'experience.json'), JSON.stringify(output, null, 2));
  console.log(`✓  experience.json — ${output.length} entries`);
  return output;
}

/**
 * Build works.json
 */
function buildWorks() {
  const items = readContentFolder('works');
  const output = items.map(item => ({
    title: item.title,
    type: item.type,
    role: item.role,
    genre: item.genre,
    status: item.status || null,
    image: item.image,
    imageAlt: item.imageAlt || item.title,
    scriptLink: item.scriptLink || null,
    description: item.body
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'works.json'), JSON.stringify(output, null, 2));
  console.log(`✓  works.json — ${output.length} entries`);
  return output;
}

/**
 * Build reels.json — items for the 3D cylindrical carousel / spiral gallery
 * Each entry can be type: "image" or type: "video" (for Instagram reels)
 */
function buildReels() {
  const items = readContentFolder('reels');
  const output = items.map(item => ({
    caption: item.caption,
    src: item.image || item.video,
    type: item.type || 'image',
    // For video reels: the video URL to play inline
    videoUrl: item.videoUrl || null,
    // Optional thumbnail for video items
    thumbnail: item.thumbnail || item.image || null
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'reels.json'), JSON.stringify(output, null, 2));
  console.log(`✓  reels.json — ${output.length} entries`);
  return output;
}

/**
 * Convert plain screenplay text into HTML elements with proper screenplay CSS classes:
 * - Scene headings (INT./EXT.) -> <div class="sp-scene">
 * - Transitions (CUT TO:, FADE TO BLACK., etc.) -> <div class="sp-trans">
 * - Character name (ALL CAPS short line) -> <div class="sp-char">
 * - Parentheticals ((softly)) -> <div class="sp-paren">
 * - Dialogue (lines under character) -> <div class="sp-dialogue">
 * - Action/Description -> <div class="sp-action">
 */
function parseScreenplayPage(pageText) {
  if (pageText.includes('<div class="sp-')) {
    return pageText.trim();
  }

  const lines = pageText.split('\n').map(l => l.trim());
  const elements = [];
  let inSpeech = false;

  const isScene = line => /^(INT\.|EXT\.|INT\.\/EXT\.|EXT\.\/INT\.)/i.test(line);
  const isTransition = line => /^(CUT TO:|FADE OUT\.|FADE TO BLACK\.|DISSOLVE TO BLACK\.|ZOOM IN HARD:|DISSOLVE TO:|[A-Z\s]{3,30}:)$/.test(line);
  const isParen = line => /^\(.*\)$/.test(line);
  const isChar = line => {
    if (isScene(line) || isTransition(line) || isParen(line)) return false;
    return /^[A-Z0-9\s\.\-']{2,35}$/.test(line) && /[A-Z]/.test(line);
  };

  let bufferAction = [];
  let bufferDialogue = [];

  function flushAction() {
    if (bufferAction.length > 0) {
      elements.push(`<div class="sp-action">${bufferAction.join(' ')}</div>`);
      bufferAction = [];
    }
  }

  function flushDialogue() {
    if (bufferDialogue.length > 0) {
      elements.push(`<div class="sp-dialogue">${bufferDialogue.join(' ')}</div>`);
      bufferDialogue = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      flushAction();
      flushDialogue();
      inSpeech = false;
      continue;
    }

    if (isScene(line)) {
      flushAction();
      flushDialogue();
      inSpeech = false;
      elements.push(`<div class="sp-scene">${line}</div>`);
    } else if (isTransition(line)) {
      flushAction();
      flushDialogue();
      inSpeech = false;
      elements.push(`<div class="sp-trans">${line}</div>`);
    } else if (isChar(line)) {
      flushAction();
      flushDialogue();
      elements.push(`<div class="sp-char">${line}</div>`);
      inSpeech = true;
    } else if (inSpeech && isParen(line)) {
      flushDialogue();
      elements.push(`<div class="sp-paren">${line}</div>`);
    } else if (inSpeech) {
      bufferDialogue.push(line);
    } else {
      bufferAction.push(line);
    }
  }
  flushAction();
  flushDialogue();

  return elements.join('\n');
}

/**
 * Build scripts.json — screenplay excerpts with parsed HTML page content
 * Pages within a script are separated by "---page---" delimiter in the body
 */
function buildScripts() {
  const items = readContentFolder('scripts');
  const output = items.map(item => ({
    title: item.title,
    draft: item.draft,
    tabLabel: item.tabLabel || item.title,
    pages: item.body
      .split('---page---')
      .map(p => parseScreenplayPage(p))
      .filter(Boolean)
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'scripts.json'), JSON.stringify(output, null, 2));
  console.log(`✓  scripts.json — ${output.length} entries`);
  return output;
}

/**
 * Build content.js — combines all data into a JS file setting window.BHAVYA_CONTENT.
 * This ensures the site works even when opened directly via file:// where fetch() is blocked by CORS.
 */
function buildContentBundle(achievements, experience, works, reels, scripts) {
  const bundle = {
    achievements,
    experience,
    works,
    reels,
    scripts
  };
  const code = `// Auto-generated by scripts/build-content.js — DO NOT EDIT DIRECTLY\nwindow.BHAVYA_CONTENT = ${JSON.stringify(bundle, null, 2)};\n`;
  fs.writeFileSync(path.join(DATA_DIR, 'content.js'), code);
  console.log(`✓  content.js — full bundle created`);
}

// ── Run all builders ─────────────────────────────────────────────────────────
console.log('\n🎬  Building content from markdown...\n');
const achievements = buildAchievements();
const experience   = buildExperience();
const works        = buildWorks();
const reels        = buildReels();
const scripts      = buildScripts();
buildContentBundle(achievements, experience, works, reels, scripts);
console.log('\n✅  All content compiled to data/\n');
