import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputDir = 'C:\\Users\\VTOS\\Downloads\\poket trade avatar';
const outputDir = 'E:\\NextJS\\job\\pocket_trade\\public\\avatars';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.jpg'));

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const inputPath = path.join(inputDir, file);
  const outputName = `trainer-${String(i + 1).padStart(2, '0')}.webp`;
  const outputPath = path.join(outputDir, outputName);

  await sharp(inputPath)
    .webp({ quality: 85 })
    .toFile(outputPath);

  console.log(`Converted: ${file} -> ${outputName}`);
}

console.log(`\nDone! Converted ${files.length} avatars to ${outputDir}`);
