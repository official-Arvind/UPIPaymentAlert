# Changelog

## V2.0 GOLD EDITION - Final Release
- **Premium UI Overhaul**: Brand new iOS-style dark mode theme (#080b14) with Jigar Corporation orange gradient accents.
- **Dual-Listener & Deduplication**: Added Push Notification listener alongside SMS to support all UPI apps (PhonePe, GPay, Paytm, BHIM, etc.). Smart deduplication engine prevents duplicate announcements within 60 seconds.
- **Sequential TTS Queuing**: Handles simultaneous payments smoothly by queuing announcements instead of cutting them off.
- **Independent Volume Control**: App announcement volume respects the in-app slider without altering system media/ringtone volume.
- **Unkillable Background Reliability**: Sticky foreground service guarantees the app runs continuously and is never killed by Android.
- **Optimized Permission Wizard**: Step-by-step UI to flawlessly handle all necessary permissions (SMS, Notification Access, Post Notifications, Battery Optimization) across Android 7 to 15.
- **New Branding**: Shiny new Jigar Tools premium logo and branding.

## v1.0 Final - Release
- Persistent background SMS listener (manifest-registered receiver)
- Automatic runtime permission requests at app launch
- Improved Text-to-Speech with Hindi/English handling and stable playback
- UI: language selector, test sound, amount test, and list of detected installed UPI apps
- Saves and displays the latest SMS when app is opened
- Updated versionName to `v1.0 Final`
- GitHub Actions workflow to build and sign release APK
