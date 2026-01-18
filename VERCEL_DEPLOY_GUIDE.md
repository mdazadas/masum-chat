# 🚀 Vercel Deployment Guide - Masum Chat

To deploy your frontend on Vercel smoothly, follow these steps:

## 1. Prepare for Deployment
- ✅ Saare `localhost` references hata diye gaye hain.
- ✅ Environment variables configure kar diye gaye hain.
- ✅ `next.config.ts` optimized hai.

## 2. GitHub Push
Pehle apna latest code push karein:
```bash
git add .
git commit -m "chore: Prepare for Vercel deployment and remove localhost"
git push origin main
```

## 3. Vercel Dashboard Pe Setup
1. **Import Project:** [Vercel Dashboard](https://vercel.com/new) pe jayein aur `masum-chat` repo select karein.
2. **Framework Preset:** Next.js (Auto-detected).
3. **Root Directory:** `./frontend`.
4. **Environment Variables:**
   Add these variables in the Vercel dashboard:
   
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://vmiblbbikkqxynutwucw.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (Aapka anon key) |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://your-backend-url.com` |

   > **Note:** `NEXT_PUBLIC_SOCKET_URL` ke liye aapko apna backend host karna hoga (Render, Railway, ya aisi service pe jo Socket.IO support karti hai).

## 4. Backend Deployment (Vercel Pe Nahi Hoga)
Vercel serverless hai, is liye Socket.IO backend wahan nahi chal sakta. 
**Recommended for Backend:**
- **Render.com** (Free tier available)
- **Railway.app** (Very easy setup)
- **DigitalOcean**
- **Fly.io**

Backend deploy karne ke baad jo URL milega use Vercel ke `NEXT_PUBLIC_SOCKET_URL` mein daal dein.

---

## ✅ Deployment Status
- ✅ Frontend code base cleaned.
- ✅ No hardcoded localhost in logic.
- ✅ Supabase keys up-to-date.

**Ready to Fly! 🚀**
