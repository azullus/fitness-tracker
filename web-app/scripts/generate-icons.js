#!/usr/bin/env node
/**
 * Generate PNG icons from SVG for PWA
 *
 * Usage: node scripts/generate-icons.js
 *
 * Requires: npm install sharp (run once, can uninstall after)
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  // Try to load sharp
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('Sharp is not installed. Run: npm install sharp');
    console.error('After generating icons, you can uninstall it: npm uninstall sharp');
    process.exit(1);
  }

  const publicDir = path.join(__dirname, '..', 'public');
  const svgPath = path.join(publicDir, 'icon.svg');

  if (!fs.existsSync(svgPath)) {
    console.error('SVG icon not found at:', svgPath);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(svgPath);

  const sizes = [
    { size: 192, name: 'icon-192.png' },
    { size: 192, name: 'icon-192-maskable.png', maskable: true },
    { size: 512, name: 'icon-512.png' },
    { size: 512, name: 'icon-512-maskable.png', maskable: true },
  ];

  console.log('Generating PNG icons...');

  for (const { size, name, maskable } of sizes) {
    const outputPath = path.join(publicDir, name);

    try {
      let pipeline = sharp(svgBuffer)
        .resize(size, size);

      // For maskable icons, add padding (safe zone is 80% of icon)
      if (maskable) {
        const padding = Math.round(size * 0.1);
        const innerSize = size - (padding * 2);

        pipeline = sharp(svgBuffer)
          .resize(innerSize, innerSize)
          .extend({
            top: padding,
            bottom: padding,
            left: padding,
            right: padding,
            background: { r: 59, g: 130, b: 246, alpha: 1 } // #3b82f6
          });
      }

      await pipeline.png().toFile(outputPath);
      console.log(`  ✓ Generated ${name} (${size}x${size})`);
    } catch (err) {
      console.error(`  ✗ Failed to generate ${name}:`, err.message);
    }
  }

  console.log('\nDone! PNG icons have been generated in the public/ directory.');
}

generateIcons().catch(console.error);
