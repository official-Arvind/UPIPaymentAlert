package com.example.upipaymentalert.broadcastreciever;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Telephony;
import android.speech.tts.TextToSpeech;
import android.telephony.SmsMessage;

import com.example.upipaymentalert.smsparser.SmsParser;

import java.util.Locale;

public class SmsListener extends BroadcastReceiver {

    private final SmsParser smsParser = new SmsParser();

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) {
            StringBuilder messageBody = new StringBuilder();
            String address = "";
            for (SmsMessage smsMessage : Telephony.Sms.Intents.getMessagesFromIntent(intent)) {
                address = smsMessage.getOriginatingAddress();
                messageBody.append(smsMessage.getMessageBody());
            }

            String textToDisplay = "Address: " + address + "\n\nBody: " + messageBody;
            
            // Check if it is a credit transaction
            if (!smsParser.isCreditTransaction(messageBody.toString())) {
                return;
            }

            SharedPreferences prefs = context.getSharedPreferences("UPI_PREFS", Context.MODE_PRIVATE);
            String lang = prefs.getString("language", "English");
            String textToRead = smsParser.getAmountFromMessageBody(messageBody.toString(), lang);

            // Save latest message so UI can pick it up when opened
            prefs.edit().putString("last_sms", textToDisplay).apply();

            // Speak via the foreground TTS service (start or deliver intent)
            try {
                Intent svc = new Intent(context.getApplicationContext(), com.example.upipaymentalert.ForegroundTtsService.class);
                svc.setAction(com.example.upipaymentalert.ForegroundTtsService.ACTION_SPEAK);
                svc.putExtra(com.example.upipaymentalert.ForegroundTtsService.EXTRA_TEXT, textToRead);
                // Start the service (foreground service will keep running)
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.getApplicationContext().startForegroundService(svc);
                } else {
                    context.getApplicationContext().startService(svc);
                }
            } catch (Exception ignored) {
            }
        }
    }
}
