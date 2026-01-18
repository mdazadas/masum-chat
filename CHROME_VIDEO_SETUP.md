# 🎥 Chrome Video Call Setup Guide

## ⚠️ Chrome Camera/Mic Permission Issue

Chrome requires **HTTPS** for camera/microphone access, EXCEPT for `localhost`.

### ✅ Quick Fix for Local Development

#### Option 1: Use Localhost (Recommended)
Access the app at: **http://localhost:3000**

#### Option 2: Enable Insecure Origins (For IP Access)
If you need to access via IP (e.g., `http://10.14.121.211:3000`):

1. Open Chrome
2. Go to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
3. Add your URL: `http://10.14.121.211:3000`
4. Select "Enabled"
5. Click "Relaunch"

#### Option 3: Use HTTPS Tunnel (For Mobile Testing)
Already set up with Cloudflare tunnels!

---

## 🔧 Testing Camera/Mic Permissions

### Step 1: Check Browser Permissions
1. Click the **lock icon** in address bar
2. Ensure Camera and Microphone are set to "Allow"
3. If blocked, click and select "Allow"

### Step 2: Test Camera Access
Open Chrome DevTools Console and run:
```javascript
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    console.log('✅ Camera/Mic working!', stream);
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('❌ Error:', err));
```

### Step 3: Check Available Devices
```javascript
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    console.log('Available devices:', devices);
  });
```

---

## 🚀 For Production Deployment

### Required:
- ✅ HTTPS certificate (Let's Encrypt, Cloudflare, etc.)
- ✅ Valid domain name
- ✅ Proper CORS configuration

### Recommended Platforms:
- **Vercel** (Auto HTTPS)
- **Netlify** (Auto HTTPS)
- **Cloudflare Pages** (Auto HTTPS)

---

## 🐛 Common Issues & Solutions

### "Permission Denied" in Chrome
**Cause:** Site blocked camera/mic  
**Fix:** 
1. Go to `chrome://settings/content/camera`
2. Remove site from "Blocked" list
3. Refresh page

### "NotAllowedError"
**Cause:** User clicked "Block" on permission prompt  
**Fix:**
1. Click lock icon in address bar
2. Reset permissions
3. Refresh page

### "NotFoundError"
**Cause:** No camera/mic detected  
**Fix:**
- Check if camera is connected
- Close other apps using camera (Zoom, Teams, etc.)
- Restart browser

### "NotReadableError"
**Cause:** Camera in use by another app  
**Fix:**
- Close all apps using camera
- Restart browser
- Restart computer if needed

---

## ✅ Verification Checklist

Before testing video calls:
- [ ] Using Chrome 90+ or Edge 90+
- [ ] Accessing via `localhost` OR HTTPS
- [ ] Camera/Mic permissions allowed
- [ ] No other app using camera
- [ ] Both users online
- [ ] Backend server running

---

## 📱 Mobile Chrome

Mobile Chrome also requires HTTPS for camera access.

**For Testing:**
Use the Cloudflare tunnel URL (already configured):
- Frontend: `https://cleared-ipod-si.trycloudflare.com`
- Backend: `https://beats-guitars-m.trycloudflare.com`

---

## 🔐 Security Note

Chrome's camera/mic restrictions are for **user security**. 
- Prevents malicious sites from accessing camera
- Ensures user consent
- Protects privacy

This is a **feature, not a bug**! 🛡️
