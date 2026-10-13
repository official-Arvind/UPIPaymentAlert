<div align="center">

<a href="https://github.com/official-arvind/UPIPaymentAlert">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&height=180&section=header&text=Contributing%20to%20UPI%20Payment%20Alert&fontSize=32&fontColor=ffffff&fontAlignY=38&desc=Help%20make%20payments%20audible%20and%20private&descAlignY=58&descSize=16&animation=fadeIn" width="100%"/>
</a>

<br/>

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&weight=700&size=18&duration=2500&pause=800&color=f97316&center=true&vCenter=true&width=650&lines=Fork+it.+Build+it.+PR+it.+Get+credited.+%F0%9F%9A%80;Every+contributor+lives+in+this+repo+forever.;No+corporate+BS.+Just+raw+good+code.)](https://github.com/official-arvind/UPIPaymentAlert)

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

## ⚡ Introduction

UPI Payment Alert is a community-driven open-source project. Arvind Ji reviews every PR personally and welcomes all code contributions, bug reports, and features.

---

## 🛡️ Stability Policy (Gold Edition)

> [!IMPORTANT]
> **UPI Payment Alert v2.0 is considered the final, feature-complete Gold Edition.** 
> This means it is considered feature-complete. No further features or updates will be merged unless they address one of the following breaking changes:
> - Major Android API changes breaking the Notification Listener or Background Service model.
> - Structural SMS formatting updates in banking messages that require parser tuning.
> - Critical security vulnerabilities.

---

## 📂 Codebase Anatomy

The codebase is organized as a standard Android Studio project:

```text
UPIPaymentAlert/
├── app/
│   ├── src/main/
│   │   ├── java/com/example/upipaymentalert/
│   │   │   ├── MainActivity.java            # Main setup wizard & test UI
│   │   │   ├── ForegroundTtsService.java    # Unkillable background TTS speaker
│   │   │   ├── NotificationListener.java    # Reads push notifications
│   │   │   └── smsparser/SmsParser.java     # Regex amount extractor
│   │   └── res/layout/activity_main.xml     # Clean dark UI layout
```

---

## 🚀 How to Contribute

1. **Fork the Repository** on GitHub.
2. **Clone your fork** to your local machine:
   ```bash
   git clone https://github.com/YOUR-USERNAME/UPIPaymentAlert.git
   cd UPIPaymentAlert
   ```
3. **Open the project in Android Studio** and make your changes.
4. **Verify the build** passes using Gradle:
   ```bash
   ./gradlew assembleDebug
   ```
5. **Commit and push** your changes to your fork.
6. **Submit a Pull Request** to the `main` branch.

---

<div align="center">
  <p><b>© 2026 Arvind Ji · <a href="https://github.com/official-arvind" target="_blank">GitHub</a> · <a href="https://github.com/official-arvind/UPIPaymentAlert" target="_blank">Official Repo</a></b></p>
</div>
