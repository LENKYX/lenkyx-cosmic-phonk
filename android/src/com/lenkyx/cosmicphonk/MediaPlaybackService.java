package com.lenkyx.cosmicphonk;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.BitmapFactory;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

public class MediaPlaybackService extends Service {
    public static final String CHANNEL_ID = "lenkyx_playback_channel";
    public static final int NOTIF_ID = 101;
    public static final String ACTION_UPDATE = "com.lenkyx.ACTION_UPDATE";
    public static final String ACTION_CONTROL = "com.lenkyx.ACTION_CONTROL";
    public static final String BROADCAST_MEDIA_CMD = "com.lenkyx.MEDIA_CMD";

    private MediaSession mediaSession;
    private PowerManager.WakeLock wakeLock;
    private String curTitle = "LENKYX Cosmic Phonk";
    private String curArtist = "LENKYX";
    private String curAlbum = "Cosmic Phonk";
    private boolean curPlaying = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();

        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "LENKYX::AudioWakeLock");
            wakeLock.setReferenceCounted(false);
        }

        mediaSession = new MediaSession(this, "LENKYXCosmicPhonk");
        mediaSession.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                dispatchCmd("play");
            }

            @Override
            public void onPause() {
                dispatchCmd("pause");
            }

            @Override
            public void onSkipToNext() {
                dispatchCmd("next");
            }

            @Override
            public void onSkipToPrevious() {
                dispatchCmd("prev");
            }
        });
        mediaSession.setActive(true);
    }

    private void dispatchCmd(String cmd) {
        Intent i = new Intent(BROADCAST_MEDIA_CMD);
        i.setPackage(getPackageName());
        i.putExtra("cmd", cmd);
        sendBroadcast(i);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_CONTROL.equals(action)) {
                String cmd = intent.getStringExtra("cmd");
                if (cmd != null) {
                    dispatchCmd(cmd);
                }
                return START_STICKY;
            }
            if (intent.hasExtra("title")) curTitle = intent.getStringExtra("title");
            if (intent.hasExtra("artist")) curArtist = intent.getStringExtra("artist");
            if (intent.hasExtra("album")) curAlbum = intent.getStringExtra("album");
            curPlaying = intent.getBooleanExtra("playing", curPlaying);
        }

        updateWakeLock(curPlaying);
        updateMediaSession();
        Notification notif = buildNotification();

        try {
            startForeground(NOTIF_ID, notif);
        } catch (Exception ignored) {
        }
        return START_STICKY;
    }

    private void updateWakeLock(boolean playing) {
        if (wakeLock == null) return;
        try {
            if (playing && !wakeLock.isHeld()) {
                wakeLock.acquire(4 * 60 * 60 * 1000L);
            } else if (!playing && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception ignored) {
        }
    }

    private void updateMediaSession() {
        if (mediaSession == null) return;
        MediaMetadata.Builder meta = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, curTitle)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, curArtist)
                .putString(MediaMetadata.METADATA_KEY_ALBUM, curAlbum);
        try {
            meta.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART,
                    BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher));
        } catch (Exception ignored) {
        }
        mediaSession.setMetadata(meta.build());

        long actions = PlaybackState.ACTION_PLAY
                | PlaybackState.ACTION_PAUSE
                | PlaybackState.ACTION_PLAY_PAUSE
                | PlaybackState.ACTION_SKIP_TO_NEXT
                | PlaybackState.ACTION_SKIP_TO_PREVIOUS;
        int state = curPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED;
        mediaSession.setPlaybackState(new PlaybackState.Builder()
                .setActions(actions)
                .setState(state, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1.0f)
                .build());
    }

    private Notification buildNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent contentPi = PendingIntent.getActivity(this, 0, openIntent, piFlags);

        PendingIntent prevPi = makeControlPi("prev", 1, piFlags);
        PendingIntent togglePi = makeControlPi(curPlaying ? "pause" : "play", 2, piFlags);
        PendingIntent nextPi = makeControlPi("next", 3, piFlags);

        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);

        builder.setSmallIcon(R.mipmap.ic_launcher)
                .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
                .setContentTitle(curTitle)
                .setContentText(curArtist + " · " + curAlbum)
                .setContentIntent(contentPi)
                .setOngoing(curPlaying)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .addAction(android.R.drawable.ic_media_previous, "Anterior", prevPi)
                .addAction(curPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        curPlaying ? "Pausar" : "Tocar", togglePi)
                .addAction(android.R.drawable.ic_media_next, "Próxima", nextPi)
                .setStyle(new Notification.MediaStyle()
                        .setMediaSession(mediaSession.getSessionToken())
                        .setShowActionsInCompactView(0, 1, 2));

        return builder.build();
    }

    private PendingIntent makeControlPi(String cmd, int reqCode, int flags) {
        Intent i = new Intent(this, MediaPlaybackService.class);
        i.setAction(ACTION_CONTROL);
        i.putExtra("cmd", cmd);
        return PendingIntent.getService(this, reqCode, i, flags);
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID,
                    "LENKYX Player (Tela de Bloqueio)",
                    NotificationManager.IMPORTANCE_LOW
            );
            ch.setShowBadge(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    @Override
    public void onDestroy() {
        updateWakeLock(false);
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
