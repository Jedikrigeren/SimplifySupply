# APK/Production Build Testing Checklist

These items require a production build (APK/IPA) and cannot be fully tested in Expo Go:

## Items Requiring Production Build

### Token Persistence Testing
- [ ] Test token persistence after complete app kill and restart
- [ ] Verify SecureStore encryption works in production
- [ ] Test app behavior after OS-level app data clear

### Session Management
- [ ] Test session timeout and automatic re-authentication
- [ ] Test concurrent sessions (multiple devices with same account)
- [ ] Verify token refresh works correctly in background/suspended state

### Performance & Optimization
- [ ] Test app performance on low-end devices
- [ ] Measure actual app bundle size
- [ ] Test app startup time with stored tokens
- [ ] Profile memory usage during authentication flows

### Security Testing
- [ ] Verify certificate pinning (if implemented)
- [ ] Test deep linking security
- [ ] Verify no sensitive data in logs on production builds
- [ ] Test app behavior in airplane mode / no network
- [ ] Verify tokens cannot be extracted from device storage

### Production Configuration
- [ ] Test with production API URL
- [ ] Verify error tracking (Sentry/equivalent) if implemented
- [ ] Test push notifications (if implemented)
- [ ] Verify analytics tracking (if implemented)

### Edge Cases
- [ ] Test app behavior during OS updates
- [ ] Test after timezone changes
- [ ] Test with system date/time modifications
- [ ] Test low battery mode behavior
- [ ] Test background app refresh

## Build Instructions

### Android APK
```bash
eas build --platform android --profile preview
```

### iOS IPA (requires Apple Developer account)
```bash
eas build --platform ios --profile preview
```

### Local Development Build
```bash
npx expo prebuild
npx expo run:android
# or
npx expo run:ios
```
