# Capacitor Integration Guide - iOS Support

## Overview

The BLE Controller app now supports **iOS** through Capacitor integration! The app automatically detects the platform and uses:
- **Web Bluetooth API** for browsers (Chrome, Edge, Opera on Desktop/Android)
- **Capacitor Bluetooth LE** for native apps (iOS, Android)

## Architecture

### Bluetooth Adapter Pattern

The app uses an adapter pattern that provides a unified interface for both platforms:

```
┌─────────────────────────────────────┐
│      bluetoothService.ts            │
│      (Singleton Service)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│    bluetoothAdapter.ts               │
│    (Platform Detection)              │
└──────────┬───────────────────────────┘
           │
           ├──────────────────┬─────────────────┐
           ▼                  ▼                 ▼
    WebBluetoothAdapter  CapacitorAdapter   (Future adapters)
    (Web Bluetooth API)  (Capacitor BLE)
```

### Key Files

- **`src/services/bluetoothAdapter.ts`** - Platform adapter with Web & Capacitor implementations
- **`src/services/bluetoothService.ts`** - Updated to use adapter (API unchanged)
- **`capacitor.config.ts`** - Capacitor configuration
- **`ios/App/App/Info.plist`** - iOS Bluetooth permissions
- **`android/app/src/main/AndroidManifest.xml`** - Android Bluetooth permissions

## Platform Features

| Feature | Web (Browser) | iOS (Native) | Android (Native) |
|---------|--------------|--------------|------------------|
| Bluetooth LE | ✅ (Chrome, Edge, Opera) | ✅ via Capacitor | ✅ via Capacitor |
| Offline PWA | ✅ | ✅ | ✅ |
| App Store | ❌ | ✅ | ✅ (Play Store) |
| Auto Updates | ✅ (PWA) | ❌ (App Store review) | ❌ (Play Store review) |

## Prerequisites

### For Android Development:
- **Node.js** 18+ (already installed)
- **Android Studio** (latest version)
- **Java JDK** 17+

### For iOS Development:
- **macOS** with Xcode 14+
- **CocoaPods** (`sudo gem install cocoapods`)
- **iOS Developer Account** ($99/year for App Store)

## Building for Android

### 1. Install Android Studio

Download from: https://developer.android.com/studio

### 2. Open Project in Android Studio

```bash
cd ble-controller
npx cap open android
```

This will open the Android project in Android Studio.

### 3. Configure Gradle (First Time)

Android Studio will automatically:
- Download required SDKs
- Sync Gradle dependencies
- Configure build tools

### 4. Build & Run

**Option A: Run on Emulator**
1. Create AVD (Android Virtual Device) in Android Studio
2. Click "Run" (▶️) button
3. Select emulator from device list

**Option B: Run on Physical Device**
1. Enable "Developer Options" on Android device
2. Enable "USB Debugging"
3. Connect via USB
4. Click "Run" (▶️) and select your device

**Option C: Build APK for Distribution**
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### 5. Sign APK for Play Store

1. Create keystore:
```bash
keytool -genkey -v -keystore ble-controller.keystore -alias ble-controller -keyalg RSA -keysize 2048 -validity 10000
```

2. Sign APK:
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore ble-controller.keystore android/app/build/outputs/apk/release/app-release-unsigned.apk ble-controller
```

3. Align APK:
```bash
zipalign -v 4 app-release-unsigned.apk ble-controller-release.apk
```

## Building for iOS

### 1. Install Dependencies (Mac Only)

```bash
cd ble-controller
sudo gem install cocoapods
cd ios/App
pod install
```

### 2. Open Project in Xcode

```bash
npx cap open ios
```

This will open the Xcode workspace.

### 3. Configure Signing

1. Select project in Xcode navigator
2. Go to "Signing & Capabilities"
3. Select your Apple Developer Team
4. Change Bundle Identifier if needed: `com.alashelectronics.blecontroller`

### 4. Build & Run

**Option A: Run on Simulator**
1. Select iPhone simulator from device menu
2. Click "Run" (▶️) button

**Option B: Run on Physical Device**
1. Connect iPhone via USB
2. Trust computer on iPhone
3. Select device from menu
4. Click "Run" (▶️)

**Option C: Archive for App Store**
1. Product → Archive
2. Follow Xcode Organizer to upload to App Store Connect

### 5. App Store Submission

1. Create app in [App Store Connect](https://appstoreconnect.apple.com/)
2. Fill app information, screenshots, description
3. Upload build from Xcode
4. Submit for review

**Note:** Apple review typically takes 1-3 days.

## Development Workflow

### Making Changes

1. Edit React code in `src/`
2. Build web assets:
```bash
npm run build
```

3. Sync to native platforms:
```bash
npx cap sync
```

4. Open in IDE and run:
```bash
npx cap open ios      # For iOS
npx cap open android  # For Android
```

### Live Reload (Development)

For faster development, use Capacitor Live Reload:

1. Update `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.alashelectronics.blecontroller',
  appName: 'BLE Controller',
  webDir: 'dist',
  server: {
    url: 'https://192.168.1.100:5173', // Your local IP
    cleartext: true
  }
};
```

2. Start dev server:
```bash
npm run dev
```

3. Run app on device - it will connect to your dev server

**Important:** Remove `server` config before production build!

## Testing Bluetooth

### Test on Web Browser
1. Run dev server: `npm run dev`
2. Open `https://localhost:5173` in Chrome
3. Click device type → Connect button
4. Browser will show Bluetooth device picker

