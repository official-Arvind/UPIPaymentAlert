# Changelog

All notable changes to the **UPI Payment Alert** project are documented in this file.

---

## 🏆 V2.0 GOLD EDITION — Production Final Release

> **Release Date:** October 2026  
> **Status:** Feature Complete & Production Hardened  
> **Author:** Arvind Ji  
> **Target Android:** Android 7.0 (API 24) to Android 15 (API 35)

### 🌟 Major Highlights & New Features

#### 1. 🇮🇳 Comprehensive 13 Indian Languages Support (Voice & UI)
- **Deterministic Spoken Announcements**: Natural, fluent, grammatically correct payment announcement templates for **all 13 major Indian languages**:
  1. **English** (`en`) — *"500 rupees received"*
  2. **हिन्दी / Hindi** (`hi`) — *"500 रुपये प्राप्त हुए"*
  3. **ગુજરાતી / Gujarati** (`gu`) — *"500 રૂપિયા મળ્યા"*
  4. **मराठी / Marathi** (`mr`) — *"500 रुपये मिळाले"*
  5. **தமிழ் / Tamil** (`ta`) — *"500 ரூபாய் பெறப்பட்டது"*
  6. **తెలుగు / Telugu** (`te`) — *"500 రూపాయలు అందాయి"*
  7. **ಕನ್ನಡ / Kannada** (`kn`) — *"500 ರೂಪಾಯಿಗಳು ಸ್ವೀಕರಿಸಲಾಗಿದೆ"*
  8. **മലയാളം / Malayalam** (`ml`) — *"500 രൂപ ലഭിച്ചു"*
  9. **ਪੰਜਾਬੀ / Punjabi** (`pa`) — *"500 ਰੁਪਏ ਪ੍ਰਾਪਤ ਹੋਏ"*
  10. **বাংলা / Bengali** (`bn`) — *"500 টাকা পাওয়া গেছে"*
  11. **ଓଡ଼ିଆ / Odia** (`or`) — *"500 ଟଙ୍କା ଗ୍ରହଣ କରାଗଲା"*
  12. **অসমীয়া / Assamese** (`as`) — *"500 টকা গ্ৰহণ কৰা হ'ল"*
  13. **اردو / Urdu** (`ur`) — *"500 روپے موصول ہوئے"*
- **Dynamic In-App Locale Switching**: Real-time language selector dynamically updates activity contexts and UI without requiring a device restart.
- **Native Indian Voice Selection**: `ForegroundTtsService` dynamically queries system voice models and binds directly to native Indian locale voice engines.

#### 2. 🎙️ Google Speech Services Engine Pre-warming
- Automatically detects **Google Speech Services** (`com.google.android.tts`).
- Asynchronously pre-warms the Google TTS engine on app launch and verifies voice data models for all 13 Indian languages.
- Fallback handling for Samsung TTS and standard system default engines.

#### 3. 🔊 Hardware Loudness Boost (Up to 200%)
- Integrates Android's low-level `android.media.audiofx.LoudnessEnhancer` by attaching directly to the audio stream session.
- Delivers up to **+1500 mB acoustic boost** for volume levels configured between 101% and 200%, ensuring clear audibility in busy marketplace environments.

#### 4. ⚡ Dual SMS & Notification Interception
- **NotificationListener**: Intercepts payment pushes from 28+ UPI and banking apps (PhonePe, Google Pay, Paytm, BHIM, Cred, Amazon Pay, Navi, FamPay, SBI Yono, HDFC, ICICI, Axis, Kotak, PNB, and more).
- **SmsListener**: Broadcast receiver intercepts banking transactional SMS with regex-powered currency, sender name, and paisa extraction.
- **60-Second Sliding Window Deduplication**: Prevents duplicate announcements when both SMS and Push Notification arrive simultaneously for the same payment.

#### 5. ⏱️ Segmented Speech Rate Control
- Splits announcement phrases into structural text and currency amount segments.
- Reads structural phrases at standard baseline speed (`0.9x`) while allowing independent custom speed adjustment for numerical amounts (`0.5x` to `1.5x`), ensuring numbers are clearly articulated.

#### 6. 📤 Carrier SMS Forwarder
- Optional SMS forwarding utility allowing transaction notifications to be forwarded to a secondary merchant or manager phone number.
- Secure password obfuscation toggle and explicit carrier charge acknowledgement modal before activation.

#### 7. 🎨 Premium Dark Glassmorphic UI & Statement Export
- Modern iOS-inspired dark aesthetic (`#080B14`) with custom orange gradient accents.
- Responsive transaction history list with Room Database persistence and HTML statement export functionality.

#### 8. 🔒 100% Offline Privacy Guarantee
- Pure on-device synthesis and local database storage.
- Zero external cloud servers, zero analytics, and zero financial data transmission.

---

## 🚀 v1.0 Final — Baseline Release

- Persistent background SMS listener registered in `AndroidManifest.xml`.
- Runtime permissions management wizard for SMS and Notifications.
- Text-to-Speech playback for Hindi and English.
- Basic UI with language selector, volume control, and sound test triggers.
- Initial Room database integration for payment records.
- GitHub Actions automated build pipeline.
