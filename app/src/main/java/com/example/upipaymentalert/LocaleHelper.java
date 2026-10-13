package com.example.upipaymentalert;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.Build;
import android.os.LocaleList;

import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.os.LocaleListCompat;

import java.util.Locale;

/**
 * LocaleHelper manages dynamic in-app language switching across all 13 Indian languages,
 * ported directly from the closed-source LocaleHelper.kt.
 */
public class LocaleHelper {

    public static final String PREFS_NAME = "UPI_PREFS";
    public static final String KEY_LANGUAGE = "app_ui_language";
    public static final String DEFAULT_LANGUAGE = "en";

    public static final String[] SUPPORTED_CODES = {
            "en", "hi", "gu", "mr", "ta", "te", "kn", "ml", "pa", "bn", "or", "as", "ur"
    };

    public static final String[] SUPPORTED_NAMES = {
            "English",
            "हिन्दी (Hindi)",
            "ગુજરાતી (Gujarati)",
            "मराठी (Marathi)",
            "தமிழ் (Tamil)",
            "తెలుగు (Telugu)",
            "ಕನ್ನಡ (Kannada)",
            "മലയാളം (Malayalam)",
            "ਪੰਜਾਬੀ (Punjabi)",
            "বাংলা (Bengali)",
            "ଓଡ଼ିଆ (Odia)",
            "অসমীয়া (Assamese)",
            "اردو (Urdu)"
    };

    /**
     * Reads the chosen language code from preferences.
     */
    public static String getLanguage(Context context) {
        if (context == null) return DEFAULT_LANGUAGE;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_LANGUAGE, DEFAULT_LANGUAGE);
    }

    /**
     * Persists chosen language, updates system configuration, and restarts activity.
     */
    public static void setAppLanguage(Context context, String langCode, boolean recreateActivity) {
        if (context == null || langCode == null) return;

        // 1. Persist to preferences
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_LANGUAGE, langCode)
                .commit();

        // 2. Set default JVM locale
        Locale locale = new Locale(langCode);
        Locale.setDefault(locale);

        // 3. AndroidX AppCompat application locales
        try {
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(langCode));
        } catch (Throwable ignored) {}

        // 4. Update Application & Activity resources directly
        updateResources(context, locale);

        // 5. Recreate / restart activity if requested
        if (recreateActivity && context instanceof Activity) {
            Activity act = (Activity) context;
            Intent intent = new Intent(act, act.getClass());
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
            act.finish();
            act.startActivity(intent);
        }
    }

    /**
     * Wraps context with localized configuration (for attachBaseContext).
     */
    public static Context applyLocale(Context baseContext) {
        if (baseContext == null) return baseContext;
        String langCode = getLanguage(baseContext);
        Locale locale = new Locale(langCode);
        Locale.setDefault(locale);

        Configuration config = new Configuration(baseContext.getResources().getConfiguration());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            config.setLocales(new LocaleList(locale));
        } else {
            config.locale = locale;
        }
        config.setLayoutDirection(locale);

        Context localizedContext = baseContext.createConfigurationContext(config);
        updateResources(baseContext, locale);
        return localizedContext;
    }

    /**
     * Updates resources configuration to ensure immediate string resolution.
     */
    @SuppressWarnings("deprecation")
    public static Configuration updateResources(Context context, Locale locale) {
        Resources res = context.getResources();
        Configuration config = new Configuration(res.getConfiguration());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            config.setLocales(new LocaleList(locale));
        } else {
            config.locale = locale;
        }
        config.setLayoutDirection(locale);
        res.updateConfiguration(config, res.getDisplayMetrics());

        Context appCtx = context.getApplicationContext();
        if (appCtx != null && appCtx != context) {
            Resources appRes = appCtx.getResources();
            Configuration appConfig = new Configuration(appRes.getConfiguration());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                appConfig.setLocales(new LocaleList(locale));
            } else {
                appConfig.locale = locale;
            }
            appConfig.setLayoutDirection(locale);
            appRes.updateConfiguration(appConfig, appRes.getDisplayMetrics());
        }
        return config;
    }
}
