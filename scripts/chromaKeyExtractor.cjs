const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

/**
 * Removes #FF00FF magenta background from an image (JPG or PNG) and outputs a transparent PNG.
 * @param {string} inputPath 
 * @param {string} outputPath 
 * @param {number} innerThreshold Colors within this distance become 100% transparent
 * @param {number} outerThreshold Colors between inner and outer get feathered alpha
 */
function removeChromaKey(inputPath, outputPath, innerThreshold = 55, outerThreshold = 110) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const raw = fs.readFileSync(inputPath);
  let width, height, data;

  const ext = path.extname(inputPath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') {
    const decoded = jpeg.decode(raw, { useTArray: true, formatAsRGBA: true });
    width = decoded.width;
    height = decoded.height;
    data = decoded.data;
  } else {
    const decoded = PNG.sync.read(raw);
    width = decoded.width;
    height = decoded.height;
    data = decoded.data;
  }

  const outPng = new PNG({ width, height });

  const targetR = 255;
  const targetG = 0;
  const targetB = 255;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3] ?? 255;

    // Euclidean distance in RGB to pure magenta #FF00FF
    const dist = Math.sqrt(
      (r - targetR) * (r - targetR) +
      (g - targetG) * (g - targetG) +
      (b - targetB) * (b - targetB)
    );

    if (dist <= innerThreshold) {
      outPng.data[i] = 0;
      outPng.data[i + 1] = 0;
      outPng.data[i + 2] = 0;
      outPng.data[i + 3] = 0; // Fully transparent
    } else if (dist < outerThreshold) {
      const factor = (dist - innerThreshold) / (outerThreshold - innerThreshold);
      const newAlpha = Math.round(a * factor);

      // De-spill magenta fringe: suppress magenta excess relative to green
      const magentaExcess = Math.min(r, b) - g;
      let newR = r;
      let newB = b;
      if (magentaExcess > 0) {
        newR = Math.max(0, r - Math.round(magentaExcess * 0.75));
        newB = Math.max(0, b - Math.round(magentaExcess * 0.75));
      }

      outPng.data[i] = newR;
      outPng.data[i + 1] = g;
      outPng.data[i + 2] = newB;
      outPng.data[i + 3] = newAlpha;
    } else {
      outPng.data[i] = r;
      outPng.data[i + 1] = g;
      outPng.data[i + 2] = b;
      outPng.data[i + 3] = a;
    }
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const buffer = PNG.sync.write(outPng);
  fs.writeFileSync(outputPath, buffer);
  console.log(`[ChromaKey] Extracted: ${outputPath} (${width}x${height})`);
}

module.exports = { removeChromaKey };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length >= 2) {
    removeChromaKey(args[0], args[1]);
  } else {
    console.log('Usage: node chromaKeyExtractor.cjs <input> <output.png>');
  }
}
