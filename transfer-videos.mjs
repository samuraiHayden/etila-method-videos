import fs from 'fs';
import { pipeline } from 'stream/promises';
import { createWriteStream, statSync, existsSync, unlinkSync } from 'fs';
import { Readable, Transform } from 'stream';
import path from 'path';
import os from 'os';
import tus from 'tus-js-client';

const NEW_SUPABASE_URL = 'https://swnwgebocjqiihlfeytg.supabase.co';
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3bndnZWJvY2pxaWlobGZleXRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQwNjM1MSwiZXhwIjoyMDg5OTgyMzUxfQ.uFVPsbHTSMXYXtxnFt_xpda6tmvqm5c9-R_MOFWS1do';
const CSV_PATH = process.env.CSV_PATH || './signed-download-urls.csv';
const BUCKET = 'exercise-videos';
const TMP_DIR = os.tmpdir();
const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB chunks
const CONCURRENCY = 3; // files in parallel

// Parse CSV
const csv = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = csv.trim().split('\n').slice(1);
const files = lines.map(line => {
  const firstComma = line.indexOf(',');
  const secondComma = line.indexOf(',', firstComma + 1);
  const fileName = line.substring(firstComma + 1, secondComma).trim();
  const signedUrl = line.substring(secondComma + 1).trim();
  return { fileName, signedUrl };
}).filter(f => f.fileName && f.signedUrl);

function formatMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

async function downloadToFile(signedUrl, tmpPath) {
  const res = await fetch(signedUrl);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
  const nodeStream = Readable.fromWeb(res.body);
  const fileStream = createWriteStream(tmpPath);
  await pipeline(nodeStream, fileStream);
  return statSync(tmpPath).size;
}

function uploadWithTUS(tmpPath, fileName, fileSize) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(tmpPath);
    const upload = new tus.Upload(fileStream, {
      endpoint: `${NEW_SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: CHUNK_SIZE,
      headers: {
        Authorization: `Bearer ${NEW_SERVICE_ROLE_KEY}`,
        'x-upsert': 'true',
      },
      metadata: {
        bucketName: BUCKET,
        objectName: fileName,
        contentType: 'video/mp4',
        cacheControl: '3600',
      },
      uploadSize: fileSize,
      onSuccess: resolve,
      onError: reject,
    });
    upload.start();
  });
}

// Shared progress state for parallel display
const progress = {};

function renderProgress() {
  const slots = Object.values(progress);
  if (slots.length === 0) return;
  process.stdout.write('\r' + slots.map(s => `[${s.index}] ${s.status}`).join('  |  ') + '   ');
}

async function transferFile(fileName, signedUrl, index, total) {
  const tmpPath = path.join(TMP_DIR, `vt_${index}_${Date.now()}.mp4`);
  progress[index] = { index, status: '⬇ starting...' };
  try {
    progress[index].status = '⬇ downloading...';
    renderProgress();

    const fileSize = await downloadToFile(signedUrl, tmpPath);

    progress[index].status = `⬆ uploading ${formatMB(fileSize)}`;
    renderProgress();

    await uploadWithTUS(tmpPath, fileName, fileSize);

    delete progress[index];
    process.stdout.write('\r' + ' '.repeat(120) + '\r');
    console.log(`✓ [${index}/${total}] ${fileName} — ${formatMB(fileSize)}`);
    return true;
  } catch (err) {
    delete progress[index];
    process.stdout.write('\r' + ' '.repeat(120) + '\r');
    console.error(`✗ [${index}/${total}] ${fileName} — ${err.message}`);
    return false;
  } finally {
    if (existsSync(tmpPath)) unlinkSync(tmpPath);
  }
}

async function runWithConcurrency(tasks, concurrency) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log(`\nFound ${files.length} files — running ${CONCURRENCY} at a time\n`);

  const tasks = files.map(({ fileName, signedUrl }, i) =>
    () => transferFile(fileName, signedUrl, i + 1, files.length)
  );

  const results = await runWithConcurrency(tasks, CONCURRENCY);

  const success = results.filter(Boolean).length;
  const failed = results.length - success;

  console.log('\n' + '─'.repeat(50));
  console.log(`✓ Success: ${success} / ${files.length}`);
  if (failed > 0) {
    console.log(`✗ Failed:  ${failed}`);
    files.forEach(({ fileName }, i) => {
      if (!results[i]) console.log('  -', fileName);
    });
  }
  console.log('\nAll done!');
}

main().catch(console.error);
