<div align="center">

<a href="https://github.com/official-arvind/UPIPaymentAlert">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=180&section=header&text=Contributing%20to%20UPI%20Payment%20Alert&fontSize=32&fontColor=ffffff&fontAlignY=38&desc=Help%20make%20payments%20audible%20and%20private&descAlignY=58&descSize=16&animation=fadeIn" width="100%"/>
</a>

<br/>

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&weight=700&size=18&duration=2500&pause=800&color=f97316&center=true&vCenter=true&width=650&lines=Fork+it.+Build+it.+PR+it.+Get+credited.+%F0%9F%9A%80;Every+contributor+lives+in+this+repo+forever.;No+corporate+red-tape.+Just+raw+clean+code.)](https://github.com/official-arvind/UPIPaymentAlert)

<br/>

<a href="https://github.com/official-arvind/UPIPaymentAlert/issues">
  <img src="https://img.shields.io/github/issues/official-arvind/UPIPaymentAlert?style=for-the-badge&logo=github&logoColor=white&color=e74c3c&label=Open%20Issues" alt="Issues"/>
</a>
<a href="https://github.com/official-arvind/UPIPaymentAlert/pulls">
  <img src="https://img.shields.io/github/issues-pr/official-arvind/UPIPaymentAlert?style=for-the-badge&logo=git&logoColor=white&color=3498db&label=Open%20PRs" alt="Pull Requests"/>
</a>
<a href="https://github.com/official-arvind/UPIPaymentAlert/graphs/contributors">
  <img src="https://img.shields.io/github/contributors/official-arvind/UPIPaymentAlert?style=for-the-badge&logo=handshake&logoColor=white&color=22c55e&label=Contributors" alt="Contributors"/>
</a>

</div>

---

## ⚡ Welcome Contributors!

**UPI Payment Alert** is an open-source, hardware-accelerated soundbox utility for Android built by **Arvind Ji**. It allows merchants, shopkeepers, and everyday users to receive instant, audible voice announcements for incoming UPI payments without expensive monthly rental hardware.

We welcome code contributions, bug reports, language improvements, and bank parser refinements from developers worldwide. **Arvind Ji** reviews pull requests personally.

---

## 📂 Repository Anatomy

```text
UPIPaymentAlert/
├── app/
│   ├── src/main/java/com/example/upipaymentalert/
│   │   ├── MainActivity.java            # Main setup wizard & dashboard UI
│   │   ├── ForegroundTtsService.java    # Sticky background audio service with LoudnessEnhancer
│   │   ├── NotificationListener.java    # Reads push notifications from 28+ UPI apps
│   │   ├── LocaleHelper.java            # In-app dynamic locale switcher for 13 Indian languages
│   │   ├── TtsEngineHelper.java         # Google Speech Services detection & voice pre-warmer
│   │   ├── broadcastreciever/
│   │   │   └── SmsListener.java         # Intercepts transactional bank SMS
│   │   └── smsparser/
│   │       ├── SmsParser.java           # High-precision regex currency & sender parser
│   │       └── AnnouncementPhrases.java # Deterministic phrases for 13 Indian languages
│   ├── src/main/res/                    # Glassmorphic dark layout & resources
│   └── build.gradle                     # Gradle build script (SDK 24-35)
├── docs/                                # Official website & documentation pages
├── LICENSE                              # MIT License
├── CHANGELOG.md                         # Release history
└── CONTRIBUTING.md                      # This contribution guide
```

---

## 🛠️ Prerequisites & Setup

- **Android Studio**: Iguana (2023.2.1) or newer
- **JDK**: Java Development Kit 17 (or Eclipse Adoptium 17+)
- **Android SDK**: API level 35 (compileSdk 35, minSdk 24)
- **Git**

### Clone the Repository:
```bash
git clone https://github.com/official-arvind/UPIPaymentAlert.git
cd UPIPaymentAlert
```

---

## 🏗️ Building the Project

### Building Debug APK:
```bash
./gradlew assembleDebug
```
The output APK is generated at:
`app/build/outputs/apk/debug/app-debug.apk`

### Building Signed Release APK:
Ensure `keystore.properties` is configured in the root directory, then execute:
```bash
./gradlew assembleRelease
```
The output APK is generated at:
`app/build/outputs/apk/release/app-release.apk`

---

## 🇮🇳 Contributing to Indian Language Vocal Packs

The soundbox natively supports **13 Indian languages**:
`English`, `Hindi`, `Gujarati`, `Marathi`, `Tamil`, `Telugu`, `Kannada`, `Malayalam`, `Punjabi`, `Bengali`, `Odia`, `Assamese`, and `Urdu`.

If you are a native speaker of any of these languages:
1. Locate [`AnnouncementPhrases.java`](app/src/main/java/com/example/upipaymentalert/smsparser/AnnouncementPhrases.java).
2. Examine the `buildPhrase(languageStr, amount, paisa, senderName)` method.
3. Ensure the grammar, word order, and paisa conjunction match natural merchant spoken phrasing.
4. Verify that the matching language code is properly registered in [`LocaleHelper.java`](app/src/main/java/com/example/upipaymentalert/LocaleHelper.java).
5. Test using the **Test Sound** and **Amount Test** buttons in `MainActivity`.

---

## 📋 Code Quality & Contribution Standards

To keep the codebase reliable, secure, and production-grade, all contributors must observe these core rules:
- **Zero Placeholders**: Never submit code containing `// TODO: implement this later`, fake mock data, or dummy placeholders. All logic must be complete, tested, and fully functional.
- **Privacy By Design**: The app is strictly 100% offline. Never add tracking, analytics, or external API pings.
- **Battery Optimization**: Never run polling loops or unthrottled wake locks. Background work must follow strict Android foreground service guidelines.
- **Maintain Comments**: Preserve and update comments, docstrings, and licensing headers.

---

## 🚀 Pull Request Workflow

1. **Fork** the repository on GitHub.
2. **Create a topic branch** from `main`:
   ```bash
   git checkout -b feature/your-awesome-feature
   ```
3. **Commit your changes** with clear, descriptive commit messages:
   ```bash
   git commit -m "feat(parser): add support for XYZ Bank payment SMS pattern"
   ```
4. **Test thoroughly** on an emulator or real Android device.
5. **Push to your fork**:
   ```bash
   git push origin feature/your-awesome-feature
   ```
6. **Open a Pull Request** targeting the `main` branch on `official-arvind/UPIPaymentAlert`.
7. Describe what changes were made, why they are beneficial, and provide test verification.

---

<div align="center">
  <p><b>Built with ❤️ by Arvind Ji · <a href="https://github.com/official-arvind" target="_blank">GitHub</a> · <a href="https://github.com/official-arvind/UPIPaymentAlert" target="_blank">Official Repo</a></b></p>
</div>
