package com.example.upipaymentalert.smsparser;

/**
 * Deterministic multi-language announcement templates for all 13 Indian languages.
 * High-performance Java implementation for the open source edition.
 */
public class AnnouncementPhrases {

    public enum Lang {
        ENGLISH("en", "English"),
        HINDI("hi", "Hindi"),
        TAMIL("ta", "Tamil"),
        TELUGU("te", "Telugu"),
        KANNADA("kn", "Kannada"),
        MALAYALAM("ml", "Malayalam"),
        GUJARATI("gu", "Gujarati"),
        PUNJABI("pa", "Punjabi"),
        BENGALI("bn", "Bengali"),
        MARATHI("mr", "Marathi"),
        ODIA("or", "Odia"),
        ASSAMESE("as", "Assamese"),
        URDU("ur", "Urdu");

        private final String code;
        private final String label;

        Lang(String code, String label) {
            this.code = code;
            this.label = label;
        }

        public String getCode() {
            return code;
        }

        public String getLabel() {
            return label;
        }

        public static Lang fromString(String lang) {
            if (lang == null) return ENGLISH;
            String lower = lang.toLowerCase(java.util.Locale.ROOT);
            if (lower.contains("hindi")) return HINDI;
            if (lower.contains("tamil")) return TAMIL;
            if (lower.contains("telugu")) return TELUGU;
            if (lower.contains("kannada")) return KANNADA;
            if (lower.contains("malayalam")) return MALAYALAM;
            if (lower.contains("gujarati")) return GUJARATI;
            if (lower.contains("punjabi")) return PUNJABI;
            if (lower.contains("bengali")) return BENGALI;
            if (lower.contains("marathi")) return MARATHI;
            if (lower.contains("odia")) return ODIA;
            if (lower.contains("assamese")) return ASSAMESE;
            if (lower.contains("urdu")) return URDU;
            return ENGLISH;
        }
    }

    public static final String[] SUPPORTED_LANGUAGES = new String[]{
            "English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam",
            "Gujarati", "Punjabi", "Bengali", "Marathi", "Odia", "Assamese", "Urdu"
    };

