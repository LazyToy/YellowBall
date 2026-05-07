import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const envPath = join(rootDir, '.env.local');
const assetsDir = join(rootDir, 'assets', 'storage-seed');

const readEnv = () => {
  const env = {};
  const text = readFileSync(envPath, 'utf8');

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^#=\s]+)=(.*)$/);

    if (match) {
      env[match[1]] = match[2].trim();
    }
  }

  return env;
};

const env = readEnv();
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey =
  env.SUPABASE_SERVICE_ROLE_KEY ?? env.EXPO_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL and service role key in .env.local',
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const seedUploads = readdirSync(assetsDir)
  .filter((file) => file.endsWith('.png'))
  .map((file) => ({
    source: join(assetsDir, file),
    path: `seed/${file}`,
  }));

const brandUploads = [
  { source: join(rootDir, 'assets', 'icon.png'), path: 'brand/icon.png' },
  {
    source: join(rootDir, 'assets', 'adaptive-icon.png'),
    path: 'brand/adaptive-icon.png',
  },
  {
    source: join(rootDir, 'assets', 'splash-icon.png'),
    path: 'brand/splash-icon.png',
  },
];

for (const upload of [...seedUploads, ...brandUploads]) {
  const path = upload.path;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/app-assets/${path}`;
  const existing = await fetch(publicUrl, { method: 'HEAD' });

  if (existing.ok) {
    console.log(`exists app-assets/${path}`);
    continue;
  }

  const bytes = readFileSync(upload.source);
  const { error } = await supabase.storage
    .from('app-assets')
    .upload(path, bytes, {
      contentType: 'image/png',
      upsert: false,
    });

  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Failed to upload ${path}: ${error.message}`);
  }

  console.log(`${error ? 'exists' : 'uploaded'} app-assets/${path}`);
}
