package com.example.upipaymentalert;

import android.app.Notification;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import com.example.upipaymentalert.db.AppDatabase;
import com.example.upipaymentalert.model.PaymentTransaction;
import com.example.upipaymentalert.smsparser.SmsParser;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class NotificationListener extends NotificationListenerService {

    private final SmsParser smsParser = new SmsParser();
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private static final String[] RECOGNIZED_UPI_PACKAGES = new String[]{
            "com.phonepe.app", "com.phonepe.app.business",
            "net.one97.paytm", "net.one97.paytm.merchant",
            "com.google.android.apps.nbu.paisa.user", "com.google.android.apps.nbu.paisa.merchant",
            "in.org.npci.upiapp", "com.bharatpe.app",
            "com.sbi.upi", "com.sbi.upi.intent", "com.sbi.lotusintouch",
            "com.csam.icici.bank.imobile", "com.axis.mobile", "com.bob.fe",
            "com.msf.kbank.mobile", "com.lcode.ucomobilebanking",
            "com.idfcfirstbank.optimus", "com.rblbank.mobank", "com.indusind.indie",
            "in.amazon.mShop.android.shopping", "com.dreamplug.androidapp", "com.cred.android",
            "com.canarabank.mobility", "com.infrasoft.uboi", "com.cub.cuphyper", "com.fampay.in",
            "com.snapwork.hdfc", "com.hdfcbank.payzapp", "com.google.android.gm"
    };

    private boolean isUpiApplication(String packageName) {
        if (packageName == null) return false;
        for (String pkg : RECOGNIZED_UPI_PACKAGES) {
            if (packageName.contains(pkg)) {
                return true;
            }
        }
        try {
            Intent upiIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("upi://pay"));
            List<ResolveInfo> apps = getPackageManager().queryIntentActivities(upiIntent, 0);
            for (ResolveInfo info : apps) {
                if (info.activityInfo != null && packageName.equals(info.activityInfo.packageName)) {
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        String packageName = sbn.getPackageName();
        if (packageName == null || !isUpiApplication(packageName)) {
            return;
        }

        Notification notification = sbn.getNotification();
        if (notification == null) return;

        Bundle extras = notification.extras;
        if (extras == null) return;

        CharSequence titleSeq = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textSeq = extras.getCharSequence(Notification.EXTRA_TEXT);
        String title = titleSeq != null ? titleSeq.toString() : "";
        String text = textSeq != null ? textSeq.toString() : "";

        String messageBody = (title + " " + text).trim();
        if (messageBody.isEmpty()) return;
        
        SharedPreferences prefs = getApplicationContext().getSharedPreferences("UPI_PREFS", Context.MODE_PRIVATE);

        // Forwarding Logic
        String forwardNumber = prefs.getString("forwarder_number", "");
        if (!forwardNumber.isEmpty()) {
            String appFilter = prefs.getString("forwarder_app_filter", "all");
            if ("all".equals(appFilter) || packageName.equals(appFilter)) {
                String typeFilter = prefs.getString("forwarder_type_filter", "Credited");
                boolean shouldForward = false;
                if ("Credited".equals(typeFilter) && smsParser.isCreditTransaction(messageBody)) {
                    shouldForward = true;
                } else if ("Debited".equals(typeFilter) && smsParser.isDebitTransaction(messageBody)) {
                    shouldForward = true;
                } else if ("Both".equals(typeFilter) && (smsParser.isCreditTransaction(messageBody) || smsParser.isDebitTransaction(messageBody))) {
                    shouldForward = true;
                }

                if (shouldForward) {
                    try {
                        android.telephony.SmsManager smsManager;
                        if (android.os.Build.VERSION.SDK_INT >= 31) {
                            smsManager = getApplicationContext().getSystemService(android.telephony.SmsManager.class);
                        } else {
                            smsManager = android.telephony.SmsManager.getDefault();
                        }
                        smsManager.sendTextMessage(forwardNumber, null, "FWD NOTIF: " + messageBody, null, null);
                    } catch (Exception ignored) {}
                }
            }
        }

        boolean isCredit = smsParser.isCreditTransaction(messageBody);
        boolean isDebit = smsParser.isDebitTransaction(messageBody);

        if (isCredit || isDebit) {
            String amountStr = smsParser.extractAmount(messageBody);
            PaymentTransaction transaction = new PaymentTransaction(
                    UUID.randomUUID().toString() + "_" + System.currentTimeMillis(),
                    amountStr,
                    isCredit ? "credit" : "debit",
                    packageName,
                    messageBody,
                    System.currentTimeMillis()
            );

            executor.execute(() -> {
                try {
                    AppDatabase.getInstance(getApplicationContext()).transactionDao().insert(transaction);
                    Intent intent = new Intent("com.example.upipaymentalert.PAYMENT_RECEIVED");
                    intent.setPackage(getApplicationContext().getPackageName());
                    getApplicationContext().sendBroadcast(intent);
                } catch (Exception ignored) {}
            });
        }

        // Check if it is a credit transaction for TTS announcement
        if (!isCredit) {
            return;
        }

        String lang = prefs.getString("language", "English");
        boolean announceSender = prefs.getBoolean("announce_sender_name", true);
        String senderName = smsParser.getSenderName(messageBody);
        String textToRead = smsParser.getAmountFromMessageBody(getApplicationContext(), messageBody, lang, announceSender, senderName);
        
        // Save latest message
        prefs.edit().putString("last_sms", "App: " + packageName + "\n\nBody: " + messageBody).apply();

        // Speak via the foreground TTS service
        try {
            Intent svc = new Intent(getApplicationContext(), ForegroundTtsService.class);
            svc.setAction(ForegroundTtsService.ACTION_SPEAK);
            svc.putExtra(ForegroundTtsService.EXTRA_TEXT, textToRead);
            if (android.os.Build.VERSION.SDK_INT >= 31) {
                try {
                    getApplicationContext().startForegroundService(svc);
                } catch (android.app.ForegroundServiceStartNotAllowedException e) {
                    try { getApplicationContext().startService(svc); } catch (Exception ignored) {}
                }
            } else if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                getApplicationContext().startForegroundService(svc);
            } else {
                getApplicationContext().startService(svc);
            }
        } catch (Exception ignored) {}
    }
}
