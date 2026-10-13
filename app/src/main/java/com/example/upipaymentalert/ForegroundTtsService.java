// ============================================================================
// Foreground TTS Service — UPI Payment Alert
// Runs as an unkillable sticky background service to speak alerts.
// Features independent AudioManager volume override, LoudnessEnhancer 200% boost,
// and 13 Indian language support.
// ============================================================================
package com.example.upipaymentalert;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.audiofx.LoudnessEnhancer;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
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
    private static final String TAG = "UPIPaymentAlert";
    private TextToSpeech tts;
    
    // Deduplication map: stores text -> timestamp
    private final ConcurrentHashMap<String, Long> recentAnnouncements = new ConcurrentHashMap<>();
    private static final long DEDUPLICATION_WINDOW_MS = 60000; // 60 seconds

    private Integer originalVolume = null;
    private int audioSessionId = 0;
    private LoudnessEnhancer loudnessEnhancer = null;

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

        // Generate audio session ID for hardware LoudnessEnhancer
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                audioSessionId = am.generateAudioSessionId();
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not generate audio session ID: " + e.getMessage());
        }

        String preferredEngine = null;
        if (TtsEngineHelper.isGoogleTtsInstalled(getApplicationContext())) {
            preferredEngine = TtsEngineHelper.GOOGLE_TTS_PACKAGE;
        }
        tts = new TextToSpeech(getApplicationContext(), status -> {
            if (status != TextToSpeech.ERROR) {
                tts.setLanguage(new Locale("en", "IN"));
                applyAudioAttributes();
                setupTtsListener();
            }
        }, preferredEngine);
    }

    private void applyAudioAttributes() {
        if (tts != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                        .build();
                tts.setAudioAttributes(attrs);
            } catch (Exception e) {
                Log.w(TAG, "Could not set audio attributes: " + e.getMessage());
            }
        }
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

    private synchronized void setTtsVolume() {
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                if (originalVolume == null) {
                    originalVolume = am.getStreamVolume(AudioManager.STREAM_MUSIC);
                }
                SharedPreferences prefs = getSharedPreferences("UPI_PREFS", MODE_PRIVATE);
                int volumePercent = prefs.getInt("volume", 100);
                int effectivePercent = Math.max(5, Math.min(volumePercent, 150));
                int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                int targetVol = Math.max(1, Math.min((int) (maxVol * (Math.min(effectivePercent, 100) / 100.0f)), maxVol));
                
                // Set stream volume
                am.setStreamVolume(AudioManager.STREAM_MUSIC, targetVol, 0);
                Log.d(TAG, "Volume set to " + volumePercent + "% (Target stream level: " + targetVol + "/" + maxVol + ")");

                // Hardware LoudnessEnhancer for boost > 100%
                if (volumePercent > 100 && audioSessionId != 0) {
                    try {
                        if (loudnessEnhancer == null) {
                            loudnessEnhancer = new LoudnessEnhancer(audioSessionId);
                        }
                        int boostAmount = volumePercent - 100;
                        int targetGainMb = Math.max(0, Math.min(boostAmount * 15, 1500));
                        loudnessEnhancer.setTargetGain(targetGainMb);
                        loudnessEnhancer.setEnabled(true);
                        Log.d(TAG, "Hardware LoudnessEnhancer active: +" + targetGainMb + "mB gain (Volume: " + volumePercent + "%)");
                    } catch (Exception e) {
                        Log.w(TAG, "LoudnessEnhancer error: " + e.getMessage());
                    }
                } else {
                    try {
                        if (loudnessEnhancer != null) {
                            loudnessEnhancer.setEnabled(false);
                        }
                    } catch (Throwable ignored) {}
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting volume: " + e.getMessage());
        }
    }

    private synchronized void restoreVolume() {
        try {
            Thread.sleep(150);
            if (tts != null && !tts.isSpeaking()) {
                AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                if (am != null && originalVolume != null) {
                    am.setStreamVolume(AudioManager.STREAM_MUSIC, originalVolume, 0);
                    Log.d(TAG, "Volume restored to original level: " + originalVolume);
                    originalVolume = null;
                }
                try {
                    if (loudnessEnhancer != null) {
                        loudnessEnhancer.setEnabled(false);
                    }
                } catch (Throwable ignored) {}
            }
        } catch (Exception e) {
            Log.e(TAG, "Error restoring volume: " + e.getMessage());
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
        SharedPreferences prefs = getSharedPreferences("UPI_PREFS", MODE_PRIVATE);
        if (prefs.getBoolean("is_muted", false)) {
            Log.d(TAG, "Muted - skipping announcement: " + text);
            return;
        }

        long currentTime = System.currentTimeMillis();
        
        // Clean up old entries
        for (Map.Entry<String, Long> entry : recentAnnouncements.entrySet()) {
            if (currentTime - entry.getValue() > DEDUPLICATION_WINDOW_MS) {
                recentAnnouncements.remove(entry.getKey());
            }
        }

        // Deduplication check
        if (recentAnnouncements.containsKey(text)) {
            Log.d(TAG, "Duplicate announcement prevented: " + text);
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
                
                // Handle 13 Indian Languages
                String lang = prefs.getString("language", "English");
                String lower = lang.toLowerCase(Locale.ROOT);
                Locale locale;
                if (lower.contains("hindi")) locale = new Locale("hi", "IN");
                else if (lower.contains("tamil")) locale = new Locale("ta", "IN");
                else if (lower.contains("telugu")) locale = new Locale("te", "IN");
                else if (lower.contains("kannada")) locale = new Locale("kn", "IN");
                else if (lower.contains("malayalam")) locale = new Locale("ml", "IN");
                else if (lower.contains("gujarati")) locale = new Locale("gu", "IN");
                else if (lower.contains("punjabi")) locale = new Locale("pa", "IN");
                else if (lower.contains("bengali")) locale = new Locale("bn", "IN");
                else if (lower.contains("marathi")) locale = new Locale("mr", "IN");
                else if (lower.contains("odia")) locale = new Locale("or", "IN");
                else if (lower.contains("assamese")) locale = new Locale("as", "IN");
                else if (lower.contains("urdu")) locale = new Locale("ur", "IN");
                else locale = new Locale("en", "IN");

                int res = tts.setLanguage(locale);
                if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                    res = tts.setLanguage(new Locale(locale.getLanguage()));
                }

                // Bind matching native voice (ported from ForegroundTtsService.kt)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    try {
                        if (tts.getVoices() != null) {
                            for (android.speech.tts.Voice voice : tts.getVoices()) {
                                if (voice != null && voice.getLocale() != null &&
                                        voice.getLocale().getLanguage().equalsIgnoreCase(locale.getLanguage())) {
                                    tts.setVoice(voice);
                                    res = TextToSpeech.LANG_AVAILABLE;
                                    Log.d(TAG, "Bound native TTS voice: " + voice.getName() + " for " + locale.getDisplayLanguage());
                                    break;
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                }

                if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts.setLanguage(new Locale("en", "IN"));
                }

                // Handle Volume & Session ID
                int volumePercent = prefs.getInt("volume", 100);
                float volumeFloat = Math.max(0.05f, Math.min(volumePercent / 100f, 1.0f));
                Bundle params = new Bundle();
                params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volumeFloat);
                params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC);
                if (audioSessionId != 0) {
                    params.putInt(TextToSpeech.Engine.KEY_PARAM_SESSION_ID, audioSessionId);
                }

                float customSpeed = prefs.getFloat("speed_value", 1.0f);
                tts.setPitch(1.0f);

                if (text.contains("|")) {
                    String[] segments = text.split("\\|", -1);
                    for (int i = 0; i < segments.length; i++) {
                        String segment = segments[i];
                        if (segment.isEmpty()) continue;
                        
                        // Odd indices are amounts read at customSpeed - 0.1x
                        // Even indices are structural words read at baseline speed (0.9x)
                        float currentSpeed = (i % 2 == 1) ? Math.max(0.1f, customSpeed - 0.1f) : 0.9f;
                        
                        tts.setSpeechRate(currentSpeed);
                        tts.speak(segment, TextToSpeech.QUEUE_ADD, params, "FG_UPI_TTS_" + System.currentTimeMillis() + "_" + i);
                    }
                } else {
                    tts.setSpeechRate(customSpeed);
                    tts.speak(text, TextToSpeech.QUEUE_ADD, params, "FG_UPI_TTS_" + System.currentTimeMillis());
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "TTS Error: " + e.getMessage());
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            if (loudnessEnhancer != null) {
                loudnessEnhancer.release();
                loudnessEnhancer = null;
            }
        } catch (Throwable ignored) {}
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
