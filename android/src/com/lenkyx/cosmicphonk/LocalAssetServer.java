package com.lenkyx.cosmicphonk;

import android.content.res.AssetManager;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public class LocalAssetServer {
    private final AssetManager assets;
    private final int installedVersionCode;
    private ServerSocket serverSocket;
    private volatile boolean running = false;
    private int port = 0;

    public LocalAssetServer(AssetManager assets, int installedVersionCode) {
        this.assets = assets;
        this.installedVersionCode = installedVersionCode;
    }

    public int start() throws IOException {
        int[] preferredPorts = new int[]{47391, 47392, 47393, 0};
        IOException lastErr = null;
        for (int candidate : preferredPorts) {
            try {
                ServerSocket ss = new ServerSocket();
                ss.setReuseAddress(true);
                ss.bind(new java.net.InetSocketAddress(InetAddress.getByName("127.0.0.1"), candidate), 64);
                serverSocket = ss;
                break;
            } catch (IOException e) {
                lastErr = e;
            }
        }
        if (serverSocket == null) {
            throw lastErr != null ? lastErr : new IOException("Unable to bind local server port");
        }
        port = serverSocket.getLocalPort();
        running = true;

        Thread acceptThread = new Thread(new Runnable() {
            @Override
            public void run() {
                while (running) {
                    try {
                        final Socket client = serverSocket.accept();
                        Thread worker = new Thread(new Runnable() {
                            @Override
                            public void run() {
                                handleClient(client);
                            }
                        });
                        worker.setDaemon(true);
                        worker.start();
                    } catch (IOException e) {
                        if (!running) break;
                    }
                }
            }
        });
        acceptThread.setDaemon(true);
        acceptThread.start();
        return port;
    }

    private void sendJson(OutputStream out, String json) throws IOException {
        byte[] b = json.getBytes(StandardCharsets.UTF_8);
        String hdr = "HTTP/1.1 200 OK\r\n"
                + "Content-Type: application/json; charset=utf-8\r\n"
                + "Access-Control-Allow-Origin: *\r\n"
                + "Cache-Control: no-store\r\n"
                + "Content-Length: " + b.length + "\r\n"
                + "Connection: close\r\n\r\n";
        out.write(hdr.getBytes(StandardCharsets.US_ASCII));
        out.write(b);
        out.flush();
    }

    private String extractQueryParam(String qs, String key) {
        if (qs == null || qs.isEmpty()) return "";
        String[] pairs = qs.split("&");
        for (String pair : pairs) {
            int eq = pair.indexOf('=');
            if (eq <= 0) continue;
            try {
                String k = URLDecoder.decode(pair.substring(0, eq), "UTF-8");
                if (key.equals(k)) {
                    return URLDecoder.decode(pair.substring(eq + 1), "UTF-8");
                }
            } catch (Exception ignored) {
            }
        }
        return "";
    }

    public void stop() {
        running = false;
        if (serverSocket != null) {
            try {
                serverSocket.close();
            } catch (IOException ignored) {
            }
        }
    }

    private void handleClient(Socket socket) {
        try {
            socket.setSoTimeout(15000);
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(socket.getInputStream(), StandardCharsets.US_ASCII));
            OutputStream out = socket.getOutputStream();

            String requestLine = reader.readLine();
            if (requestLine == null || requestLine.isEmpty()) {
                socket.close();
                return;
            }

            String[] parts = requestLine.split(" ");
            String method = parts.length > 0 ? parts[0] : "GET";
            String rawPath = parts.length > 1 ? parts[1] : "/";

            String rangeHeader = null;
            String line;
            while ((line = reader.readLine()) != null && !line.isEmpty()) {
                if (line.toLowerCase(Locale.US).startsWith("range:")) {
                    rangeHeader = line.substring(6).trim();
                }
            }

            String queryStr = "";
            int qIdx = rawPath.indexOf('?');
            if (qIdx >= 0) {
                queryStr = rawPath.substring(qIdx + 1);
                rawPath = rawPath.substring(0, qIdx);
            }
            String cleanPath = URLDecoder.decode(rawPath, "UTF-8");

            // Handle native Android API routes directly on the phone (zero Render dependency!)
            if ("/api/app-update".equals(cleanPath)) {
                sendJson(out, WorldMusicBridge.getAppUpdateJson(installedVersionCode));
                socket.close();
                return;
            }
            if ("/api/world-directory".equals(cleanPath)) {
                sendJson(out, WorldMusicBridge.getDirectoryJson());
                socket.close();
                return;
            }
            if ("/api/world-trending".equals(cleanPath)) {
                sendJson(out, WorldMusicBridge.searchJson("", false));
                socket.close();
                return;
            }
            if ("/api/world-search".equals(cleanPath)) {
                String qVal = extractQueryParam(queryStr, "q");
                String spVal = extractQueryParam(queryStr, "space");
                boolean incSpace = "1".equals(spVal) || "true".equalsIgnoreCase(spVal);
                sendJson(out, WorldMusicBridge.searchJson(qVal, incSpace));
                socket.close();
                return;
            }
            if ("/api/movies-directory".equals(cleanPath)) {
                sendJson(out, WorldMusicBridge.getMoviesDirectoryJson());
                socket.close();
                return;
            }
            if ("/api/movies-search".equals(cleanPath)) {
                String qVal = extractQueryParam(queryStr, "q");
                String trVal = extractQueryParam(queryStr, "trailer");
                String typeVal = extractQueryParam(queryStr, "type");
                boolean isTr = "1".equals(trVal) || "true".equalsIgnoreCase(trVal);
                sendJson(out, WorldMusicBridge.searchMoviesJson(qVal, isTr, typeVal));
                socket.close();
                return;
            }
            if ("/api/tv-directory".equals(cleanPath)) {
                sendJson(out, WorldMusicBridge.getLiveTvDirectoryJson());
                socket.close();
                return;
            }
            if ("/api/tv-search".equals(cleanPath)) {
                String qVal = extractQueryParam(queryStr, "q");
                String cVal = extractQueryParam(queryStr, "country");
                sendJson(out, WorldMusicBridge.searchLiveTvJson(qVal, cVal));
                socket.close();
                return;
            }
            if ("/api/tv-proxy".equals(cleanPath)) {
                String uVal = extractQueryParam(queryStr, "url");
                WorldMusicBridge.TvProxyResult prox = WorldMusicBridge.proxyLiveTvUrl(uVal);
                if (prox == null || prox.body == null) {
                    byte[] nf = "Unavailable".getBytes(StandardCharsets.UTF_8);
                    String hdr = "HTTP/1.1 502 Bad Gateway\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: "
                            + nf.length + "\r\nConnection: close\r\n\r\n";
                    out.write(hdr.getBytes(StandardCharsets.US_ASCII));
                    out.write(nf);
                } else {
                    String hdr = "HTTP/1.1 200 OK\r\nContent-Type: " + prox.contentType
                            + "\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: "
                            + prox.body.length + "\r\nConnection: close\r\n\r\n";
                    out.write(hdr.getBytes(StandardCharsets.US_ASCII));
                    out.write(prox.body);
                }
                out.flush();
                socket.close();
                return;
            }
            if ("/api/audio-proxy".equals(cleanPath)) {
                String uVal = extractQueryParam(queryStr, "url");
                byte[] media = WorldMusicBridge.downloadRemoteBytes(uVal);
                if (media == null) {
                    byte[] nf = "{\"error\":\"Unavailable\"}".getBytes(StandardCharsets.UTF_8);
                    String hdr = "HTTP/1.1 502 Bad Gateway\r\nContent-Type: application/json\r\nContent-Length: "
                            + nf.length + "\r\nConnection: close\r\n\r\n";
                    out.write(hdr.getBytes(StandardCharsets.US_ASCII));
                    out.write(nf);
                } else {
                    String hdr = "HTTP/1.1 200 OK\r\nContent-Type: audio/mpeg\r\nAccess-Control-Allow-Origin: *\r\nContent-Length: "
                            + media.length + "\r\nConnection: close\r\n\r\n";
                    out.write(hdr.getBytes(StandardCharsets.US_ASCII));
                    out.write(media);
                }
                out.flush();
                socket.close();
                return;
            }

            if (cleanPath.equals("/") || cleanPath.isEmpty()) {
                cleanPath = "/index.html";
            }
            // Prevent path traversal
            cleanPath = cleanPath.replace("..", "");
            if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);

            String assetPath = "www/" + cleanPath;
            byte[] data = readAssetBytes(assetPath);
            if (data == null && !cleanPath.contains(".")) {
                assetPath = "www/index.html";
                data = readAssetBytes(assetPath);
            }

            if (data == null) {
                byte[] notFound = "Not Found".getBytes(StandardCharsets.UTF_8);
                String hdr = "HTTP/1.1 404 Not Found\r\n"
                        + "Content-Type: text/plain\r\n"
                        + "Content-Length: " + notFound.length + "\r\n"
                        + "Connection: close\r\n\r\n";
                out.write(hdr.getBytes(StandardCharsets.US_ASCII));
                out.write(notFound);
                out.flush();
                socket.close();
                return;
            }

            String mime = guessMime(assetPath);
            int totalLen = data.length;
            int start = 0;
            int end = totalLen - 1;
            boolean partial = false;

            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                try {
                    String spec = rangeHeader.substring(6).trim();
                    int comma = spec.indexOf(',');
                    if (comma >= 0) spec = spec.substring(0, comma);
                    int dash = spec.indexOf('-');
                    if (dash >= 0) {
                        String s1 = spec.substring(0, dash).trim();
                        String s2 = spec.substring(dash + 1).trim();
                        if (!s1.isEmpty()) start = Integer.parseInt(s1);
                        if (!s2.isEmpty()) end = Integer.parseInt(s2);
                        if (start < 0) start = 0;
                        if (end >= totalLen) end = totalLen - 1;
                        if (start <= end) partial = true;
                    }
                } catch (Exception ignored) {
                    start = 0;
                    end = totalLen - 1;
                    partial = false;
                }
            }

            int contentLen = (end - start) + 1;
            StringBuilder hdr = new StringBuilder();
            hdr.append(partial ? "HTTP/1.1 206 Partial Content\r\n" : "HTTP/1.1 200 OK\r\n");
            hdr.append("Content-Type: ").append(mime).append("\r\n");
            hdr.append("Accept-Ranges: bytes\r\n");
            hdr.append("Access-Control-Allow-Origin: *\r\n");
            if (partial) {
                hdr.append("Content-Range: bytes ").append(start).append("-").append(end).append("/").append(totalLen).append("\r\n");
            }
            hdr.append("Content-Length: ").append(contentLen).append("\r\n");
            hdr.append("Cache-Control: no-cache\r\n");
            hdr.append("Connection: close\r\n\r\n");

            out.write(hdr.toString().getBytes(StandardCharsets.US_ASCII));
            if (!"HEAD".equalsIgnoreCase(method)) {
                out.write(data, start, contentLen);
            }
            out.flush();
        } catch (Exception ignored) {
        } finally {
            try {
                socket.close();
            } catch (IOException ignored) {
            }
        }
    }

    private byte[] readAssetBytes(String path) {
        InputStream in = null;
        try {
            in = new BufferedInputStream(assets.open(path));
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) != -1) {
                bos.write(buf, 0, n);
            }
            return bos.toByteArray();
        } catch (IOException e) {
            return null;
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException ignored) {
                }
            }
        }
    }

    private String guessMime(String path) {
        String p = path.toLowerCase(Locale.US);
        if (p.endsWith(".html")) return "text/html; charset=utf-8";
        if (p.endsWith(".js") || p.endsWith(".mjs")) return "application/javascript; charset=utf-8";
        if (p.endsWith(".css")) return "text/css; charset=utf-8";
        if (p.endsWith(".json")) return "application/json; charset=utf-8";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".wav")) return "audio/wav";
        if (p.endsWith(".mp3")) return "audio/mpeg";
        if (p.endsWith(".ogg")) return "audio/ogg";
        if (p.endsWith(".webm")) return "video/webm";
        if (p.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }
}
