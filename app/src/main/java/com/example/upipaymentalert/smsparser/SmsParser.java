// ============================================================================
// SMS Parser Component — UPI Payment Alert
// Scans transaction alerts for currency notations (₹, RS, INR, MRP) via regex.
// Generates grammatically natural bilingual voice announcements (Hindi/English).
// ============================================================================
package com.example.upipaymentalert.smsparser;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SmsParser {
    private static final Pattern AMOUNT_PATTERN = Pattern.compile("(?i)(?:(?:RS|INR|MRP|₹)\\.?\\s*)(\\d+(?:,\\d{3})*(?:\\.\\d{1,2})?)");

    public String getAmountFromMessageBody(String body, String language) {
        boolean isHindi = "Hindi".equalsIgnoreCase(language);
        String defaultMsg = isHindi ? "अज्ञात राशि का भुगतान प्राप्त हुआ" : "Received payment of an unknown amount";

        if (body == null || body.isEmpty()) {
            return defaultMsg;
        }

        Matcher matcher = AMOUNT_PATTERN.matcher(body);
        if (!matcher.find()) {
            return defaultMsg;
        }

        String rawAmount = matcher.group(1).replace(",", "");
        String[] parts = rawAmount.split("\\.", 2);
        String rupees = parts[0];
        String paisa = parts.length > 1 ? parts[1] : "0";

        int rVal = 0;
        int pVal = 0;
        try {
            rVal = Integer.parseInt(rupees);
        } catch (NumberFormatException ignored) {}
        try {
            pVal = Integer.parseInt(paisa);
        } catch (NumberFormatException ignored) {}

        if (isHindi) {
            StringBuilder textToSpeak = new StringBuilder("आपको ");
            if (rVal != 0) {
                textToSpeak.append("|").append(rupees).append("| रुपये");
            }
            if (pVal != 0) {
                if (rVal != 0) {
                    textToSpeak.append(" और ");
                }
                textToSpeak.append("|").append(pVal).append("| पैसे");
            }
            if (rVal == 0 && pVal == 0) {
                return defaultMsg;
            }
            textToSpeak.append(" प्राप्त हुए");
            return textToSpeak.toString();
        } else {
            StringBuilder textToSpeak = new StringBuilder("Received ");
            if (rVal != 0) {
                textToSpeak.append("|").append(rupees).append("| rupees");
            }
            if (pVal != 0) {
                if (rVal != 0) {
                    textToSpeak.append(" and ");
                }
                textToSpeak.append("|").append(pVal).append("| paisa");
            }
            if (rVal == 0 && pVal == 0) {
                return defaultMsg;
            }
            return textToSpeak.toString();
        }
    }

    public boolean isCreditTransaction(String body) {
        if (body == null || body.isEmpty()) {
            return false;
        }

        String lowerBody = body.toLowerCase();

        // 1. Explicit debit/failure/restricted keywords rejection
        if (lowerBody.contains("debited") || 
            lowerBody.contains("debit") || 
            lowerBody.contains("withdrawn") || 
            lowerBody.contains("withdrawal") || 
            lowerBody.contains("failed") || 
            lowerBody.contains("declined") || 
            lowerBody.contains("spent") || 
            lowerBody.contains("deducted") || 
            lowerBody.contains("charges")) {
            return false;
        }

        // Context checks for paid/sent/transfer verbs
        if (lowerBody.contains("paid") && !lowerBody.contains("paid to you") && !lowerBody.contains("paid you")) {
            return false;
        }
        if (lowerBody.contains("sent") && !lowerBody.contains("sent to you") && !lowerBody.contains("sent you")) {
            return false;
        }
        if (lowerBody.contains("transfer to")) {
            return false;
        }

        // 2. Explicit credit/deposit keywords confirmation
        return lowerBody.contains("credited") || 
               lowerBody.contains("received") || 
               lowerBody.contains("deposited") || 
               lowerBody.contains("deposit") || 
               lowerBody.contains("added") || 
               lowerBody.contains("paid to you") || 
               lowerBody.contains("paid you") || 
               lowerBody.contains("sent to you") || 
               lowerBody.contains("sent you") || 
               lowerBody.contains("transfer from") || 
               lowerBody.contains("प्राप्त") || 
               lowerBody.contains("जमा") || 
               lowerBody.contains("मिले");
    }

    public boolean isDebitTransaction(String body) {
        if (body == null || body.isEmpty()) {
            return false;
        }
        
        String lowerBody = body.toLowerCase();
        
        // 1. Explicit credit keywords rejection
        if (lowerBody.contains("credited") || 
            lowerBody.contains("received") || 
            lowerBody.contains("deposited") || 
            lowerBody.contains("deposit") || 
            lowerBody.contains("प्राप्त") || 
            lowerBody.contains("जमा") || 
            lowerBody.contains("मिले")) {
            return false;
        }
        
        // 2. Explicit debit keywords confirmation
        return lowerBody.contains("debited") || 
               lowerBody.contains("debit") || 
               lowerBody.contains("withdrawn") || 
               lowerBody.contains("withdrawal") || 
               lowerBody.contains("spent") || 
               lowerBody.contains("deducted") || 
               lowerBody.contains("charges") ||
               lowerBody.contains("paid") ||
               lowerBody.contains("sent");
    }
}
