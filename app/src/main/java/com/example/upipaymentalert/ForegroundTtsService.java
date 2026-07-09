// ============================================================================
// Foreground TTS Service — UPI Payment Alert
// Runs as an unkillable sticky background service to speak alerts.
// Features independent AudioManager volume override & segmented speed settings.
// ============================================================================
package com.example.upipaymentalert;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.media.AudioManager;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ForegroundTtsService extends Service {
    public static final String ACTION_SPEAK = "com.example.upipaymentalert.action.SPEAK";
    public static final String EXTRA_TEXT = "extra_text";
    private static final String CHANNEL_ID = "upi_tts_channel";
    private TextToSpeech tts;
    
    // Deduplication map: stores text -> timestamp
    private final ConcurrentHashMap<String, Long> recentAnnouncements = new ConcurrentHashMap<>();
    private static final long DEDUPLICATION_WINDOW_MS = 60000; // 60 seconds

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        Notification n = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("UPI Payment Alert Active")
                .setContentText("Listening for incoming payments via SMS and Notifications.")
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setOngoing(true)
                .build();
        startForeground(12345, n);

        tts = new TextToSpeech(getApplicationContext(), status -> {
            if (status != TextToSpeech.ERROR) {
                // Initialize language based on preferences if needed, defaults to UK/hi-IN handled in speak()
                tts.setLanguage(Locale.getDefault());
                setupTtsListener();
            }
        });
    }

    private void setupTtsListener() {
        if (tts != null) {
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                    setTtsVolume();
                }

                @Override
                public void onDone(String utteranceId) {
                    restoreVolume();
                }

                @Override
                public void onError(String utteranceId) {
                    restoreVolume();
                }
            });
        }
    }

    private Integer originalVolume = null;

    private synchronized void setTtsVolume() {
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                if (originalVolume == null) {
                    originalVolume = am.getStreamVolume(AudioManager.STREAM_MUSIC);
                }
                SharedPreferences prefs = getSharedPreferences("UPI_PREFS", MODE_PRIVATE);
                int volumePercent = prefs.getInt("volume", 15);
                int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                int targetVol = (int) (maxVol * (volumePercent / 100.0f));
                
                // Set volume without showing the UI popup
                am.setStreamVolume(AudioManager.STREAM_MUSIC, targetVol, 0);
                Log.d("UPIPaymentAlert", "Volume set to " + volumePercent + "% (Target stream level: " + targetVol + "/" + maxVol + ")");
            }
        } catch (Exception e) {
            Log.e("UPIPaymentAlert", "Error setting volume: " + e.getMessage());
        }
    }

    private synchronized void restoreVolume() {
        try {
            // Small delay to let any subsequent queued utterance start before restoring the volume
            Thread.sleep(150);
            if (tts != null && !tts.isSpeaking()) {
                AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                if (am != null && originalVolume != null) {
                    am.setStreamVolume(AudioManager.STREAM_MUSIC, originalVolume, 0);
                    Log.d("UPIPaymentAlert", "Volume restored to original level: " + originalVolume);
                    originalVolume = null;
                }
            }
        } catch (Exception e) {
            Log.e("UPIPaymentAlert", "Error restoring volume: " + e.getMessage());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "UPI Payment Alert Service", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Keeps the app active to listen for payments and announce them.");
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_SPEAK.equals(intent.getAction())) {
            String text = intent.getStringExtra(EXTRA_TEXT);
            if (text != null && !text.isEmpty()) {
                handleSpeakRequest(text);
            }
        }
        return START_STICKY;
    }

    private void handleSpeakRequest(String text) {
        long currentTime = System.currentTimeMillis();
        
        // Clean up old entries
        for (Map.Entry<String, Long> entry : recentAnnouncements.entrySet()) {
            if (currentTime - entry.getValue() > DEDUPLICATION_WINDOW_MS) {
                recentAnnouncements.remove(entry.getKey());
            }
        }

        // Deduplication check
        if (recentAnnouncements.containsKey(text)) {
            Log.d("UPIPaymentAlert", "Duplicate announcement prevented: " + text);
            return;
        }

        // Add to recent announcements
        recentAnnouncements.put(text, currentTime);

        // Announce
        speak(text);
    }

    private void speak(String text) {
        try {
            if (tts != null) {
                SharedPreferences prefs = getSharedPreferences("UPI_PREFS", MODE_PRIVATE);
                
                // Handle Language
                String lang = prefs.getString("language", "English");
                Locale locale = lang.equalsIgnoreCase("Hindi") ? new Locale("hi", "IN") : Locale.UK;
                int res = tts.setLanguage(locale);
                if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts.setLanguage(Locale.UK);
                }

                // Handle Volume Independently
                int volumePercent = prefs.getInt("volume", 15);
                float volumeFloat = volumePercent / 100f;
                Bundle params = new Bundle();
                params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volumeFloat);

                float customSpeed = prefs.getFloat("speed_value", 1.0f);
                tts.setPitch(1.0f);

                String[] segments = text.split("\\|", -1);
                for (int i = 0; i < segments.length; i++) {
                    String segment = segments[i];
                    if (segment.isEmpty()) continue;
                    
                    // Odd indices (1, 3, ...) are target amounts and read at customSpeed - 0.1x
                    // Even indices (0, 2, ...) are structural words read at baseline speed (0.9x)
                    float currentSpeed = (i % 2 == 1) ? Math.max(0.1f, customSpeed - 0.1f) : 0.9f;
                    
                    tts.setSpeechRate(currentSpeed);
                    tts.speak(segment, TextToSpeech.QUEUE_ADD, params, "FG_UPI_TTS_" + System.currentTimeMillis() + "_" + i);
                }
            }
        } catch (Exception e) {
            Log.e("UPIPaymentAlert", "TTS Error: " + e.getMessage());
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (tts != null) {
            tts.shutdown();
            tts = null;
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
