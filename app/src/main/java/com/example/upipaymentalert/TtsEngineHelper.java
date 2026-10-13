package com.example.upipaymentalert;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.util.Log;

import java.util.Locale;

/**
 * TtsEngineHelper manages Google TTS detection, silent pre-warming of Indian language voice models,
 * and engine switching, ported directly from TtsEngineHelper.kt.
 */
public class TtsEngineHelper {

    public static final String GOOGLE_TTS_PACKAGE = "com.google.android.tts";
    public static final String SAMSUNG_TTS_PACKAGE = "com.samsung.SMT";
    private static final String TAG = "TtsEngineHelper";

    /** Check if Google Speech Services is installed */
    public static boolean isGoogleTtsInstalled(Context context) {
        return isPackageInstalled(context, GOOGLE_TTS_PACKAGE);
    }

    public static boolean isPackageInstalled(Context context, String packageName) {
        if (context == null || packageName == null) return false;
        try {
            context.getPackageManager().getPackageInfo(packageName, 0);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Pre-warms the Google TTS engine and triggers background voice data checks for Indian languages.
     */
    public static void prewarmAndPrepareVoiceData(Context context) {
        if (context == null) return;
        final Context appContext = context.getApplicationContext();

        new Thread(() -> {
            try {
                if (isGoogleTtsInstalled(appContext)) {
                    Log.d(TAG, "Google TTS installed. Configuring as preferred engine and warming up...");
                    SharedPreferences prefs = appContext.getSharedPreferences("UPI_PREFS", Context.MODE_PRIVATE);
                    prefs.edit().putString("tts_engine", GOOGLE_TTS_PACKAGE).apply();

                    final TextToSpeech[] warmupTts = new TextToSpeech[1];
                    warmupTts[0] = new TextToSpeech(appContext, status -> {
                        if (status == TextToSpeech.SUCCESS && warmupTts[0] != null) {
                            Log.d(TAG, "Google TTS warmed up successfully. Checking Indian language voices...");
                            Locale[] indianLocales = new Locale[]{
                                    new Locale("hi", "IN"), new Locale("gu", "IN"), new Locale("mr", "IN"),
                                    new Locale("ta", "IN"), new Locale("te", "IN"), new Locale("kn", "IN"),
                                    new Locale("ml", "IN"), new Locale("pa", "IN"), new Locale("bn", "IN"),
                                    new Locale("or", "IN"), new Locale("as", "IN"), new Locale("ur", "IN")
                            };
                            for (Locale loc : indianLocales) {
                                try {
                                    warmupTts[0].isLanguageAvailable(loc);
                                } catch (Exception ignored) {}
                            }

                            // Trigger Google TTS background voice download check if needed
                            try {
                                Intent checkIntent = new Intent(TextToSpeech.Engine.ACTION_CHECK_TTS_DATA);
                                checkIntent.setPackage(GOOGLE_TTS_PACKAGE);
                                checkIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                appContext.startActivity(checkIntent);
                            } catch (Exception ignored) {}

                            // Close warmup instance after 3 seconds
                            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                                try {
                                    if (warmupTts[0] != null) {
                                        warmupTts[0].shutdown();
                                        warmupTts[0] = null;
                                    }
                                } catch (Exception ignored) {}
                            }, 3000);
                        }
                    }, GOOGLE_TTS_PACKAGE);
                } else {
                    Log.w(TAG, "Google TTS not installed on device! Flagging for install...");
                    SharedPreferences prefs = appContext.getSharedPreferences("UPI_PREFS", Context.MODE_PRIVATE);
                    prefs.edit().putBoolean("needs_google_tts_install", true).apply();
                }
            } catch (Exception e) {
                Log.w(TAG, "Error during TTS prewarm: " + e.getMessage());
            }
        }).start();
    }

    /**
     * Opens Play Store for Google Speech Services
     */
    public static void openGoogleTtsInPlayStore(Context context) {
        if (context == null) return;
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + GOOGLE_TTS_PACKAGE));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.setPackage("com.android.vending");
            context.startActivity(intent);
        } catch (Exception e) {
            try {
                Intent webIntent = new Intent(Intent.ACTION_VIEW,
                        Uri.parse("https://play.google.com/store/apps/details?id=" + GOOGLE_TTS_PACKAGE));
                webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(webIntent);
            } catch (Exception ignored) {}
        }
    }
}
