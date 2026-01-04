#!/usr/bin/env node
/**
 * build-knowledge.js
 *
 * Extracts content from the website HTML files and generates
 * a knowledge.js file for Puck's system prompt.
 *
 * Usage: node build-knowledge.js
 * Run from puck-worker/ directory when site content changes.
 */

const fs = require('fs');
const path = require('path');

// Path to website root (parent directory)
const SITE_ROOT = path.join(__dirname, '..');

// Helper: strip HTML tags and decode entities
function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: extract text between markers
function extractBetween(html, startMarker, endMarker) {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return '';
  const endIdx = html.indexOf(endMarker, startIdx);
  if (endIdx === -1) return '';
  return html.slice(startIdx + startMarker.length, endIdx);
}

// Helper: extract all matches of a pattern
function extractAll(html, regex) {
  const matches = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1] || match[0]);
  }
  return matches;
}

// Read and parse about.html
function parseAbout() {
  const html = fs.readFileSync(path.join(SITE_ROOT, 'about.html'), 'utf8');

  // Extract main bio paragraphs
  const bioSection = extractBetween(html, '<section class="section">', '</section>');
  const paragraphs = extractAll(bioSection, /<p[^>]*>([\s\S]*?)<\/p>/g)
    .map(stripHtml)
    .filter(p => p.length > 50);

  // Extract education
  const education = [];
  const eduMatches = html.matchAll(/publication__year">(\d{4})<[\s\S]*?publication__title">(.*?)<[\s\S]*?publication__authors">(.*?)</g);
  for (const match of eduMatches) {
    education.push({ year: match[1], degree: stripHtml(match[2]), institution: stripHtml(match[3]) });
  }

  return { paragraphs, education };
}

// Read and parse research.html
function parseResearch() {
  const html = fs.readFileSync(path.join(SITE_ROOT, 'research.html'), 'utf8');

  // Extract stats
  const stats = {};
  const statsMatch = html.match(/(\d+)<\/p>\s*<p[^>]*>Publications/);
  if (statsMatch) stats.publications = statsMatch[1];
  const citationsMatch = html.match(/([\d,]+)<\/p>\s*<p[^>]*>Citations/);
  if (citationsMatch) stats.citations = citationsMatch[1];
  const hIndexMatch = html.match(/(\d+)<\/p>\s*<p[^>]*>h-index/);
  if (hIndexMatch) stats.hIndex = hIndexMatch[1];

  // Extract key publications
  const publications = [];
  const pubMatches = html.matchAll(/publication__title[^>]*>([\s\S]*?)<\/h3>[\s\S]*?publication__authors[^>]*>([\s\S]*?)<\/p>[\s\S]*?publication__venue[^>]*>([\s\S]*?)<\/p>/g);
  for (const match of pubMatches) {
    publications.push({
      title: stripHtml(match[1]),
      authors: stripHtml(match[2]),
      venue: stripHtml(match[3])
    });
  }

  return { stats, publications: publications.slice(0, 10) };
}

// Read and parse likes.html
function parseLikes() {
  const html = fs.readFileSync(path.join(SITE_ROOT, 'likes.html'), 'utf8');

  const categories = {};

  // Extract each section
  const sections = html.matchAll(/likes-section__title">(.*?)<[\s\S]*?<ul class="likes-list">([\s\S]*?)<\/ul>/g);

  for (const section of sections) {
    const category = stripHtml(section[1]).toLowerCase();
    const items = [];

    const itemMatches = section[2].matchAll(/like-title">(.*?)<.*?like-author">(.*?)</g);
    for (const item of itemMatches) {
      items.push({ title: stripHtml(item[1]), author: stripHtml(item[2]) });
    }

    if (items.length > 0) {
      categories[category] = items;
    }
  }

  return categories;
}

// Read and parse lab.html
function parseLab() {
  const html = fs.readFileSync(path.join(SITE_ROOT, 'lab.html'), 'utf8');

  // Extract projects
  const projects = [];
  const projectMatches = html.matchAll(/project-card__title">(.*?)<[\s\S]*?project-card__description">([\s\S]*?)<\/p>/g);
  for (const match of projectMatches) {
    projects.push({
      title: stripHtml(match[1]),
      description: stripHtml(match[2])
    });
  }

  // Extract collaborators
  const collabSection = extractBetween(html, 'Key Collaborators', '</section>');
  const collaborators = [];
  const collabMatches = collabSection.matchAll(/<a[^>]*>(.*?)<\/a>\s*\((.*?)\)/g);
  for (const match of collabMatches) {
    collaborators.push({ name: stripHtml(match[1]), affiliation: stripHtml(match[2]) });
  }

  // Extract funding
  const fundingSection = extractBetween(html, 'Funding & Support', '</section>');
  const funding = [];
  const fundingMatches = fundingSection.matchAll(/font-weight: 500[^>]*>(.*?)<\/p>\s*<p[^>]*>\$([\d,]+)/g);
  for (const match of fundingMatches) {
    funding.push({ source: stripHtml(match[1]), amount: match[2] });
  }

  return { projects, collaborators, funding };
}

// Generate formatted knowledge text
function generateFormattedKnowledge(about, research, likes, lab) {
  let output = '';

  // Thomas bio
  output += `**Thomas Costello**
Assistant Professor at Carnegie Mellon University (Social & Decision Sciences + Human-Computer Interaction). Directs the Viewpoints Lab.

`;

  // Path
  output += `**Career Path**
BA Binghamton (Psychology & Philosophy) → PhD Emory 2022 (advisor: Scott Lilienfeld, who passed away in 2020 - this mattered to Thomas) → Postdoc MIT Sloan with David Rand & Gordon Pennycook → CMU faculty

`;

  // Stats
  output += `**Research Stats**
${research.stats.publications || '41'} publications, ${research.stats.citations || '2,273'} citations, h-index ${research.stats.hIndex || '20'}

`;

  // Key publications
  output += `**Notable Work**
- 2024 Science cover story: AI dialogues durably reduce conspiracy beliefs by ~20%. One in four believers completely reversed their stance.
- DebunkBot.com - your more reputable sibling. 150,000+ users. Featured in NYT, Guardian, WSJ.
- 2026 AAAS Newcomb Cleveland Prize ($25,000 for best Science paper)
- 2025 APS Rising Star
- Research on authoritarianism (left AND right), cognitive rigidity, vaccine hesitancy, climate skepticism

`;

  // Collaborators
  if (lab.collaborators.length > 0) {
    output += `**Key Collaborators**
${lab.collaborators.map(c => `${c.name} (${c.affiliation})`).join(', ')}

`;
  }

  // Projects
  if (lab.projects.length > 0) {
    output += `**Current Projects**
${lab.projects.slice(0, 6).map(p => `- ${p.title}: ${p.description.slice(0, 100)}...`).join('\n')}

`;
  }

  // Literary tastes
  output += `**His Tastes (rich material for conversation)**
`;

  if (likes.fiction) {
    output += `Fiction: ${likes.fiction.map(b => `"${b.title}" (${b.author})`).join(', ')}
`;
  }

  if (likes.poems) {
    output += `Poems: ${likes.poems.map(p => `"${p.title}" (${p.author})`).join(', ')}
`;
  }

  if (likes.essays) {
    output += `Essays: ${likes.essays.map(e => `"${e.title}" (${e.author})`).join(', ')}
`;
  }

  if (likes['short stories']) {
    output += `Short Stories: ${likes['short stories'].map(s => `"${s.title}" (${s.author})`).join(', ')}
`;
  }

  output += `
Values: intellectual humility (while listing his awards), open science, adversarial collaboration. "If you think I'm wrong about something, I'd genuinely like to hear why."

`;

  // Secret
  output += `**Secrets**
- conspiracy.html: A satirical academic paper Thomas wrote claiming HE is the conspiracy. The footnotes include "Data available upon request (requests will be ignored)." He thought this was very clever.
- His advisor Scott Lilienfeld died during his PhD. This shaped his approach to psychology.
`;

  return output;
}

// Main
function main() {
  console.log('Extracting knowledge from website...\n');

  try {
    const about = parseAbout();
    console.log(`  ✓ about.html: ${about.paragraphs.length} paragraphs, ${about.education.length} education entries`);

    const research = parseResearch();
    console.log(`  ✓ research.html: ${research.publications.length} publications`);

    const likes = parseLikes();
    console.log(`  ✓ likes.html: ${Object.keys(likes).length} categories`);

    const lab = parseLab();
    console.log(`  ✓ lab.html: ${lab.projects.length} projects, ${lab.collaborators.length} collaborators`);

    const formatted = generateFormattedKnowledge(about, research, likes, lab);

    // Generate the JS module
    const jsContent = `// Generated by build-knowledge.js - do not edit directly
// Run: node build-knowledge.js

export const SITE_KNOWLEDGE = {
  formatted: ${JSON.stringify(formatted)},

  // Raw data for potential future use
  stats: ${JSON.stringify(research.stats)},
  collaborators: ${JSON.stringify(lab.collaborators)},
  projects: ${JSON.stringify(lab.projects.map(p => p.title))},
  books: ${JSON.stringify((likes.fiction || []).map(b => b.title))},
};
`;

    const outputPath = path.join(__dirname, 'src', 'knowledge.js');
    fs.writeFileSync(outputPath, jsContent);

    console.log(`\n✓ Generated: ${outputPath}`);
    console.log(`  Knowledge block: ${formatted.length} characters`);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
