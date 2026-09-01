#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const coursesDir = path.join(__dirname, '..', 'assets', 'images', 'courses');

if (!fs.existsSync(coursesDir)) {
  console.error('Courses directory not found:', coursesDir);
  process.exit(1);
}

const files = fs.readdirSync(coursesDir).filter(f => f.endsWith('.webp'));
console.log(`Found ${files.length} webp course images to process.`);

let convertedJpg = 0;
let convertedPng = 0;

for (const file of files) {
  const baseName = path.basename(file, '.webp');
  const srcPath = path.join(coursesDir, file);
  const jpgPath = path.join(coursesDir, `${baseName}.jpg`);
  const pngPath = path.join(coursesDir, `${baseName}.png`);

  // Convert to JPG (ideal for WhatsApp Open Graph, optimized file size < 300KB)
  try {
    execSync(`sips -s format jpeg -s formatOptions 85 "${srcPath}" --out "${jpgPath}"`, { stdio: 'ignore' });
    convertedJpg++;
  } catch (err) {
    console.error(`Failed to convert ${file} to JPG:`, err.message);
  }

  // Convert to PNG (lossless high fidelity)
  try {
    execSync(`sips -s format png "${srcPath}" --out "${pngPath}"`, { stdio: 'ignore' });
    convertedPng++;
  } catch (err) {
    console.error(`Failed to convert ${file} to PNG:`, err.message);
  }
}

console.log(`Successfully generated ${convertedJpg} JPGs and ${convertedPng} PNGs for Open Graph preview in ${coursesDir}`);
