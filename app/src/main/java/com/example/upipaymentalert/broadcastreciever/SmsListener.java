package com.example.upipaymentalert.broadcastreciever;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Telephony;
import android.telephony.SmsMessage;

import com.example.upipaymentalert.ForegroundTtsService;
import com.example.upipaymentalert.db.AppDatabase;
import com.example.upipaymentalert.model.PaymentTransaction;
import com.example.upipaymentalert.smsparser.SmsParser;

import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SmsListener extends BroadcastReceiver {

    private final SmsParser smsParser = new SmsParser();
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
            StringBuilder messageBody = new StringBuilder();
            String address = "";
            SmsMessage[] messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
            if (messages != null) {
                for (SmsMessage smsMessage : messages) {
                    if (smsMessage != null) {
                        address = smsMessage.getOriginatingAddress();
                        messageBody.append(smsMessage.getMessageBody());
                    }
                }
            }

            String fullMessage = messageBody.toString();
            String textToDisplay = "Address: " + address + "\n\nBody: " + fullMessage;
            
            SharedPreferences prefs = context.getSharedPreferences("UPI_PREFS", Context.MODE_PRIVATE);
            
            // Forwarding Logic
            String forwardNumber = prefs.getString("forwarder_number", "");
            if (!forwardNumber.isEmpty()) {
                String typeFilter = prefs.getString("forwarder_type_filter", "Credited");
                boolean shouldForward = false;
                if ("Credited".equals(typeFilter) && smsParser.isCreditTransaction(fullMessage)) {
                    shouldForward = true;
                } else if ("Debited".equals(typeFilter) && smsParser.isDebitTransaction(fullMessage)) {
                    shouldForward = true;
                } else if ("Both".equals(typeFilter) && (smsParser.isCreditTransaction(fullMessage) || smsParser.isDebitTransaction(fullMessage))) {
                    shouldForward = true;
                }

                if (shouldForward) {
                    try {
                        android.telephony.SmsManager smsManager;
                        if (android.os.Build.VERSION.SDK_INT >= 31) {
                            smsManager = context.getSystemService(android.telephony.SmsManager.class);
                        } else {
                            smsManager = android.telephony.SmsManager.getDefault();
                        }
                        smsManager.sendTextMessage(forwardNumber, null, "FWD SMS: " + fullMessage, null, null);
                    } catch (Exception ignored) {}
                }
            }

            boolean isCredit = smsParser.isCreditTransaction(fullMessage);
            boolean isDebit = smsParser.isDebitTransaction(fullMessage);

            if (isCredit || isDebit) {
                String amountStr = smsParser.extractAmount(fullMessage);
                PaymentTransaction transaction = new PaymentTransaction(
                        UUID.randomUUID().toString() + "_" + System.currentTimeMillis(),
                        amountStr,
                        isCredit ? "credit" : "debit",
                        address != null ? address : "",
                        fullMessage,
                        System.currentTimeMillis()
                );

                final Context appContext = context.getApplicationContext();
                executor.execute(() -> {
                    try {
                        AppDatabase.getInstance(appContext).transactionDao().insert(transaction);
                        Intent updateIntent = new Intent("com.example.upipaymentalert.PAYMENT_RECEIVED");
                        updateIntent.setPackage(appContext.getPackageName());
                        appContext.sendBroadcast(updateIntent);
                    } catch (Exception ignored) {}
                });
            }

            // Check if it is a credit transaction for TTS announcement
            if (!isCredit) {
                return;
            }

            String lang = prefs.getString("language", "English");
            boolean announceSender = prefs.getBoolean("announce_sender_name", true);
            String senderName = smsParser.getSenderName(fullMessage);
            String textToRead = smsParser.getAmountFromMessageBody(context, fullMessage, lang, announceSender, senderName);

            // Save latest message so UI can pick it up when opened
            prefs.edit().putString("last_sms", textToDisplay).apply();

            // Speak via the foreground TTS service (start or deliver intent)
            try {
                Intent svc = new Intent(context.getApplicationContext(), ForegroundTtsService.class);
                svc.setAction(ForegroundTtsService.ACTION_SPEAK);
                svc.putExtra(ForegroundTtsService.EXTRA_TEXT, textToRead);
                if (android.os.Build.VERSION.SDK_INT >= 31) {
                    try {
                        context.getApplicationContext().startForegroundService(svc);
                    } catch (android.app.ForegroundServiceStartNotAllowedException e) {
                        try { context.getApplicationContext().startService(svc); } catch (Exception ignored) {}
                    }
                } else if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.getApplicationContext().startForegroundService(svc);
                } else {
                    context.getApplicationContext().startService(svc);
                }
            } catch (Exception ignored) {}
        }
    }
}
