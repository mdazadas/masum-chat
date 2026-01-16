# 🚀 Masum Chat Vercel Deployment Guide

Aapko apni **Frontend** aur **Backend** ko kaise handle karna hai, uska detailed guide yahan hai.

---

## ✅ Method 1: Sirf Frontend Deploy Karein (Recommended)
Kyunki aapka Asli Backend **Supabase** hai (jo already cloud par live hai) aur aapka app Next.js par bana hai, aapko **sirf `frontend` folder ko Vercel par deploy karna hai.**

### Step-by-Step Vercel Deployment:

1.  **GitHub par Push Karein:**
    *   Apna pura code (`masum chat` folder) GitHub par push kar dain.

2.  **Vercel Dashboard:**
    *   [Vercel Dashboard](https://vercel.com/dashboard) par jayein.
    *   **"Add New..."** > **"Project"** par click karein.
    *   Apni GitHub repo `masum chat` select karein.

3.  **📂 IMPORTANT STEP: Root Directory:**
    *   "Configure Project" screen par **Root Directory** ka option hoga.
    *   **Edit** par click karein aur `frontend` select karein.
    *   *Agar aap ye nahi karenge toh deploy fail ho jayega.*

4.  **🔑 Environment Variables:**
    *   "Environment Variables" section mein ye 2 keys add karein (jo aapki `.env.local` file mein hain):
        *   `NEXT_PUBLIC_SUPABASE_URL`: `...`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `...`

5.  **Deploy:**
    *   Click **Deploy**. Kuch seconds mein aapki site live ho jayegi!

---

## ❓ Backend Folder ka kya karein?
Jo `backend` folder humne banaya hai (jisme SQL scripts aur `server.js` hai), usko **Vercel par deploy karne ki zaroorat nahi hai.**

*   **Database:** Supabase already cloud par chal raha hai.
*   **server.js:** Ye humne sirf backup/testing ke liye banaya tha. Aapki Next.js app bina iske bhi perfectly chalegi kyunki wo direct Supabase se baat karti hai.

Agar aap future mein custom Node.js server use karna chahte hain, toh aap `backend` folder ko kisi aur service (jaise **Render** ya **Heroku**) par deploy kar sakte hain, par abhi iski zaroorat nahi hai.

---

## 🎉 Summary
**Vercel par sirf `frontend` folder jayega.** Backend (Supabase) already set hai.