    /**
     * Builds a natural, fluent spoken announcement phrase for the specified language.
     */
    public static String buildPhrase(String languageStr, String amount, String paisa, String senderName) {
        Lang lang = Lang.fromString(languageStr);
        boolean hasPaisa = paisa != null && !paisa.isEmpty() && !"0".equals(paisa) && !"00".equals(paisa);
        boolean hasSender = senderName != null && !senderName.trim().isEmpty();
        String sender = hasSender ? senderName.trim() : "";

        switch (lang) {
            case HINDI:
                if (hasSender) {
                    return hasPaisa ? (sender + " से " + amount + " रुपये और " + paisa + " पैसे प्राप्त हुए")
                                    : (sender + " से " + amount + " रुपये प्राप्त हुए");
                } else {
                    return hasPaisa ? (amount + " रुपये और " + paisa + " पैसे प्राप्त हुए")
                                    : (amount + " रुपये प्राप्त हुए");
                }

            case TAMIL:
                if (hasSender) {
                    return hasPaisa ? (sender + " இடமிருந்து " + amount + " ரூபாய் மற்றும் " + paisa + " காசுகள் பெறப்பட்டது")
                                    : (sender + " இடமிருந்து " + amount + " ரூபாய் பெறப்பட்டது");
                } else {
                    return hasPaisa ? (amount + " ரூபாய் மற்றும் " + paisa + " காசுகள் பெறப்பட்டது")
                                    : (amount + " ரூபாய் பெறப்பட்டது");
                }

            case TELUGU:
                if (hasSender) {
                    return hasPaisa ? (sender + " నుండి " + amount + " రూపాయలు మరియు " + paisa + " పైసలు అందాయి")
                                    : (sender + " నుండి " + amount + " రూపాయలు అందాయి");
                } else {
                    return hasPaisa ? (amount + " రూపాయలు మరియు " + paisa + " పైసలు అందాయి")
                                    : (amount + " రూపాయలు అందాయి");
                }

            case KANNADA:
                if (hasSender) {
                    return hasPaisa ? (sender + " ಅವರಿಂದ " + amount + " ರೂಪಾಯಿ ಮತ್ತು " + paisa + " ಪೈಸೆ ಜಮೆಯಾಗಿದೆ")
                                    : (sender + " ಅವರಿಂದ " + amount + " ರೂಪಾಯಿ ಜಮೆಯಾಗಿದೆ");
                } else {
                    return hasPaisa ? (amount + " ರೂಪಾಯಿ ಮತ್ತು " + paisa + " ಪೈಸೆ ಜಮೆಯಾಗಿದೆ")
                                    : (amount + " ರೂಪಾಯಿ ಜಮೆಯಾಗಿದೆ");
                }

            case MALAYALAM:
                if (hasSender) {
                    return hasPaisa ? (sender + " ൽ നിന്ന് " + amount + " രൂപ " + paisa + " പൈസ ലഭിച്ചു")
                                    : (sender + " ൽ നിന്ന് " + amount + " രൂപ ലഭിച്ചു");
                } else {
                    return hasPaisa ? (amount + " രൂപ " + paisa + " പൈസ ലഭിച്ചു")
                                    : (amount + " രൂപ ലഭിച്ചു");
                }

            case GUJARATI:
                if (hasSender) {
                    return hasPaisa ? (sender + " તરફથી " + amount + " રૂપિયા અને " + paisa + " પૈસા મળ્યા")
                                    : (sender + " તરફથી " + amount + " રૂપિયા મળ્યા");
                } else {
                    return hasPaisa ? (amount + " રૂપિયા અને " + paisa + " પૈસા મળ્યા")
                                    : (amount + " રૂપિયા મળ્યા");
                }

            case PUNJABI:
                if (hasSender) {
                    return hasPaisa ? (sender + " ਤੋਂ " + amount + " ਰੁਪਏ ਅਤੇ " + paisa + " ਪੈਸੇ ਪ੍ਰਾਪਤ ਹੋਏ")
                                    : (sender + " ਤੋਂ " + amount + " ਰੁਪਏ ਪ੍ਰਾਪਤ ਹੋਏ");
                } else {
                    return hasPaisa ? (amount + " ਰੁਪਏ ਅਤੇ " + paisa + " ਪੈਸੇ ਪ੍ਰਾਪਤ ਹੋਏ")
                                    : (amount + " ਰੁਪਏ ਪ੍ਰਾਪਤ ਹੋਏ");
                }

            case BENGALI:
                if (hasSender) {
                    return hasPaisa ? (sender + " থেকে " + amount + " টাকা আর " + paisa + " পয়সা পাওয়া গেছে")
                                    : (sender + " থেকে " + amount + " টাকা পাওয়া গেছে");
                } else {
                    return hasPaisa ? (amount + " টাকা আর " + paisa + " পয়সা পাওয়া গেছে")
                                    : (amount + " টাকা পাওয়া গেছে");
                }

            case MARATHI:
                if (hasSender) {
                    return hasPaisa ? (sender + " कडून " + amount + " रुपये आणि " + paisa + " पैसे मिळाले")
                                    : (sender + " कडून " + amount + " रुपये मिळाले");
                } else {
                    return hasPaisa ? (amount + " रुपये आणि " + paisa + " पैसे मिळाले")
                                    : (amount + " रुपये मिळाले");
                }

            case ODIA:
                if (hasSender) {
                    return hasPaisa ? (sender + " ଠାରୁ " + amount + " ଟଙ୍କା ଏବଂ " + paisa + " ପଇସା ମିଳିଲା")
                                    : (sender + " ଠାରୁ " + amount + " ଟଙ୍କା ମିଳିଲା");
                } else {
                    return hasPaisa ? (amount + " ଟଙ୍କା ଏବଂ " + paisa + " ପଇସା ମିଳିଲା")
                                    : (amount + " ଟଙ୍କା ମିଳିଲା");
                }

            case ASSAMESE:
                if (hasSender) {
                    return hasPaisa ? (sender + " ৰ পৰা " + amount + " টকা আৰু " + paisa + " পইচা পোৱা গল")
                                    : (sender + " ৰ পৰা " + amount + " টকা পোৱা গল");
                } else {
                    return hasPaisa ? (amount + " টকা আৰু " + paisa + " পইচা পোৱা গল")
                                    : (amount + " টকা পোৱা গল");
                }

            case URDU:
                if (hasSender) {
                    return hasPaisa ? (sender + " سے " + amount + " روپے اور " + paisa + " پیسے موصول ہوئے")
                                    : (sender + " سے " + amount + " روپے موصول ہوئے");
                } else {
                    return hasPaisa ? (amount + " روپے اور " + paisa + " پیسے موصول ہوئے")
                                    : (amount + " روپے موصول ہوئے");
                }

            case ENGLISH:
            default:
                if (hasSender) {
                    return hasPaisa ? ("Received " + amount + " rupees and " + paisa + " paisa from " + sender)
                                    : ("Received " + amount + " rupees from " + sender);
                } else {
                    return hasPaisa ? ("Received " + amount + " rupees and " + paisa + " paisa")
                                    : ("Received " + amount + " rupees");
                }
        }
    }

    public static String getUnknownAmountPhrase(String languageStr) {
        Lang lang = Lang.fromString(languageStr);
        switch (lang) {
            case HINDI: return "भुगतान प्राप्त हुआ";
            case TAMIL: return "பணம் பெறப்பட்டது";
            case TELUGU: return "చెల్లింపు అందింది";
            case KANNADA: return "ಪಾವತಿ ಜಮೆಯಾಗಿದೆ";
            case MALAYALAM: return "പേയ്‌മെന്റ് ലഭിച്ചു";
            case GUJARATI: return "ચૂકવણી મળી";
            case PUNJABI: return "ਭੁਗਤਾਨ ਪ੍ਰਾਪਤ ਹੋਇਆ";
            case BENGALI: return "পেমেন্ট পাওয়া গেছে";
            case MARATHI: return "पेमेंट मिळाले";
            case ODIA: return "ପେମେଣ୍ଟ ମିଳିଲା";
            case ASSAMESE: return "পেমেন্ট পোৱা গল";
            case URDU: return "ادائیگی موصول ہوئی";
            case ENGLISH:
            default:
                return "Payment received";
        }
    }
}
