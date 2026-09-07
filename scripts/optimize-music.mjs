import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const input = process.argv[2];
const slug = process.argv[3] || (input && basename(input).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
if (!input || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run music:prepare -- "audio-source/song.mp3" song-slug');
  process.exit(1);
}
const output = resolve('public/assets/music');
mkdirSync(output, { recursive: true });
const common = ['-hide_banner', '-n', '-i', resolve(input), '-map', '0:a:0', '-vn', '-map_metadata', '-1', '-ac', '2'];
for (const [extension, options] of [
  ['ogg', ['-c:a', 'libopus', '-b:a', '64k', '-vbr', 'on', '-application', 'audio', '-compression_level', '10']],
  ['m4a', ['-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart']]
]) {
  const result = spawnSync(process.env.FFMPEG_PATH || 'ffmpeg', [...common, ...options, resolve(output, `${slug}.${extension}`)], { stdio: 'inherit' });
  if (result.error) console.error('FFmpeg required. Set FFMPEG_PATH to its executable.', result.error.message);
  if (result.status !== 0) process.exit(result.status || 1);
}
