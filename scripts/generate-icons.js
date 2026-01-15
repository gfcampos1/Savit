const fs = require('fs');
const path = require('path');

async function main() {
  let sharp;
  try {
    // eslint-disable-next-line global-require
    sharp = require('sharp');
  } catch (err) {
    console.error('Missing dependency: sharp');
    console.error('Install with: npm i -D sharp');
    process.exit(1);
  }

  const repoRoot = path.join(__dirname, '..');
  const inputSvgPath = path.join(repoRoot, 'public', 'icons', 'icon.svg');
  const outDir = path.join(repoRoot, 'public', 'icons');

  if (!fs.existsSync(inputSvgPath)) {
    console.error(`Input SVG not found: ${inputSvgPath}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const svgBuffer = fs.readFileSync(inputSvgPath);

  const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512];

  // Standard icons
  for (const size of sizes) {
    const outPath = path.join(outDir, `icon-${size}.png`);
    // Use transparent background for standard icons
    // Fit 'contain' to avoid cropping if the SVG isn't square
    // (Most launchers will still handle this fine)
    // eslint-disable-next-line no-await-in-loop
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain' })
      .png()
      .toFile(outPath);

    console.log(`Generated ${path.relative(repoRoot, outPath)}`);
  }

  // Maskable icons (with padding + solid background)
  const maskableSizes = [192, 512];
  for (const size of maskableSizes) {
    const outPath = path.join(outDir, `icon-maskable-${size}.png`);
    // For maskable icons, avoid excessive padding (it makes the icon look smaller).
    // Our SVG already contains a full-bleed background, so rendering full size is safe.
    // eslint-disable-next-line no-await-in-loop
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outPath);

    console.log(`Generated ${path.relative(repoRoot, outPath)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
