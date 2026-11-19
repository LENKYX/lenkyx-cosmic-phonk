package com.lenkyx.cosmicphonk;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int NOTIF_PERM_REQUEST = 1002;
    private static final int DEVICE_AUTH_REQUEST = 2026;

    private WebView webView;
    private LocalAssetServer server;
    private ValueCallback<Uri[]> filePathCallback;
    private BroadcastReceiver mediaCmdReceiver;
    private View customVideoView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private FrameLayout rootContainer;
    private volatile boolean backgroundPlaybackActive = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, NOTIF_PERM_REQUEST);
            }
        }

        rootContainer = new FrameLayout(this);
        rootContainer.setBackgroundColor(Color.parseColor("#060310"));
        webView = new WebView(this) {
            @Override
            protected void onWindowVisibilityChanged(int visibility) {
                if (visibility != View.VISIBLE && backgroundPlaybackActive) {
                    super.onWindowVisibilityChanged(View.VISIBLE);
                    return;
                }
                super.onWindowVisibilityChanged(visibility);
            }
        };
        webView.setBackgroundColor(Color.parseColor("#060310"));
        rootContainer.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(rootContainer);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        // Strip "; wv" so YouTube & media players treat the app like normal Chrome Mobile
        String ua = settings.getUserAgentString();
        if (ua != null) {
            settings.setUserAgentString(ua.replace("; wv", "").replace("Version/4.0 ", ""));
        }
        // Flush stale WebView HTTP cache whenever app upgrades to a new versionCode
        try {
            android.content.SharedPreferences prefs = getSharedPreferences("lenkyx_app_meta", MODE_PRIVATE);
            int curVer = getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
            if (prefs.getInt("last_ver", 0) != curVer) {
                webView.clearCache(true);
                prefs.edit().putInt("last_ver", curVer).apply();
            }
        } catch (Exception ignored) {
        }

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request != null && !request.isForMainFrame()) {
                    return false;
                }
                Uri uri = request != null ? request.getUrl() : null;
                String url = uri != null ? uri.toString() : "";
                if (url.startsWith("http://127.0.0.1:") || url.startsWith("http://localhost:")
                        || url.contains("youtube.com") || url.contains("youtu.be") || url.contains("googlevideo.com")) {
                    return false;
                }
                openExternal(url);
                return true;
            }

            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && (url.startsWith("http://127.0.0.1:") || url.startsWith("http://localhost:")
                        || url.contains("youtube.com") || url.contains("youtu.be") || url.contains("googlevideo.com"))) {
                    return false;
                }
                openExternal(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (customVideoView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                customVideoView = view;
                customViewCallback = callback;
                if (rootContainer != null) {
                    rootContainer.addView(customVideoView, new FrameLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                }
            }

            @Override
            public void onHideCustomView() {
                if (customVideoView == null) return;
                if (rootContainer != null) {
                    rootContainer.removeView(customVideoView);
                }
                customVideoView = null;
                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;
                try {
                    Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    String[] accepts = params != null ? params.getAcceptTypes() : null;
                    String mime = "*/*";
                    if (accepts != null && accepts.length > 0 && accepts[0] != null && !accepts[0].trim().isEmpty()) {
                        mime = accepts[0].trim();
                    }
                    intent.setType(mime);
                    startActivityForResult(Intent.createChooser(intent, "Selecionar arquivo"), FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception e) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Não foi possível abrir o seletor de arquivos.", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        mediaCmdReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                final String cmd = intent.getStringExtra("cmd");
                if (cmd != null && webView != null) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            String safe = cmd.replaceAll("[^a-zA-Z]", "");
                            webView.evaluateJavascript(
                                    "window.__lenkyxMediaAction && window.__lenkyxMediaAction('" + safe + "');",
                                    null
                            );
                        }
                    });
                }
            }
        };
        IntentFilter filter = new IntentFilter(MediaPlaybackService.BROADCAST_MEDIA_CMD);
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(mediaCmdReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(mediaCmdReceiver, filter);
        }

        try {
            int verCode = 17;
            try {
                verCode = getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
            } catch (Exception ignored) {
            }
            server = new LocalAssetServer(getAssets(), verCode);
            int port = server.start();
            webView.loadUrl("http://127.0.0.1:" + port + "/");
        } catch (Exception e) {
            Toast.makeText(this, "Erro ao iniciar servidor interno: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Keep WebView timers and audio alive when phone screen locks or app goes to background
        if (webView != null) {
            webView.resumeTimers();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
    }

    private void openExternal(String url) {
        if (url == null || url.isEmpty()) return;
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "Nenhum app encontrado para abrir este link.", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == DEVICE_AUTH_REQUEST) {
            final boolean ok = (resultCode == Activity.RESULT_OK);
            if (webView != null) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        webView.evaluateJavascript(
                                "window.__lenkyxDeviceAuthResult && window.__lenkyxDeviceAuthResult(" + ok + ", '" + (ok ? "verified" : "cancelled") + "');",
                                null
                        );
                    }
                });
            }
            return;
        }
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                Uri uri = data.getData();
                if (uri != null) {
                    results = new Uri[]{uri};
                }
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            // Move task to back instead of killing music playback
            moveTaskToBack(true);
        }
    }

    @Override
    protected void onDestroy() {
        if (mediaCmdReceiver != null) {
            try {
                unregisterReceiver(mediaCmdReceiver);
            } catch (Exception ignored) {
            }
        }
        try {
            stopService(new Intent(this, MediaPlaybackService.class));
        } catch (Exception ignored) {
        }
        if (server != null) {
            server.stop();
        }
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    private class AndroidBridge {
        @JavascriptInterface
        public boolean isAndroidApk() {
            return true;
        }

        @JavascriptInterface
        public boolean isDeviceSecure() {
            try {
                KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
                return km != null && km.isDeviceSecure();
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public void requestDeviceAuth(final String title, final String subtitle) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
                        if (km == null || !km.isDeviceSecure()) {
                            if (webView != null) {
                                webView.evaluateJavascript(
                                        "window.__lenkyxDeviceAuthResult && window.__lenkyxDeviceAuthResult(true, 'no_device_lock');",
                                        null
                                );
                            }
                            return;
                        }
                        Intent intent = km.createConfirmDeviceCredentialIntent(
                                title != null ? title : "Desbloquear LENKYX",
                                subtitle != null ? subtitle : "Use sua biometria, PIN, senha ou padrão do celular"
                        );
                        if (intent != null) {
                            startActivityForResult(intent, DEVICE_AUTH_REQUEST);
                        } else if (webView != null) {
                            webView.evaluateJavascript(
                                    "window.__lenkyxDeviceAuthResult && window.__lenkyxDeviceAuthResult(true, 'no_intent');",
                                    null
                            );
                        }
                    } catch (Exception e) {
                        if (webView != null) {
                            webView.evaluateJavascript(
                                    "window.__lenkyxDeviceAuthResult && window.__lenkyxDeviceAuthResult(false, 'error');",
                                    null
                            );
                        }
                    }
                }
            });
        }

        @JavascriptInterface
        public void saveDeviceAccount(final String json) {
            try {
                SharedPreferences prefs = getSharedPreferences("lenkyx_prefs", MODE_PRIVATE);
                prefs.edit().putString("saved_device_account", json != null ? json : "").apply();
            } catch (Exception ignored) {
            }
        }

        @JavascriptInterface
        public String getDeviceAccount() {
            try {
                SharedPreferences prefs = getSharedPreferences("lenkyx_prefs", MODE_PRIVATE);
                return prefs.getString("saved_device_account", "");
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public void updateMediaState(final String title, final String artist, final String album, final boolean isPlaying) {
            backgroundPlaybackActive = isPlaying;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent svc = new Intent(MainActivity.this, MediaPlaybackService.class);
                        svc.setAction(MediaPlaybackService.ACTION_UPDATE);
                        svc.putExtra("title", title != null ? title : "LENKYX Cosmic Phonk");
                        svc.putExtra("artist", artist != null ? artist : "LENKYX");
                        svc.putExtra("album", album != null ? album : "Cosmic Phonk");
                        svc.putExtra("playing", isPlaying);
                        if (Build.VERSION.SDK_INT >= 26) {
                            startForegroundService(svc);
                        } else {
                            startService(svc);
                        }
                    } catch (Exception ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public void stopBackgroundPlayback() {
            backgroundPlaybackActive = false;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        stopService(new Intent(MainActivity.this, MediaPlaybackService.class));
                    } catch (Exception ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public void copyText(final String text) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                        if (cm != null) {
                            cm.setPrimaryClip(ClipData.newPlainText("LENKYX", text));
                        }
                    } catch (Exception ignored) {
                    }
                }
            });
        }

        @JavascriptInterface
        public void openExternalUrl(final String url) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    openExternal(url);
                }
            });
        }

        @JavascriptInterface
        public void showToast(final String msg) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void saveBase64File(final String base64Data, final String filename, final String mimeType) {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
                        String safeName = (filename == null || filename.trim().isEmpty())
                                ? "lenkyx-export-" + System.currentTimeMillis()
                                : filename.replaceAll("[^a-zA-Z0-9._-]", "_");
                        String mime = (mimeType == null || mimeType.trim().isEmpty())
                                ? "application/octet-stream"
                                : mimeType;

                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            ContentValues values = new ContentValues();
                            values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                            values.put(MediaStore.Downloads.MIME_TYPE, mime);
                            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/LENKYX");
                            Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                            if (uri != null) {
                                OutputStream os = getContentResolver().openOutputStream(uri);
                                if (os != null) {
                                    os.write(bytes);
                                    os.flush();
                                    os.close();
                                }
                            }
                        } else {
                            File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "LENKYX");
                            if (!dir.exists()) dir.mkdirs();
                            File file = new File(dir, safeName);
                            FileOutputStream fos = new FileOutputStream(file);
                            fos.write(bytes);
                            fos.flush();
                            fos.close();
                        }

                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(MainActivity.this, "Salvo em Downloads/LENKYX/" + safeName, Toast.LENGTH_LONG).show();
                            }
                        });
                    } catch (final Exception e) {
                        runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(MainActivity.this, "Erro ao salvar arquivo: " + e.getMessage(), Toast.LENGTH_LONG).show();
                            }
                        });
                    }
                }
            }).start();
        }
    }
}