### Test on Android
1. Build and install APK on Android device
2. Grant Bluetooth permissions when prompted
3. Test connection with HM-10 module

### Test on iOS
1. Build and install on iPhone (requires Mac + Xcode)
2. Grant Bluetooth permissions when prompted
3. Test connection with HM-10 module

## Updating the App

### Web (PWA) - Automatic
Users get updates automatically when they reload the app.

### iOS/Android - Manual
1. Update version in `package.json`
2. Update version in platform configs:
   - iOS: `ios/App/App.xcodeproj/project.pbxproj`
   - Android: `android/app/build.gradle`
3. Build and submit to App Store/Play Store
4. Users update through app stores

## Permissions

### iOS (Info.plist)
Already configured:
- `NSBluetoothAlwaysUsageDescription` - Bluetooth access
- `NSBluetoothPeripheralUsageDescription` - Legacy iOS support

### Android (AndroidManifest.xml)
Already configured:
- `BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT` - Android 12+
- `BLUETOOTH` / `BLUETOOTH_ADMIN` - Older Android
- `ACCESS_FINE_LOCATION` - Required for BLE scanning on older Android
- `android.hardware.bluetooth_le` - Hardware feature requirement

## Troubleshooting

### iOS: "pod install" fails
```bash
cd ios/App
pod repo update
pod install
```

### Android: Gradle sync fails
1. Open Android Studio
2. File → Invalidate Caches → Restart
3. File → Sync Project with Gradle Files

### Bluetooth not working on iOS Simulator
**Expected behavior** - iOS Simulator doesn't support Bluetooth. Must test on physical device.

### "xcode-select" error
On Mac without Xcode:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### App crashes on Android 12+
Check Bluetooth permissions are granted:
- Settings → Apps → BLE Controller → Permissions → Nearby devices → Allow

## File Structure After Capacitor

```
ble-controller/
├── src/                           # React source code
├── dist/                          # Built web assets
├── ios/                           # iOS native project (Xcode)
│   └── App/
│       ├── App.xcworkspace       # Open this in Xcode
│       └── App/
│           └── Info.plist        # iOS permissions
├── android/                       # Android native project
│   └── app/
│       └── src/main/
│           └── AndroidManifest.xml  # Android permissions
├── capacitor.config.ts            # Capacitor configuration
├── package.json
└── CAPACITOR_GUIDE.md            # This file
```

## Next Steps

### For Testing:
1. **Android:** Install Android Studio → Open project → Run on emulator/device
2. **iOS (Mac only):** Install Xcode → Run `pod install` → Open project → Run on simulator/device

### For Production:
1. **Android:** Build signed APK → Upload to Google Play Console
2. **iOS:** Archive in Xcode → Upload to App Store Connect → Submit for review

### For Distribution:
- **Beta Testing:** Use TestFlight (iOS) and Google Play Internal Testing (Android)
- **Production:** Publish to App Store and Google Play Store

## Resources

- **Capacitor Docs:** https://capacitorjs.com/docs
- **Bluetooth LE Plugin:** https://github.com/capacitor-community/bluetooth-le
- **iOS Deployment:** https://capacitorjs.com/docs/ios/deploying-to-app-store
- **Android Deployment:** https://capacitorjs.com/docs/android/deploying-to-google-play

## Platform Comparison

| Aspect | Web (PWA) | iOS (Native) | Android (Native) |
|--------|-----------|--------------|------------------|
| Installation | Browser prompt | App Store | Play Store |
| Size | <1 MB | ~15-20 MB | ~10-15 MB |
| Updates | Instant | App Store review (1-3 days) | Play Store review (hours-days) |
| Bluetooth on iOS | ❌ Not supported | ✅ Full support | ✅ Full support |
| Offline | ✅ | ✅ | ✅ |
| Distribution | Free (GitHub Pages) | $99/year (Apple) | $25 one-time (Google) |
| Development | Any OS | macOS only | Any OS |

## Summary

✅ **Capacitor integrated successfully!**

✅ **Bluetooth adapter created** - works on Web and Native

✅ **iOS support enabled** - requires Mac + Xcode to build

✅ **Android ready** - can be built on any OS with Android Studio

✅ **Permissions configured** - iOS (Info.plist) and Android (AndroidManifest.xml)

✅ **PWA still works** - web version continues to function

The app now supports **ALL major platforms**:
- ✅ Web (Chrome/Edge/Opera on Desktop/Android)
- ✅ iOS (Native app via Capacitor)
- ✅ Android (Native app via Capacitor + Web PWA)

---

**Need Help?** Open an issue at: https://github.com/Alash-electronics/bluetoothWebApp/issues
