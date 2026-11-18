package com.lenkyx.cosmicphonk;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class WorldMusicBridge {
    private static final String UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

    private static final ConcurrentHashMap<String, JSONObject> wikiCache = new ConcurrentHashMap<>();
    private static volatile String cachedDirectoryJson = null;
    private static volatile long cachedDirectoryTs = 0L;

    private static final String[][] ARTISTS = new String[][]{
            {"The Weeknd", "Pop / Synthwave", "Global Top", "The_Weeknd", "en", "The Weeknd official audio"},
            {"Taylor Swift", "Pop Global", "Global Top", "Taylor_Swift", "en", "Taylor Swift official music"},
            {"Billie Eilish", "Alt Pop", "Global Top", "Billie_Eilish", "en", "Billie Eilish official audio"},
            {"Bruno Mars", "Pop / R&B", "Global Top", "Bruno_Mars", "en", "Bruno Mars official audio"},
            {"Dua Lipa", "Pop / Dance", "Global Top", "Dua_Lipa", "en", "Dua Lipa official music"},
            {"Drake", "Hip-Hop / R&B", "Global Top", "Drake_(musician)", "en", "Drake official audio"},
            {"Bad Bunny", "Reggaeton / Trap", "Latina Global", "Bad_Bunny", "en", "Bad Bunny official audio"},
            {"Travis Scott", "Trap / Hip-Hop", "Global Top", "Travis_Scott", "en", "Travis Scott official audio"},
            {"Eminem", "Hip-Hop / Rap", "Lenda Global", "Eminem", "en", "Eminem official audio"},
            {"Rihanna", "Pop / R&B", "Ícone Global", "Rihanna", "en", "Rihanna official music"},
            {"Post Malone", "Pop / Hip-Hop", "Global Top", "Post_Malone", "en", "Post Malone official audio"},
            {"Ariana Grande", "Pop / R&B", "Global Top", "Ariana_Grande", "en", "Ariana Grande official audio"},
            {"Coldplay", "Pop Rock", "Global Top", "Coldplay", "en", "Coldplay official music"},
            {"Imagine Dragons", "Rock / Pop", "Global Top", "Imagine_Dragons", "en", "Imagine Dragons official audio"},
            {"Daft Punk", "Eletrônica / Espacial", "Lenda Global", "Daft_Punk", "en", "Daft Punk official audio"},
            {"Michael Jackson", "Rei do Pop", "Anos 70/80/90", "Michael_Jackson", "en", "Michael Jackson official audio"},
            {"Queen", "Rock Clássico", "Anos 70/80", "Queen_(band)", "en", "Queen official audio"},
            {"Linkin Park", "Rock / Nu Metal", "Anos 2000/2020", "Linkin_Park", "en", "Linkin Park official"},
            {"Metallica", "Heavy Metal", "Lenda Global", "Metallica", "en", "Metallica official audio"},
            {"Kordhell", "Phonk Mundial", "Nova Geração", "Phonk", "en", "Kordhell phonk"},
            {"Henrique & Juliano", "Sertanejo", "Brasil", "Henrique_&_Juliano", "pt", "Henrique e Juliano musica oficial"},
            {"Marília Mendonça", "Sertanejo", "Rainha da Sofrência", "Marília_Mendonça", "pt", "Marilia Mendonca melhores musicas"},
            {"Gusttavo Lima", "Sertanejo", "Embaixador", "Gusttavo_Lima", "pt", "Gusttavo Lima oficial audio"},
            {"Jorge & Mateus", "Sertanejo", "Brasil", "Jorge_&_Mateus", "pt", "Jorge e Mateus sucessos"},
            {"Luan Santana", "Sertanejo / Pop", "Brasil", "Luan_Santana", "pt", "Luan Santana oficial"},
            {"Alok", "Eletrônica / House", "Brasil & Mundo", "Alok", "pt", "Alok official music"},
            {"Vintage Culture", "House / Eletrônica", "Brasil & Mundo", "Vintage_Culture", "pt", "Vintage Culture official"},
            {"Anitta", "Pop / Funk Brasil", "Brasil & Mundo", "Anitta", "pt", "Anitta official audio"},
            {"Racionais MC's", "Rap Nacional", "Anos 90/2000", "Racionais_MC's", "pt", "Racionais MCs musicas"},
            {"Legião Urbana", "Rock Nacional", "Anos 80/90", "Legião_Urbana", "pt", "Legiao Urbana sucessos"}
    };

    private static JSONArray buildCuratedPlaylists() {
        JSONArray arr = new JSONArray();
        try {
            arr.put(pl("pl-clips-oficiais", "Melhores Clipes Oficiais & DVDs Completos",
                    "Henrique & Juliano, Marília Mendonça, Gusttavo Lima, Queen, Michael Jackson, Alok",
                    "🎬", "Cinema & Clipes HD",
                    "Henrique e Juliano Marilia Mendonca Queen Michael Jackson The Weeknd clipe oficial",
                    "from-rose-600/40 via-purple-600/25 to-cyan-500/25", false));
            arr.put(pl("pl-sertanejo-top", "Sertanejo Gigantes & Sofrência",
                    "Henrique & Juliano, Marília Mendonça, Gusttavo Lima, Jorge & Mateus",
                    "🤠", "Brasil Atual & Clássicos",
                    "Henrique e Juliano Marilia Mendonca Gusttavo Lima Jorge e Mateus musicas completas",
                    "from-amber-500/35 via-orange-600/20 to-pink-600/25", false));
            arr.put(pl("pl-brasil-lendas", "Brasil Todos os Tempos (MPB, Rap, Funk & Rock)",
                    "Racionais MC's, Legião Urbana, Alok, Anitta, Tim Maia, Exaltasamba",
                    "🇧🇷", "Todas as Gerações BR",
                    "melhores musicas brasileiras pop rock rap pagode Alok Legiao Urbana Racionais",
                    "from-emerald-500/30 via-yellow-500/20 to-cyan-500/25", false));
            arr.put(pl("pl-golden-eras", "Lendas Mundiais — Anos 60, 70, 80 & 90",
                    "Queen, Michael Jackson, Nirvana, Elton John, Bee Gees, Tears For Fears",
                    "🕰️", "Anos 60 / 70 / 80 / 90",
                    "Queen Michael Jackson Nirvana 80s 90s greatest hits official audio",
                    "from-purple-600/35 via-fuchsia-500/20 to-amber-500/25", false));
            arr.put(pl("pl-2000-2026", "Hits Globais — Anos 2000 até Hoje",
                    "The Weeknd, Bruno Mars, Eminem, Coldplay, Linkin Park, Billie Eilish",
                    "🌍", "Anos 2000 - 2026",
                    "The Weeknd Bruno Mars Coldplay Eminem Linkin Park official audio hits",
                    "from-cyan-500/35 via-blue-600/25 to-pink-500/25", false));
            arr.put(pl("pl-phonk-drift", "Phonk & Drift Mundial (Full Tracks)",
                    "Brazilian Phonk, Kordhell, DVRST, Ghostface Playa & Cosmic Bass",
                    "😈", "Geração Phonk",
                    "brazilian phonk Kordhell DVRST drift phonk full track",
                    "from-pink-600/40 via-purple-700/25 to-red-600/25", false));
            arr.put(pl("pl-space-et", "Galáxia, Espaço & Frequências E.T.",
                    "NASA Voyager Golden Record, Ondas de Saturno, Sinais Alienígenas & Synth Cósmico",
                    "🛸", "Espaço & Outras Galáxias",
                    "NASA space sounds voyager cosmic ambient alien synthwave music",
                    "from-indigo-600/45 via-cyan-500/30 to-emerald-500/25", true));
        } catch (Exception ignored) {
        }
        return arr;
    }

    private static JSONObject pl(String id, String title, String sub, String emoji, String era,
                                 String q, String grad, boolean space) throws Exception {
        JSONObject o = new JSONObject();
        o.put("id", id);
        o.put("title", title);
        o.put("subtitle", sub);
        o.put("emoji", emoji);
        o.put("era", era);
        o.put("searchQuery", q);
        o.put("gradient", grad);
        o.put("includeArchiveSpace", space);
        return o;
    }

    public static String getDirectoryJson() {
        long now = System.currentTimeMillis();
        if (cachedDirectoryJson != null && (now - cachedDirectoryTs) < 3600_000L) {
            return cachedDirectoryJson;
        }
        JSONArray artistsArr = new JSONArray();
        ExecutorService pool = Executors.newFixedThreadPool(6);
        List<Future<JSONObject>> futures = new ArrayList<>();
        for (final String[] a : ARTISTS) {
            futures.add(pool.submit(new Callable<JSONObject>() {
                @Override
                public JSONObject call() {
                    JSONObject item = new JSONObject();
                    try {
                        item.put("name", a[0]);
                        item.put("genre", a[1]);
                        item.put("era", a[2]);
                        item.put("query", a[5]);
                        JSONObject info = fetchArtistPhotoAndBio(a[0], a[4], a[3]);
                        item.put("photoUrl", info != null ? info.optString("photoUrl", "/covers/album-official.jpg") : "/covers/album-official.jpg");
                        item.put("bio", info != null ? info.optString("bio", "") : "");
                    } catch (Exception ignored) {
                    }
                    return item;
                }
            }));
        }
        for (Future<JSONObject> f : futures) {
            try {
                artistsArr.put(f.get());
            } catch (Exception ignored) {
            }
        }
        pool.shutdown();

        JSONObject root = new JSONObject();
        try {
            root.put("artists", artistsArr);
            root.put("playlists", buildCuratedPlaylists());
        } catch (Exception ignored) {
        }
        cachedDirectoryJson = root.toString();
        cachedDirectoryTs = now;
        return cachedDirectoryJson;
    }

    public static String searchJson(String rawQuery, boolean includeSpace) {
        String q = rawQuery == null ? "" : rawQuery.trim();
        String lowRaw = q.toLowerCase(Locale.ROOT)
                .replace("á", "a").replace("ã", "a").replace("â", "a")
                .replace("é", "e").replace("ê", "e")
                .replace("í", "i")
                .replace("ó", "o").replace("ô", "o").replace("õ", "o")
                .replace("ú", "u").replace("ç", "c");

        // Common phonetic / typo auto-correction
        String corrected = q;
        if (lowRaw.equals("metalica") || lowRaw.equals("metallika") || lowRaw.equals("mettalica")) corrected = "Metallica";
        else if (lowRaw.equals("acdc") || lowRaw.equals("ac dc")) corrected = "AC/DC";
        else if (lowRaw.equals("guns") || lowRaw.equals("gunz") || lowRaw.equals("guns n roses")) corrected = "Guns N' Roses";
        else if (lowRaw.equals("michael jakson") || lowRaw.equals("maicon jackson")) corrected = "Michael Jackson";
        else if (lowRaw.equals("nirvanna")) corrected = "Nirvana";
        else if (lowRaw.equals("link park") || lowRaw.equals("linkin")) corrected = "Linkin Park";
        else if (lowRaw.equals("marilia mendonsa")) corrected = "Marília Mendonça";
        else if (lowRaw.equals("gustavo lima")) corrected = "Gusttavo Lima";
        else if (lowRaw.equals("legiao")) corrected = "Legião Urbana";
        else if (lowRaw.equals("racionais")) corrected = "Racionais MC's";
        else if (lowRaw.equals("pink floid")) corrected = "Pink Floyd";
        else if (lowRaw.equals("slipnot")) corrected = "Slipknot";
        else if (lowRaw.equals("cold play")) corrected = "Coldplay";
        else if (lowRaw.equals("weeknd") || lowRaw.equals("the weekend")) corrected = "The Weeknd";

        String low = corrected.toLowerCase(Locale.ROOT);
        boolean isCosmic = includeSpace ||
                low.matches(".*(\\b(et|e\\.t\\.?|ufo|ovini|orbita|planeta|saturno|jupiter|espaco|espaço|galaxia|galáxia|universo|nasa|voyager|cosmic)\\b|alienigena|\\balien\\b).*");

        String[] matched = null;
        for (String[] a : ARTISTS) {
            String an = a[0].toLowerCase(Locale.ROOT);
            String anClean = an.replace("&", "e").replace("'", "");
            if (low.contains(an) || low.contains(anClean)
                    || (a[0].startsWith("Henrique") && low.contains("henrique") && low.contains("juliano"))
                    || (a[0].startsWith("Jorge") && low.contains("jorge") && low.contains("mateus"))
                    || (a[0].startsWith("Marília") && low.contains("marilia"))
                    || (a[0].startsWith("Zé Neto") && low.contains("ze neto"))) {
                matched = a;
                break;
            }
        }

        String expanded = corrected;
        if (corrected.isEmpty()) {
            expanded = "Henrique e Juliano Marilia Mendonca The Weeknd Queen Alok official audio";
        } else if (isCosmic) {
            expanded = corrected + " NASA Voyager space sounds cosmic ambient alien music";
        } else if (low.matches(".*(clipe|clipes|clip|dvd|video|ao vivo).*")) {
            expanded = corrected + " clipe oficial official music video";
        } else if (low.matches(".*(sertanejo|sofrencia|sofrência|modao|modão).*") && matched == null) {
            expanded = corrected + " Henrique e Juliano Marilia Mendonca Gusttavo Lima musica";
        } else if (matched != null) {
            expanded = matched[0] + " official audio music";
        }

        JSONArray ytTracks = searchYouTube(expanded, 18);
        JSONArray audiusTracks = searchAudius(corrected.isEmpty() ? "phonk cosmic" : corrected, 6);
        JSONObject wikiInfo = null;
        if (corrected.length() >= 2) {
            wikiInfo = fetchArtistPhotoAndBio(
                    matched != null ? matched[0] : corrected,
                    matched != null ? matched[4] : "pt",
                    matched != null ? matched[3] : ""
            );
        }

        JSONArray combined = new JSONArray();
        Set<String> seen = new HashSet<>();
        appendUnique(combined, ytTracks, seen);
        appendUnique(combined, audiusTracks, seen);

        JSONObject payload = new JSONObject();
        try {
            payload.put("query", q);
            payload.put("tracks", combined);
            payload.put("playlists", buildCuratedPlaylists());

            if (wikiInfo != null || matched != null) {
                JSONObject ap = new JSONObject();
                ap.put("name", wikiInfo != null ? wikiInfo.optString("name", matched != null ? matched[0] : q) : matched[0]);
                String fallbackCover = combined.length() > 0
                        ? combined.getJSONObject(0).optString("coverUrl", "/covers/album-official.jpg")
                        : "/covers/album-official.jpg";
                String photo = wikiInfo != null ? wikiInfo.optString("photoUrl", "") : "";
                ap.put("photoUrl", photo.isEmpty() ? fallbackCover : photo);
                ap.put("bio", wikiInfo != null ? wikiInfo.optString("bio", "") : "");
                ap.put("genre", matched != null ? matched[1] : (isCosmic ? "Espaço & Galáxia" : "Artista Mundial"));
                ap.put("era", matched != null ? matched[2] : "");
                payload.put("artistProfile", ap);
            } else {
                payload.put("artistProfile", JSONObject.NULL);
            }

            JSONObject insight = new JSONObject();
            if (q.isEmpty()) {
                insight.put("title", "IA Musical LENKYX — Planeta Terra & Espaço Sideral");
                insight.put("summary", "Versões completas gratuitas (sem cortes de 30s) do Brasil, mundo, todas as gerações e sinais cósmicos.");
            } else if (isCosmic) {
                insight.put("title", "IA Cósmica ativada para \"" + q + "\"");
                insight.put("summary", "Músicas espaciais, sons da galáxia e frequências cósmicas completas (" + combined.length() + " faixas).");
            } else {
                insight.put("title", "Busca IA para \"" + q + "\"");
                insight.put("summary", combined.length() + " faixas e clipes oficiais completos prontos para tocar ou assistir na sequência.");
            }
            JSONArray tags = new JSONArray();
            tags.put("100% Completo");
            tags.put("Clipes HD");
            tags.put("Grátis");
            insight.put("tags", tags);
            payload.put("aiInsight", insight);
        } catch (Exception ignored) {
        }
        return payload.toString();
    }

    private static void appendUnique(JSONArray dest, JSONArray src, Set<String> seen) {
        for (int i = 0; i < src.length(); i++) {
            try {
                JSONObject o = src.getJSONObject(i);
                String id = o.optString("id", "");
                if (!id.isEmpty() && !seen.contains(id)) {
                    seen.add(id);
                    o.put("number", dest.length() + 1);
                    dest.put(o);
                }
            } catch (Exception ignored) {
            }
        }
    }

    private static JSONArray searchYouTube(String query, int limit) {
        JSONArray out = new JSONArray();
        try {
            String url = "https://www.youtube.com/results?search_query=" + URLEncoder.encode(query, "UTF-8");
            String html = httpGetText(url, 8000);
            if (html == null) return out;
            Pattern p = Pattern.compile("var ytInitialData = (\\{.*?\\});</script>", Pattern.DOTALL);
            Matcher m = p.matcher(html);
            if (!m.find()) return out;
            JSONObject root = new JSONObject(m.group(1));
            List<JSONObject> renderers = new ArrayList<>();
            collectVideoRenderers(root, renderers);

            Set<String> seen = new HashSet<>();
            for (JSONObject v : renderers) {
                String vid = v.optString("videoId", "");
                if (vid.isEmpty() || seen.contains(vid)) continue;
                seen.add(vid);

                String title = extractRunsText(v.optJSONObject("title"));
                String channel = extractRunsText(v.optJSONObject("ownerText"));
                if (channel.isEmpty()) channel = "Artista";
                channel = channel.replaceAll("(?i) - Topic$", "").trim();

                JSONObject lenObj = v.optJSONObject("lengthText");
                int durSec = parseDurationText(lenObj != null ? lenObj.optString("simpleText", "") : "");
                if (durSec > 0 && durSec < 65) continue;
                if (durSec > 7200) continue;

                String thumb = "https://i.ytimg.com/vi/" + vid + "/hqdefault.jpg";
                JSONObject th = v.optJSONObject("thumbnail");
                if (th != null) {
                    JSONArray ths = th.optJSONArray("thumbnails");
                    if (ths != null && ths.length() > 0) {
                        String u = ths.getJSONObject(ths.length() - 1).optString("url", "");
                        if (!u.isEmpty()) thumb = u;
                    }
                }

                JSONObject t = new JSONObject();
                t.put("id", "yt-" + vid);
                t.put("number", out.length() + 1);
                t.put("title", title);
                t.put("artist", channel);
                t.put("emoji", durSec > 1200 ? "📀" : "🎵");
                t.put("bpm", 120);
                t.put("genre", durSec > 1200 ? "Show / Álbum Completo" : "Versão Completa");
                t.put("youtubeVideoId", vid);
                t.put("audioUrl", "");
                t.put("coverUrl", thumb);
                t.put("externalUrl", "https://www.youtube.com/watch?v=" + vid);
                t.put("durationSec", durSec > 0 ? durSec : 210);
                t.put("source", "world_full");
                t.put("sourceLabel", "Completa (YouTube)");
                t.put("plays", 0);
                t.put("favorite", false);
                JSONObject st = new JSONObject();
                st.put("suno", true);
                st.put("cover", true);
                st.put("app", true);
                st.put("youtube", true);
                st.put("distrokid", false);
                t.put("status", st);
                out.put(t);
                if (out.length() >= limit) break;
            }
        } catch (Exception ignored) {
        }
        return out;
    }

    private static void collectVideoRenderers(Object node, List<JSONObject> out) {
        if (out.size() >= 35 || node == null) return;
        if (node instanceof JSONObject) {
            JSONObject obj = (JSONObject) node;
            JSONObject vr = obj.optJSONObject("videoRenderer");
            if (vr != null && !vr.optString("videoId", "").isEmpty()) {
                out.add(vr);
            }
            Iterator<String> keys = obj.keys();
            while (keys.hasNext()) {
                String k = keys.next();
                collectVideoRenderers(obj.opt(k), out);
            }
        } else if (node instanceof JSONArray) {
            JSONArray arr = (JSONArray) node;
            for (int i = 0; i < arr.length(); i++) {
                collectVideoRenderers(arr.opt(i), out);
            }
        }
    }

    private static String extractRunsText(JSONObject obj) {
        if (obj == null) return "";
        JSONArray runs = obj.optJSONArray("runs");
        if (runs == null) return obj.optString("simpleText", "");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < runs.length(); i++) {
            JSONObject r = runs.optJSONObject(i);
            if (r != null) sb.append(r.optString("text", ""));
        }
        return sb.toString().trim();
    }

    private static int parseDurationText(String txt) {
        if (txt == null || txt.trim().isEmpty()) return 0;
        String[] parts = txt.trim().split(":");
        try {
            if (parts.length == 2) return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
            if (parts.length == 3)
                return Integer.parseInt(parts[0]) * 3600 + Integer.parseInt(parts[1]) * 60 + Integer.parseInt(parts[2]);
        } catch (Exception ignored) {
        }
        return 0;
    }

    private static JSONArray searchAudius(String query, int limit) {
        JSONArray out = new JSONArray();
        try {
            String url = "https://discoveryprovider.audius.co/v1/tracks/search?query="
                    + URLEncoder.encode(query, "UTF-8") + "&limit=" + limit + "&app_name=LENKYX";
            String txt = httpGetText(url, 5000);
            if (txt == null) return out;
            JSONObject json = new JSONObject(txt);
            JSONArray data = json.optJSONArray("data");
            if (data == null) return out;
            for (int i = 0; i < data.length(); i++) {
                JSONObject item = data.optJSONObject(i);
                if (item == null) continue;
                String id = item.optString("id", "");
                double dur = item.optDouble("duration", 0);
                if (id.isEmpty() || dur < 60) continue;
                JSONObject user = item.optJSONObject("user");
                JSONObject art = item.optJSONObject("artwork");
                String cover = art != null ? art.optString("480x480", art.optString("150x150", "/covers/album-official.jpg")) : "/covers/album-official.jpg";

                JSONObject t = new JSONObject();
                t.put("id", "audius-" + id);
                t.put("number", out.length() + 1);
                t.put("title", item.optString("title", "Faixa Global"));
                t.put("artist", user != null ? user.optString("name", "Artista Global") : "Artista Global");
                t.put("emoji", "🎧");
                t.put("bpm", 128);
                t.put("genre", item.optString("genre", "Global"));
                t.put("audioUrl", "https://discoveryprovider.audius.co/v1/tracks/" + id + "/stream?app_name=LENKYX");
                t.put("coverUrl", cover);
                t.put("externalUrl", "https://audius.co" + item.optString("permalink", ""));
                t.put("durationSec", (int) Math.round(dur));
                t.put("source", "world_full");
                t.put("sourceLabel", "MP3 Completo (Audius)");
                t.put("plays", item.optInt("play_count", 0));
                t.put("favorite", false);
                out.put(t);
            }
        } catch (Exception ignored) {
        }
        return out;
    }

    private static JSONObject fetchArtistPhotoAndBio(String artistName, String lang, String wikiSlug) {
        String key = lang + ":" + (wikiSlug != null && !wikiSlug.isEmpty() ? wikiSlug : artistName.toLowerCase(Locale.ROOT));
        if (wikiCache.containsKey(key)) return wikiCache.get(key);

        JSONObject got = null;
        if (wikiSlug != null && !wikiSlug.isEmpty()) {
            got = tryWikiSummary(lang, wikiSlug, artistName);
        }
        if (got == null) {
            try {
                String sUrl = "https://" + lang + ".wikipedia.org/w/api.php?action=query&list=search&srsearch="
                        + URLEncoder.encode(artistName + (lang.equals("pt") ? " cantor OR dupla OR banda" : " singer OR band"), "UTF-8")
                        + "&format=json&srlimit=2";
                String sTxt = httpGetText(sUrl, 3500);
                if (sTxt != null) {
                    JSONArray hits = new JSONObject(sTxt).optJSONObject("query").optJSONArray("search");
                    if (hits != null && hits.length() > 0) {
                        String title = hits.getJSONObject(0).optString("title", "").replace(" ", "_");
                        got = tryWikiSummary(lang, title, artistName);
                    }
                }
            } catch (Exception ignored) {
            }
        }
        if (got == null || got.optString("photoUrl", "").isEmpty()) {
            try {
                String itUrl = "https://itunes.apple.com/search?term=" + URLEncoder.encode(artistName, "UTF-8")
                        + "&entity=song&limit=1&country=" + (lang.equals("pt") ? "BR" : "US");
                String itTxt = httpGetText(itUrl, 3500);
                if (itTxt != null) {
                    JSONArray res = new JSONObject(itTxt).optJSONArray("results");
                    if (res != null && res.length() > 0) {
                        JSONObject first = res.getJSONObject(0);
                        String art100 = first.optString("artworkUrl100", "");
                        if (!art100.isEmpty()) {
                            got = new JSONObject();
                            got.put("name", first.optString("artistName", artistName));
                            got.put("photoUrl", art100.replace("100x100bb", "600x600bb"));
                            got.put("bio", first.optString("artistName", artistName) + " · " + first.optString("primaryGenreName", "Música"));
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }
        if (got != null) wikiCache.put(key, got);
        return got;
    }

    private static JSONObject tryWikiSummary(String lang, String slug, String fallbackName) {
        try {
            String url = "https://" + lang + ".wikipedia.org/api/rest_v1/page/summary/" + URLEncoder.encode(slug, "UTF-8").replace("+", "%20");
            String txt = httpGetText(url, 3500);
            if (txt == null) return null;
            JSONObject d = new JSONObject(txt);
            String photo = "";
            if (d.has("originalimage")) photo = d.getJSONObject("originalimage").optString("source", "");
            if (photo.isEmpty() && d.has("thumbnail")) photo = d.getJSONObject("thumbnail").optString("source", "");
            if (photo.isEmpty()) return null;
            JSONObject o = new JSONObject();
            o.put("name", d.optString("title", fallbackName));
            o.put("photoUrl", photo);
            String ex = d.optString("extract", "");
            o.put("bio", ex.length() > 220 ? ex.substring(0, 220) : ex);
            return o;
        } catch (Exception e) {
            return null;
        }
    }

    public static byte[] downloadRemoteBytes(String rawUrl) {
        try {
            URL u = new URL(rawUrl);
            String host = u.getHost().toLowerCase(Locale.ROOT);
            if (!"https".equalsIgnoreCase(u.getProtocol())) return null;
            boolean ok = host.endsWith(".suno.ai") || host.endsWith(".suno.com")
                    || host.contains("audius") || host.endsWith(".archive.org") || host.equals("archive.org");
            if (!ok) return null;
            HttpURLConnection conn = (HttpURLConnection) u.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(25000);
            conn.setRequestProperty("User-Agent", UA);
            if (conn.getResponseCode() >= 400) return null;
            try (InputStream is = conn.getInputStream()) {
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                byte[] buf = new byte[16384];
                int n;
                while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
                return bos.toByteArray();
            }
        } catch (Exception e) {
            return null;
        }
    }

    private static String pickBestMovieThumb(JSONObject vr, String vid) {
        try {
            JSONObject th = vr.optJSONObject("thumbnail");
            if (th != null) {
                JSONArray arr = th.optJSONArray("thumbnails");
                if (arr != null && arr.length() > 0) {
                    String bestUrl = "";
                    int bestW = -1;
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject t = arr.optJSONObject(i);
                        if (t == null) continue;
                        int w = t.optInt("width", 0);
                        String u = t.optString("url", "");
                        if (!u.isEmpty() && w >= bestW) {
                            bestW = w;
                            bestUrl = u;
                        }
                    }
                    if (!bestUrl.isEmpty()) return bestUrl;
                }
            }
        } catch (Exception ignored) {
        }
        return "https://i.ytimg.com/vi/" + vid + "/hqdefault.jpg";
    }

    private static JSONArray fetchMoviesList(String query, String category, boolean isTrailer, String mediaType) {
        final List<JSONObject> scored = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        String mType = (mediaType == null || mediaType.trim().isEmpty()) ? "movie" : mediaType.trim().toLowerCase(Locale.ROOT);
        int minDurSec = isTrailer ? 0 : (("series".equals(mType) || "anime".equals(mType)) ? 720 : 1500);

        String[] urls;
        try {
            String enc = URLEncoder.encode(query, "UTF-8");
            urls = new String[]{
                    "https://www.youtube.com/results?search_query=" + enc + "&sp=EgIgAQ%253D%253D",
                    "https://www.youtube.com/results?search_query=" + enc
            };
        } catch (Exception e) {
            return new JSONArray();
        }

        for (String ytUrl : urls) {
            if (scored.size() >= 18) break;
            try {
                String html = httpGetText(ytUrl, 7000);
                if (html == null) continue;
                String marker = "var ytInitialData = ";
                int idx = html.indexOf(marker);
                if (idx < 0) continue;
                int start = idx + marker.length();
                int end = html.indexOf(";</script>", start);
                if (end <= start) continue;

                JSONObject data = new JSONObject(html.substring(start, end));
                List<JSONObject> renderers = new ArrayList<>();
                collectVideoRenderers(data, renderers);
                for (JSONObject vr : renderers) {
                    String vid = vr.optString("videoId", "");
                    if (vid.isEmpty() || seen.contains(vid)) continue;
                    String durText = "";
                    JSONObject lt = vr.optJSONObject("lengthText");
                    if (lt != null) durText = lt.optString("simpleText", "");
                    int durSec = parseDurationText(durText);
                    if (!isTrailer && durSec > 0 && durSec < minDurSec) continue;
                    if (isTrailer && durSec > 480) continue;

                    String title = extractRunsText(vr.optJSONObject("title"));
                    String channel = extractRunsText(vr.optJSONObject("ownerText"));
                    if (title.isEmpty()) title = "Filme HD";
                    if (channel.isEmpty()) channel = "Cinema HD";

                    StringBuilder badgeTxt = new StringBuilder();
                    JSONArray badges = vr.optJSONArray("badges");
                    if (badges != null) {
                        for (int b = 0; b < badges.length(); b++) {
                            JSONObject bObj = badges.optJSONObject(b);
                            if (bObj != null && bObj.has("metadataBadgeRenderer")) {
                                badgeTxt.append(" ").append(bObj.getJSONObject("metadataBadgeRenderer").optString("label", ""));
                            }
                        }
                    }

                    String low = (title + " " + badgeTxt.toString()).toLowerCase(Locale.ROOT);
                    String qLow = query.toLowerCase(Locale.ROOT);
                    String qualityLabel = "HD 720p+";
                    int score = 10;
                    if (low.contains("4k") || low.contains("2160p") || low.contains("ultra hd")) {
                        qualityLabel = "4K Ultra HD";
                        score += 40;
                    } else if (low.contains("1080") || low.contains("full hd") || low.contains("fhd")) {
                        qualityLabel = "Full HD 1080p";
                        score += 30;
                    } else if (low.contains("hd")) {
                        score += 18;
                    }
                    boolean isDubbed = low.contains("dublado") || low.contains("pt-br") || low.contains("portugues")
                            || low.contains("português") || qLow.contains("dublado");
                    if (isDubbed) score += 25;
                    if (low.contains("completo") || low.contains("episódio") || low.contains("episodio") || low.contains("temporada")) {
                        score += 10;
                    }

                    String resolvedType = mType;
                    if (isTrailer) resolvedType = "trailer";
                    else if ("anime".equals(mType) || low.contains("anime")) resolvedType = "anime";
                    else if ("series".equals(mType) || low.contains("série") || low.contains("serie") || low.contains("temporada") || low.contains("episod")) {
                        resolvedType = "series";
                    }

                    String sourceLabel = "Filme Completo";
                    if ("trailer".equals(resolvedType)) sourceLabel = "Trailer Oficial";
                    else if ("anime".equals(resolvedType)) sourceLabel = "Anime HD";
                    else if ("series".equals(resolvedType)) sourceLabel = "Série HD";

                    seen.add(vid);
                    JSONObject m = new JSONObject();
                    m.put("_score", score);
                    m.put("id", "ytmov-" + vid);
                    m.put("title", title);
                    m.put("subtitle", channel);
                    m.put("category", category);
                    m.put("durationLabel", durText.isEmpty() ? (isTrailer ? "Trailer HD" : "Completo HD") : durText);
                    m.put("posterUrl", pickBestMovieThumb(vr, vid));
                    m.put("youtubeVideoId", vid);
                    m.put("externalUrl", "https://www.youtube.com/watch?v=" + vid);
                    m.put("isTrailer", isTrailer);
                    m.put("sourceLabel", sourceLabel);
                    m.put("qualityLabel", qualityLabel);
                    m.put("isDubbed", isDubbed);
                    m.put("mediaType", resolvedType);
                    scored.add(m);
                    if (scored.size() >= 24) break;
                }
            } catch (Exception ignored) {
            }
        }

        Collections.sort(scored, new Comparator<JSONObject>() {
            @Override
            public int compare(JSONObject a, JSONObject b) {
                return Integer.compare(b.optInt("_score", 0), a.optInt("_score", 0));
            }
        });

        JSONArray items = new JSONArray();
        for (int i = 0; i < Math.min(18, scored.size()); i++) {
            JSONObject obj = scored.get(i);
            obj.remove("_score");
            items.put(obj);
        }
        return items;
    }

    public static String getMoviesDirectoryJson() {
        final String[][] cats = new String[][]{
                {"cat-internacionais-dub", "Top Internacionais Dublados (Full HD)", "🌍", "melhores filmes internacionais completos dublados portugues full hd 1080p", "0", "movie"},
                {"cat-sequencias", "Sagas, Sequências & Continuações (Parte 1, 2, 3...)", "🎞️", "filme completo parte 1 parte 2 saga sequencia dublado hd", "0", "movie"},
                {"cat-series", "Séries Internacionais & Episódios Dublados (HD)", "📺", "serie internacional completa dublado portugues episodio hd", "0", "series"},
                {"cat-animes", "Animes Completos & Filmes Anime Dublados (HD)", "⛩️", "anime completo dublado portugues filme episodio full hd", "0", "anime"},
                {"cat-acao", "Ação, Policial & Luta (Internacionais Dublados)", "🔥", "filme de acao internacional completo dublado 1080p hd", "0", "movie"},
                {"cat-scifi", "Ficção Científica & Espaço (Dublados HD)", "🚀", "filme completo ficcao cientifica espaco dublado full hd", "0", "movie"},
                {"cat-terror", "Terror, Suspense & Mistério (Dublados HD)", "👻", "filme completo terror suspense internacional dublado hd", "0", "movie"},
                {"cat-trailers", "Lançamentos Cinema — Trailers Oficiais 4K/HD", "🎬", "trailer oficial lancamento cinema 2026 dublado 4k hd", "1", "trailer"},
                {"cat-classicos", "Documentários Espaciais & Clássicos 4K/HD", "🛸", "documentario universo nasa completo dublado 4k hd", "0", "movie"}
        };
        JSONArray arr = new JSONArray();
        ExecutorService pool = Executors.newFixedThreadPool(6);
        List<Future<JSONObject>> futs = new ArrayList<>();
        for (final String[] c : cats) {
            futs.add(pool.submit(new Callable<JSONObject>() {
                @Override
                public JSONObject call() throws Exception {
                    JSONObject catObj = new JSONObject();
                    catObj.put("id", c[0]);
                    catObj.put("title", c[1]);
                    catObj.put("emoji", c[2]);
                    catObj.put("query", c[3]);
                    boolean tr = "1".equals(c[4]);
                    catObj.put("isTrailerCategory", tr);
                    catObj.put("mediaType", c[5]);
                    catObj.put("movies", fetchMoviesList(c[3], c[1], tr, c[5]));
                    return catObj;
                }
            }));
        }
        for (Future<JSONObject> f : futs) {
            try {
                arr.put(f.get());
            } catch (Exception ignored) {
            }
        }
        pool.shutdown();
        JSONObject out = new JSONObject();
        try {
            out.put("categories", arr);
        } catch (Exception ignored) {
        }
        return out.toString();
    }

    public static String searchMoviesJson(String query, boolean isTrailer, String mediaType) {
        JSONObject out = new JSONObject();
        try {
            String clean = (query == null || query.trim().isEmpty()) ? "filme internacional completo dublado full hd" : query.trim();
            out.put("movies", fetchMoviesList(clean, clean, isTrailer, mediaType));
        } catch (Exception ignored) {
        }
        return out.toString();
    }

    private static volatile List<JSONObject> cachedTvChannels = null;
    private static volatile long cachedTvTs = 0L;

    public static class TvProxyResult {
        public final String contentType;
        public final byte[] body;
        public TvProxyResult(String ct, byte[] b) { this.contentType = ct; this.body = b; }
    }

    public static TvProxyResult proxyLiveTvUrl(String rawUrl) {
        if (rawUrl == null || !rawUrl.startsWith("https://")) return null;
        try {
            URL u = new URL(rawUrl);
            String host = u.getHost().toLowerCase(Locale.ROOT);
            if ("localhost".equals(host) || host.startsWith("127.") || host.startsWith("10.")
                    || host.startsWith("192.168.") || host.startsWith("169.254.")) return null;
            HttpURLConnection conn = (HttpURLConnection) u.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setConnectTimeout(9000);
            conn.setReadTimeout(12000);
            conn.setRequestProperty("User-Agent", UA);
            if (conn.getResponseCode() >= 400) return null;
            String finalUrl = conn.getURL().toString();
            String ct = conn.getContentType() != null ? conn.getContentType() : "application/octet-stream";
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            try (InputStream is = conn.getInputStream()) {
                byte[] buf = new byte[16384];
                int n;
                while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
            }
            byte[] raw = bos.toByteArray();
            if (ct.contains("mpegurl") || finalUrl.toLowerCase(Locale.ROOT).contains(".m3u8")) {
                String txt = new String(raw, StandardCharsets.UTF_8);
                String[] lines = txt.split("\\r?\\n");
                StringBuilder sb = new StringBuilder();
                URL baseUrl = new URL(finalUrl);
                for (String line : lines) {
                    String tr = line.trim();
                    if (tr.isEmpty()) { sb.append("\n"); continue; }
                    if (tr.startsWith("#")) {
                        sb.append(line).append("\n");
                    } else {
                        String abs = new URL(baseUrl, tr).toString();
                        sb.append("/api/tv-proxy?url=").append(URLEncoder.encode(abs, "UTF-8")).append("\n");
                    }
                }
                return new TvProxyResult("application/vnd.apple.mpegurl", sb.toString().getBytes(StandardCharsets.UTF_8));
            }
            return new TvProxyResult(ct, raw);
        } catch (Exception e) {
            return null;
        }
    }

    private static List<JSONObject> loadAllLiveTvChannels() {
        if (cachedTvChannels != null && System.currentTimeMillis() - cachedTvTs < 1000L * 60L * 30L) {
            return cachedTvChannels;
        }
        List<JSONObject> list = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        try {
            JSONObject nasa = new JSONObject();
            nasa.put("id", "NASA-TV-Public");
            nasa.put("name", "NASA TV Public (Espaço 4K/HD)");
            nasa.put("country", "US");
            nasa.put("network", "NASA");
            nasa.put("categories", new JSONArray("[\"science\",\"documentary\"]"));
            nasa.put("quality", "1080p");
            nasa.put("logo", "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/320px-NASA_logo.svg.png");
            nasa.put("streamUrl", "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8");
            list.add(nasa);
            seen.add("NASA-TV-Public");

            JSONObject rb = new JSONObject();
            rb.put("id", "RedBull-TV-Global");
            rb.put("name", "Red Bull TV (Esportes & Ação)");
            rb.put("country", "AT");
            rb.put("network", "Red Bull");
            rb.put("categories", new JSONArray("[\"sports\",\"entertainment\"]"));
            rb.put("quality", "1080p");
            rb.put("logo", "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/RedBullEnergyDrink.svg/320px-RedBullEnergyDrink.svg.png");
            rb.put("streamUrl", "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8");
            list.add(rb);
            seen.add("RedBull-TV-Global");
        } catch (Exception ignored) {
        }

        try {
            String stTxt = httpGetText("https://iptv-org.github.io/api/streams.json", 9000);
            String chTxt = httpGetText("https://iptv-org.github.io/api/channels.json", 9000);
            String lgTxt = httpGetText("https://iptv-org.github.io/api/logos.json", 9000);
            if (stTxt != null && chTxt != null) {
                JSONArray streams = new JSONArray(stTxt);
                JSONArray channels = new JSONArray(chTxt);
                ConcurrentHashMap<String, JSONObject> chMap = new ConcurrentHashMap<>();
                for (int i = 0; i < channels.length(); i++) {
                    JSONObject c = channels.optJSONObject(i);
                    if (c != null && !c.optString("id", "").isEmpty()) chMap.put(c.getString("id"), c);
                }
                ConcurrentHashMap<String, String> lgMap = new ConcurrentHashMap<>();
                if (lgTxt != null) {
                    JSONArray logos = new JSONArray(lgTxt);
                    for (int i = 0; i < logos.length(); i++) {
                        JSONObject l = logos.optJSONObject(i);
                        if (l == null) continue;
                        String cid = l.optString("channel", "");
                        String u = l.optString("url", "");
                        if (!cid.isEmpty() && u.startsWith("https://") && !lgMap.containsKey(cid)) lgMap.put(cid, u);
                    }
                }
                for (int i = 0; i < streams.length(); i++) {
                    JSONObject s = streams.optJSONObject(i);
                    if (s == null) continue;
                    String cid = s.optString("channel", "");
                    String sUrl = s.optString("url", "");
                    if (cid.isEmpty() || seen.contains(cid) || !sUrl.startsWith("https://")) continue;
                    JSONArray labels = s.optJSONArray("labels");
                    String labStr = labels != null ? labels.toString().toLowerCase(Locale.ROOT) : "";
                    if (labStr.contains("geo-blocked") || labStr.contains("not 24/7")) continue;
                    JSONObject c = chMap.get(cid);
                    if (c == null || c.optBoolean("is_nsfw", false) || !c.optString("closed", "").isEmpty()) continue;
                    seen.add(cid);
                    JSONObject item = new JSONObject();
                    item.put("id", cid);
                    item.put("name", c.optString("name", cid));
                    item.put("country", c.optString("country", "INT").toUpperCase(Locale.ROOT));
                    item.put("network", c.optString("network", ""));
                    item.put("categories", c.optJSONArray("categories") != null ? c.optJSONArray("categories") : new JSONArray("[\"general\"]"));
                    item.put("quality", s.optString("quality", "HD"));
                    item.put("logo", lgMap.containsKey(cid) ? lgMap.get(cid) : "");
                    item.put("streamUrl", sUrl);
                    list.add(item);
                }
            }
        } catch (Exception ignored) {
        }
        cachedTvChannels = list;
        cachedTvTs = System.currentTimeMillis();
        return list;
    }

    public static String getLiveTvDirectoryJson() {
        List<JSONObject> all = loadAllLiveTvChannels();
        JSONArray cats = new JSONArray();
        String[][] defs = new String[][]{
                {"tv-brasil", "🇧🇷 Brasil Ao Vivo — Canais Abertos & HD", "🇧🇷", "BR"},
                {"tv-filmes", "🎬 Canais de Filmes & Séries 24h (Pluto TV & Mundo)", "🎬", "movies"},
                {"tv-animes", "⛩️ Animes, Desenhos & Animação 24h", "⛩️", "animation"},
                {"tv-esportes", "⚽ Esportes, Lutas & Ação Mundial", "⚽", "sports"},
                {"tv-noticias", "📰 Notícias & Atualidades do Mundo", "📰", "news"},
                {"tv-musica-espaco", "🎵 Música, Shows, Ciência & Espaço (NASA)", "🛸", "music"}
        };
        try {
            for (String[] d : defs) {
                JSONObject co = new JSONObject();
                co.put("id", d[0]);
                co.put("title", d[1]);
                co.put("emoji", d[2]);
                JSONArray chs = new JSONArray();
                for (JSONObject ch : all) {
                    if (chs.length() >= 30) break;
                    if ("BR".equals(d[3])) {
                        if ("BR".equals(ch.optString("country"))) chs.put(ch);
                    } else {
                        String cStr = ch.optJSONArray("categories") != null ? ch.optJSONArray("categories").toString().toLowerCase(Locale.ROOT) : "";
                        boolean match = cStr.contains(d[3])
                                || ("movies".equals(d[3]) && cStr.contains("series"))
                                || ("animation".equals(d[3]) && cStr.contains("kids"))
                                || ("music".equals(d[3]) && (cStr.contains("science") || cStr.contains("documentary") || cStr.contains("entertainment")));
                        if (match) chs.put(ch);
                    }
                }
                co.put("channels", chs);
                cats.put(co);
            }
            JSONObject out = new JSONObject();
            out.put("totalAvailable", all.size());
            out.put("categories", cats);
            return out.toString();
        } catch (Exception e) {
            return "{\"totalAvailable\":0,\"categories\":[]}";
        }
    }

    public static String searchLiveTvJson(String query, String country) {
        List<JSONObject> all = loadAllLiveTvChannels();
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String cCode = country == null ? "" : country.trim().toUpperCase(Locale.ROOT);
        JSONArray outCh = new JSONArray();
        for (JSONObject ch : all) {
            if (!cCode.isEmpty() && !"ALL".equals(cCode) && !cCode.equals(ch.optString("country"))) continue;
            if (!q.isEmpty()) {
                String hay = (ch.optString("name") + " " + ch.optString("country") + " " + ch.optString("network") + " "
                        + (ch.optJSONArray("categories") != null ? ch.optJSONArray("categories").toString() : "")).toLowerCase(Locale.ROOT);
                if (!hay.contains(q)) continue;
            }
            outCh.put(ch);
            if (outCh.length() >= 80) break;
        }
        JSONObject out = new JSONObject();
        try {
            out.put("totalAvailable", all.size());
            out.put("channels", outCh);
        } catch (Exception ignored) {
        }
        return out.toString();
    }

    public static String getAppUpdateJson(int installedVersionCode) {
        JSONObject res = new JSONObject();
        try {
            res.put("installedVersionCode", installedVersionCode);
            res.put("latestVersionCode", installedVersionCode);
            res.put("latestVersionName", "2.1.0");
            res.put("updateAvailable", false);
            res.put("apkUrl", "https://lenkyx-cosmic-phonk.onrender.com/download/apk");
            res.put("releaseNotes", "");

            String supaUrl = "https://uzififnhdzfobynsbcgk.supabase.co/rest/v1/lenkyx_app_manifest?id=eq.android&select=*";
            String anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aWZpZm5oZHpmb2J5bnNiY2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4ODI1OTUsImV4cCI6MjExMDQ1ODU5NX0.oIl5j0RwZ0yuKBbCToUsuypAihT9y3jBY4gN2EMNylA";
            HttpURLConnection conn = (HttpURLConnection) new URL(supaUrl).openConnection();
            conn.setConnectTimeout(4500);
            conn.setReadTimeout(4500);
            conn.setRequestProperty("apikey", anon);
            conn.setRequestProperty("Authorization", "Bearer " + anon);
            if (conn.getResponseCode() < 400) {
                try (InputStream is = conn.getInputStream()) {
                    ByteArrayOutputStream bos = new ByteArrayOutputStream();
                    byte[] buf = new byte[4096];
                    int n;
                    while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
                    JSONArray arr = new JSONArray(new String(bos.toByteArray(), StandardCharsets.UTF_8));
                    if (arr.length() > 0) {
                        JSONObject row = arr.getJSONObject(0);
                        int remoteCode = row.optInt("version_code", installedVersionCode);
                        res.put("latestVersionCode", remoteCode);
                        res.put("latestVersionName", row.optString("version_name", "2.0.7"));
                        res.put("apkUrl", row.optString("apk_url", res.getString("apkUrl")));
                        res.put("releaseNotes", row.optString("release_notes", ""));
                        res.put("updateAvailable", remoteCode > installedVersionCode);
                    }
                }
            }
            conn.disconnect();
        } catch (Exception ignored) {
        }
        return res.toString();
    }

    private static String httpGetText(String urlStr, int timeoutMs) {
        HttpURLConnection conn = null;
        try {
            URL u = new URL(urlStr);
            conn = (HttpURLConnection) u.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setRequestProperty("User-Agent", UA);
            if (conn.getResponseCode() >= 400) return null;
            try (InputStream is = conn.getInputStream()) {
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                byte[] buf = new byte[8192];
                int n;
                while ((n = is.read(buf)) != -1) bos.write(buf, 0, n);
                return new String(bos.toByteArray(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            return null;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}
