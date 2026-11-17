// LENKYX Cloud Persistence Layer — Supabase PostgreSQL (REST API via Node 20 native fetch)
// Automatically active whenever SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in environment.

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export function isSupabaseEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

function sbHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function sbFetch(restPath, options = {}) {
  if (!isSupabaseEnabled()) return null;
  const url = `${SUPABASE_URL}/rest/v1/${restPath}`;
  const res = await fetch(url, {
    ...options,
    headers: sbHeaders(options.headers || {}),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Supabase ${options.method || 'GET'} ${restPath} -> HTTP ${res.status}: ${errText.slice(0, 220)}`);
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Loads official tracks + settings from Supabase PostgreSQL on server boot.
 * If Supabase tables are empty, seeds them with the provided fallbackDb.
 */
export async function hydrateDbFromSupabase(fallbackDb) {
  if (!isSupabaseEnabled()) return null;
  try {
    const [settingsRows, trackRows] = await Promise.all([
      sbFetch('lenkyx_settings?id=eq.main&select=data'),
      sbFetch('lenkyx_tracks?select=id,track_number,data,plays,likes&order=track_number.asc'),
    ]);

    const hasCloudSettings = Array.isArray(settingsRows) && settingsRows.length > 0 && settingsRows[0]?.data;
    const hasCloudTracks = Array.isArray(trackRows) && trackRows.length > 0;

    if (!hasCloudSettings && !hasCloudTracks) {
      console.log('[Supabase] Empty cloud tables detected — seeding initial LENKYX catalog...');
      await syncDbToSupabase(fallbackDb);
      return fallbackDb;
    }

    const mergedSettings = hasCloudSettings
      ? { ...fallbackDb.settings, ...settingsRows[0].data }
      : fallbackDb.settings;

    const mergedTracks = hasCloudTracks
      ? trackRows.map((row) => ({
          ...row.data,
          id: row.id,
          number: row.track_number || row.data?.number || 0,
          plays: typeof row.plays === 'number' ? row.plays : row.data?.plays || 0,
          likes: typeof row.likes === 'number' ? row.likes : row.data?.likes || 0,
        }))
      : fallbackDb.tracks;

    console.log(`[Supabase] Hydrated ${mergedTracks.length} tracks + settings from cloud PostgreSQL!`);
    return {
      catalogVersion: fallbackDb.catalogVersion,
      settings: mergedSettings,
      tracks: mergedTracks,
    };
  } catch (err) {
    console.error('[Supabase] Hydrate failed (falling back to local JSON):', err.message);
    return null;
  }
}

let syncInFlight = Promise.resolve();

/**
 * Persists full settings + track catalog to Supabase PostgreSQL (serialized safely).
 */
export function syncDbToSupabase(db, deletedTrackId = null) {
  if (!isSupabaseEnabled()) return Promise.resolve();
  syncInFlight = syncInFlight
    .then(async () => {
      const now = new Date().toISOString();

      // 1. Upsert settings
      if (db.settings) {
        await sbFetch('lenkyx_settings?on_conflict=id', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify([{ id: 'main', data: db.settings, updated_at: now }]),
        });
      }

      // 2. Delete removed track if requested
      if (deletedTrackId) {
        await sbFetch(`lenkyx_tracks?id=eq.${encodeURIComponent(deletedTrackId)}`, {
          method: 'DELETE',
        });
      }

      // 3. Upsert all tracks
      if (Array.isArray(db.tracks) && db.tracks.length > 0) {
        const rows = db.tracks.map((t, idx) => ({
          id: t.id,
          track_number: Number(t.number) || idx + 1,
          title: t.title || 'Untitled',
          data: t,
          plays: Number(t.plays) || 0,
          likes: Number(t.likes) || 0,
          updated_at: now,
        }));
        await sbFetch('lenkyx_tracks?on_conflict=id', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(rows),
        });
      }
    })
    .catch((err) => {
      console.error('[Supabase] Background sync error:', err.message);
    });
  return syncInFlight;
}

/**
 * Persists Creator Auth config (salt, passwordHash, secret, hasCustomPassword) in Supabase
 * so custom Creator passwords survive Render Free restarts!
 */
export async function hydrateAuthFromSupabase() {
  if (!isSupabaseEnabled()) return null;
  try {
    const rows = await sbFetch('lenkyx_creator_auth?id=eq.main&select=password_hash');
    if (Array.isArray(rows) && rows[0]?.password_hash) {
      const parsed = JSON.parse(rows[0].password_hash);
      if (parsed && parsed.salt && parsed.passwordHash) {
        console.log('[Supabase] Hydrated Creator auth config from cloud PostgreSQL!');
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Supabase] Auth hydrate skipped:', err.message);
  }
  return null;
}

export async function syncAuthToSupabase(authCfg) {
  if (!isSupabaseEnabled() || !authCfg) return;
  try {
    await sbFetch('lenkyx_creator_auth?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([
        {
          id: 'main',
          password_hash: JSON.stringify(authCfg),
          updated_at: new Date().toISOString(),
        },
      ]),
    });
  } catch (err) {
    console.error('[Supabase] Auth sync error:', err.message);
  }
}

/**
 * Fan Accounts & Cloud Playlists Sync (table: public.lenkyx_fans)
 */
export async function upsertFanToSupabase({ id, name, email, avatarColor, playlists }) {
  if (!isSupabaseEnabled() || !id || !name) return null;
  const now = new Date().toISOString();
  const payload = [
    {
      id: String(id),
      name: String(name).slice(0, 80),
      email: email ? String(email).trim().toLowerCase().slice(0, 120) : null,
      avatar_color: String(avatarColor || 'from-pink-500 to-purple-600'),
      playlists: Array.isArray(playlists) ? playlists : [],
      updated_at: now,
    },
  ];
  await sbFetch('lenkyx_fans?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(payload),
  });
  return payload[0];
}

export async function findFanInSupabase({ id, email }) {
  if (!isSupabaseEnabled()) return null;
  if (id) {
    const rows = await sbFetch(`lenkyx_fans?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (Array.isArray(rows) && rows[0]) return rows[0];
  }
  if (email) {
    const clean = String(email).trim().toLowerCase();
    const rows = await sbFetch(`lenkyx_fans?email=eq.${encodeURIComponent(clean)}&select=*&order=updated_at.desc&limit=1`);
    if (Array.isArray(rows) && rows[0]) return rows[0];
  }
  return null;
}
