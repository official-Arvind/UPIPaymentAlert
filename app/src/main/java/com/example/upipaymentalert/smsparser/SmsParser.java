package com.example.upipaymentalert.smsparser;

import android.content.Context;
import android.content.res.Configuration;
import com.example.upipaymentalert.R;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SmsParser {

    public String extractAmount(String body) {
        if (body == null) return "0.00";

        // Indian comma-aware regex: matches 1,00,000 AND 1,000 AND plain 4444
        final String indianAmountGroup = "(?:\\d{1,3}(?:,\\d{2,3})+|\\d+)(?:\\.\\d{1,2})?";

        // m0: leading decimal like .50 preceded by currency symbol
        Matcher m0 = Pattern.compile("(?i)(?:[\\u20b9]|rs\\.?|inr|mrp)[\\s]*(\\.\\d{1,2})(?!\\d)").matcher(body);
        if (m0.find()) {
            String val = "0" + m0.group(1);
            try { if (Double.parseDouble(val) > 0) return val; } catch (NumberFormatException ignored) {}
        }

        // m1: currency symbol then amount (₹1,00,000 or Rs 500.00)
        Matcher m1 = Pattern.compile("(?i)(?:[\\u20b9]|rs\\.?|inr|mrp)[\\s]*(" + indianAmountGroup + ")").matcher(body);
        if (m1.find()) return m1.group(1).replace(",", "");

        // m2: amount then currency symbol (1,00,000 Rs)
        Matcher m2 = Pattern.compile("(?i)(" + indianAmountGroup + ")\\s*(?:rs\\.?|inr|[\\u20b9])").matcher(body);
        if (m2.find()) return m2.group(1).replace(",", "");

        // m3: bare numeric fallback (no currency marker)
        Matcher m3 = Pattern.compile("(?<![\\d@,])(\\d{1,7}(?:\\.\\d{1,2})?)(?![\\d])").matcher(body);
        while (m3.find()) {
            String candidate = m3.group(1);
            try {
                double val = Double.parseDouble(candidate);
                if (val >= 1 && val <= 9999999) return candidate;
            } catch (NumberFormatException ignored) {}
        }
        return "0.00";
    }

    public String getSenderName(String body) {
        if (body == null) return "";
        Pattern p1 = Pattern.compile("(?i)(?:paid|sent|transferred)\\s+by\\s+([A-Z][a-zA-Z\\s]{1,28}?)(?=\\s+(?:via|on|at|using|to|ref|upi|\\d)|(?:\\[.]|,|$))");
        Matcher m1 = p1.matcher(body);
        if (m1.find()) { String n = cleanName(m1.group(1)); if (isValidName(n)) return n; }
        Pattern p2 = Pattern.compile("(?i)from\\s+([A-Z][a-zA-Z\\s]{1,28}?)(?=\\s+(?:via|on|at|using|upi|ref|has|\\d)|(?:\\.|,|\\())");
        Matcher m2 = p2.matcher(body);
        if (m2.find()) { String n = cleanName(m2.group(1)); if (isValidName(n)) return n; }
        Pattern p3 = Pattern.compile("(?i)([A-Z][a-zA-Z\\s]{1,28}?)\\s+has\\s+(?:paid|sent|transferred|credited)");
        Matcher m3 = p3.matcher(body);
        if (m3.find()) { String n = cleanName(m3.group(1)); if (isValidName(n)) return n; }
        Pattern p4 = Pattern.compile("(?i)(?:from\\s+VPA|from\\s+UPI\\s+ID|VPA)[:\\s]+([a-zA-Z0-9][a-zA-Z0-9._-]{1,30})@[a-zA-Z]+");
        Matcher m4 = p4.matcher(body);
        if (m4.find()) { String n = extractNameFromVpa(m4.group(1)); if (isValidName(n)) return n; }
        Pattern p5 = Pattern.compile("([a-zA-Z0-9][a-zA-Z0-9._-]{1,30})@(?:ybl|upi|paytm|okicici|oksbi|okaxis|okhdfcbank|ibl|axl|apl|waicici|hdfcbank|icici|sbi|axis|kotak|barodampay|pnb|indus|rbl|federal|idbi|aubank|yesbank)");
        Matcher m5 = p5.matcher(body);
        if (m5.find()) { String n = extractNameFromVpa(m5.group(1)); if (isValidName(n)) return n; }
        Pattern p6 = Pattern.compile("(?i)(?:trf\\s+frm|trf\\s+from|imps\\s+frm|imps\\s+from|neft\\s+from|neft\\s+frm)[:\\s]+([A-Z][A-Z\\s]{1,30})");
        Matcher m6 = p6.matcher(body);
        if (m6.find()) { String n = cleanName(m6.group(1)); if (isValidName(n)) return n; }
        Pattern p7 = Pattern.compile("(?i)received\\s+from\\s+([A-Z][a-zA-Z\\s]{1,28}?)(?=\\s+(?:via|on|at|ref|upi|for)|(?:\\.|,|\\(|$))");
        Matcher m7 = p7.matcher(body);
        if (m7.find()) { String n = cleanName(m7.group(1)); if (isValidName(n)) return n; }
        Pattern p8 = Pattern.compile("(?i)(?:by|from)[\\s:]+([A-Za-z][a-zA-Z0-9@\\.\\s]+?)(?=\\s+(?:on|ref|upi|txn|at|date|\\d)|(?:[\\.,;\\(]|$))");
        Matcher m8 = p8.matcher(body);
        if (m8.find()) { String n = cleanName(m8.group(1)); if (isValidName(n)) return n; }
        return "";
    }

    private String extractNameFromVpa(String vpa) {
        String cleaned = vpa.replaceAll("\\d+$", "").replaceAll("[._\\-]", " ").trim().replaceAll("\\d", "").trim();
        return capitalizeName(cleaned);
    }

    private String cleanName(String name) {
        if (name == null) return "";
        return name.trim().replaceAll("\\s+", " ");
    }

    private boolean isValidName(String name) {
        if (name == null || name.isEmpty()) return false;
        if (name.length() < 2 || name.length() > 40) return false;
        String lower = name.toLowerCase();
        String[] rejects = {"bank","upi","account","acct","ref","neft","imps","rtgs","your","you","the","for","via","with","amount","rupees","rs","inr","credit","debit","transaction","transfer","payment","service","limited","pvt","ltd","inc","corp","dear","customer","user","member","number","mobile","phone","wallet","paytm","phonepe","gpay","bhim","google","amazon"};
        for (String reject : rejects) { if (lower.equals(reject)) return false; }
        if (!name.matches(".*[a-zA-Z].*")) return false;
        if (name.equals(name.toUpperCase()) && name.length() <= 6 && !name.contains(" ")) return false;
        return true;
    }

    private String capitalizeName(String name) {
        if (name == null || name.isEmpty()) return "";
        String[] words = name.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (word.isEmpty()) continue;
            if (sb.length() > 0) sb.append(" ");
            sb.append(Character.toUpperCase(word.charAt(0)));
            if (word.length() > 1) sb.append(word.substring(1).toLowerCase());
        }
        return sb.toString();
    }

    public String getAmountFromMessageBody(Context context, String body, String language, boolean announceSender, String senderName) {
        if (context == null) {
            return getAmountFromMessageBody(body, language);
        }
        if (body == null || body.isEmpty()) return getLocalizedContext(context, language).getString(R.string.tts_unknown_amount);
        String rawAmount = extractAmount(body);
        if (rawAmount.equals("0.00")) return getLocalizedContext(context, language).getString(R.string.tts_unknown_amount);
        String[] parts = rawAmount.split("\\.", 2);
        String rupees = parts[0];
        String paisa = parts.length > 1 ? parts[1] : "0";
        int rVal = 0, pVal = 0;
        try { rVal = Integer.parseInt(rupees); } catch (NumberFormatException ignored) {}
        try { pVal = Integer.parseInt(paisa); } catch (NumberFormatException ignored) {}
        if (rVal == 0 && pVal == 0) return getLocalizedContext(context, language).getString(R.string.tts_unknown_amount);

        String cleanSender = senderName;
        if (cleanSender != null && !cleanSender.isEmpty()) {
            cleanSender = cleanSender.replaceAll("[^a-zA-Z\\s\\u0900-\\u097F\\u0B80-\\u0BFF\\u0C00-\\u0C7F\\u0C80-\\u0CFF\\u0D00-\\u0D7F\\u0A80-\\u0AFF\\u0A00-\\u0A7F\\u0980-\\u09FF]", " ").trim();
            if (cleanSender.isEmpty()) cleanSender = null;
            else cleanSender = capitalizeName(cleanSender);
        }
        boolean hasSender = announceSender && cleanSender != null && !cleanSender.isEmpty() && isValidName(cleanSender);

        Context localizedContext = getLocalizedContext(context, language);
        if (hasSender) {
            if (pVal != 0) {
                return localizedContext.getString(R.string.tts_rupees_and_paise_with_sender, cleanSender, rupees, paisa);
            } else {
                return localizedContext.getString(R.string.tts_rupees_only_with_sender, cleanSender, rupees);
            }
        } else {
            if (pVal != 0) {
                return localizedContext.getString(R.string.tts_rupees_and_paise_no_sender, rupees, paisa);
            } else {
                return localizedContext.getString(R.string.tts_rupees_only_no_sender, rupees);
            }
        }
    }

    public String getAmountFromMessageBody(String body, String language) {
        String defaultMsg = AnnouncementPhrases.getUnknownAmountPhrase(language);
        if (body == null || body.isEmpty()) return defaultMsg;

        String rawAmount = extractAmount(body);
        if (rawAmount.equals("0.00")) return defaultMsg;

        String[] parts = rawAmount.split("\\.", 2);
        String rupees = parts[0];
        String paisa = parts.length > 1 ? parts[1] : "0";

        int rVal = 0, pVal = 0;
        try { rVal = Integer.parseInt(rupees); } catch (NumberFormatException ignored) {}
        try { pVal = Integer.parseInt(paisa); } catch (NumberFormatException ignored) {}

        if (rVal == 0 && pVal == 0) return defaultMsg;

        return AnnouncementPhrases.buildPhrase(language, rupees, pVal > 0 ? paisa : null, null);
    }

    private Context getLocalizedContext(Context context, String language) {
        String langCode = "en";
        String lang = language.toLowerCase();
        if (lang.contains("hindi")) langCode = "hi";
        else if (lang.contains("tamil")) langCode = "ta";
        else if (lang.contains("telugu")) langCode = "te";
        else if (lang.contains("kannada")) langCode = "kn";
        else if (lang.contains("malayalam")) langCode = "ml";
        else if (lang.contains("gujarati")) langCode = "gu";
        else if (lang.contains("punjabi")) langCode = "pa";
        else if (lang.contains("bengali")) langCode = "bn";
        else if (lang.contains("marathi")) langCode = "mr";
        else if (lang.contains("odia")) langCode = "or";
        else if (lang.contains("assamese")) langCode = "as";
        else if (lang.contains("urdu")) langCode = "ur";

        Locale locale = new Locale(langCode);
        Configuration config = new Configuration(context.getResources().getConfiguration());
        config.setLocale(locale);
        return context.createConfigurationContext(config);
    }

    private boolean hasBankingIndicators(String lb) {
        return lb.contains("a/c") || lb.contains("acct") || lb.contains("account") ||
               lb.contains("bank") || lb.contains("upi") || lb.contains("vpa") ||
               lb.contains("inr") || lb.contains("rs") || lb.contains("₹");
    }

    private boolean hasBlacklistedKeywords(String lb) {
        return lb.contains("due") || lb.contains("recharge") || lb.contains("expiring") ||
               lb.contains("plan") || lb.contains("loan") || lb.contains("otp") ||
               lb.contains("code") || lb.contains("validity") || lb.contains("data") ||
               lb.contains("pack");
    }

    public boolean isCreditTransaction(String body) {
        if (body == null || body.isEmpty()) return false;
        String lb = body.toLowerCase();

        if (hasBlacklistedKeywords(lb)) return false;
        if (!hasBankingIndicators(lb)) return false;
        if (lb.contains("failed") || lb.contains("declined")) return false;

        int creditIdx = indexOfAny(lb, "credited", "received", "deposited", "deposit", "added", "paid to you", "paid you", "has paid", "sent to you", "sent you", "has sent", "transfer from", "transferred from", "money received", "payment received", "\u092a\u094d\u0930\u093e\u092a\u094d\u0924", "\u091c\u092e\u093e", "\u092e\u093f\u0932\u0947");
        int debitIdx = indexOfAny(lb, "debited", "debit", "withdrawn", "withdrawal", "spent", "deducted", "charges", "transfer to", "transferred to");

        if (lb.contains("paid") && !lb.contains("paid to you") && !lb.contains("has paid") && !lb.contains("paid by")) {
            int idx = lb.indexOf("paid");
            if (idx != -1 && idx < debitIdx) debitIdx = idx;
        }
        if (lb.contains("sent") && !lb.contains("sent to you") && !lb.contains("has sent") && !lb.contains("sent by")) {
            int idx = lb.indexOf("sent");
            if (idx != -1 && idx < debitIdx) debitIdx = idx;
        }

        if (creditIdx == Integer.MAX_VALUE && debitIdx == Integer.MAX_VALUE) return false;
        return creditIdx < debitIdx;
    }

    public boolean isDebitTransaction(String body) {
        if (body == null || body.isEmpty()) return false;
        String lb = body.toLowerCase();

        if (hasBlacklistedKeywords(lb)) return false;
        if (!hasBankingIndicators(lb)) return false;
        if (lb.contains("failed") || lb.contains("declined")) return false;

        int creditIdx = indexOfAny(lb, "credited", "received", "deposited", "deposit", "added", "paid to you", "paid you", "has paid", "sent to you", "sent you", "has sent", "transfer from", "transferred from", "money received", "payment received", "\u092a\u094d\u0930\u093e\u092a\u094d\u0924", "\u091c\u092e\u093e", "\u092e\u093f\u0932\u0947");
        int debitIdx = indexOfAny(lb, "debited", "debit", "withdrawn", "withdrawal", "spent", "deducted", "charges", "transfer to", "transferred to");

        if (lb.contains("paid") && !lb.contains("paid to you") && !lb.contains("has paid") && !lb.contains("paid by")) {
            int idx = lb.indexOf("paid");
            if (idx != -1 && idx < debitIdx) debitIdx = idx;
        }
        if (lb.contains("sent") && !lb.contains("sent to you") && !lb.contains("has sent") && !lb.contains("sent by")) {
            int idx = lb.indexOf("sent");
            if (idx != -1 && idx < debitIdx) debitIdx = idx;
        }

        if (debitIdx == Integer.MAX_VALUE) return false;
        return debitIdx < creditIdx;
    }

    private int indexOfAny(String text, String... keywords) {
        int minIdx = Integer.MAX_VALUE;
        for (String kw : keywords) {
            int idx = text.indexOf(kw);
            if (idx != -1 && idx < minIdx) minIdx = idx;
        }
        return minIdx;
    }
}
