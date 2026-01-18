# 💬 Masum Chat - Frontend

A modern, real-time chat application built with Next.js, TypeScript, and Supabase.

![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=for-the-badge&logo=supabase)

## ✨ Features

### 💬 Messaging
- ✅ Real-time messaging with Supabase Realtime
- ✅ Read receipts (double check marks)
- ✅ Typing indicators
- ✅ Message status (sent/delivered/read)
- ✅ Image sharing
- ✅ Message deletion
- ✅ Emoji picker

### 📞 Video & Audio Calling
- ✅ HD video calls (up to 1080p)
- ✅ Audio-only calls
- ✅ WebRTC peer-to-peer connections
- ✅ TURN servers for NAT traversal
- ✅ Call controls (mute, video on/off)
- ✅ Call history
- ✅ Incoming call notifications with ringtone

### 🟢 Online Presence
- ✅ Real-time online/offline status
- ✅ Green dot indicator
- ✅ Last seen timestamp
- ✅ Privacy controls

### 🔔 Notifications
- ✅ Browser push notifications
- ✅ Sound alerts
- ✅ Vibration (mobile)
- ✅ Customizable settings

### ⚙️ Settings
- ✅ Notification preferences
- ✅ Video quality selection
- ✅ Privacy controls (read receipts, online status)
- ✅ Cookie-based persistence

### 🎨 UI/UX
- ✅ Modern dark theme
- ✅ WhatsApp-like interface
- ✅ Glassmorphism effects
- ✅ Smooth animations (Framer Motion)
- ✅ Mobile-first responsive design
- ✅ Bottom navigation

## 🚀 Tech Stack

- **Framework:** Next.js 15.5.9 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Backend:** Supabase (Auth, Database, Realtime, Storage)
- **Real-time:** Socket.IO (for calls and presence)
- **WebRTC:** Native browser APIs with TURN servers

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Backend server running (Socket.IO)

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/mdazadas/masum-chat.git
cd masum-chat/frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3000
```

## 🗄️ Database Setup

### Supabase Tables

You need to create the following tables in your Supabase project:

#### 1. `profiles`
```sql
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  phone text,
  last_seen timestamp with time zone,
  created_at timestamp with time zone default now()
);
```

#### 2. `chats`
```sql
create table chats (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default now()
);
```

#### 3. `chat_participants`
```sql
create table chat_participants (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references chats(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  unique(chat_id, user_id)
);
```

#### 4. `messages`
```sql
create table messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references chats(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text,
  image_url text,
  status text default 'sent',
  created_at timestamp with time zone default now()
);
```

#### 5. `calls`
```sql
create table calls (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references chats(id) on delete cascade,
  caller_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  call_type text not null,
  status text default 'calling',
  connected_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone default now()
);
```

### Enable Row Level Security (RLS)

Make sure to enable RLS and create appropriate policies for each table.

### Enable Realtime

Enable Realtime for the following tables:
- `messages`
- `chat_participants`
- `profiles`

## 🔧 Backend Setup

This frontend requires a Socket.IO backend server for:
- Video/Audio call signaling
- Real-time presence
- Online/offline status

Backend repository: [masum-chat-backend](https://github.com/mdazadas/masum-chat/tree/main/backend)

## 📱 Mobile Access

For camera/microphone access on mobile devices, you need HTTPS:

### Option 1: Cloudflare Tunnel (Development)
```bash
npx -y cloudflared tunnel --url http://localhost:3000
```

### Option 2: Deploy to Vercel (Production)
```bash
npm run build
vercel deploy
```

## 🎨 Customization

### Colors
Edit `tailwind.config.ts` to change the color scheme:
```typescript
colors: {
  accent: '#10b981', // Change primary color
  // ...
}
```

### Features
Enable/disable features in `src/lib/settings.ts`

## 📚 Documentation

- [Complete Page Audit](../COMPLETE_PAGE_AUDIT.md)
- [Mobile Chrome Setup](../MOBILE_CHROME_COMPLETE_FIX.md)
- [Video Calling Guide](../VIDEO_CALLING_FIX_SUMMARY.md)
- [Call Receive Fix](../CALL_RECEIVE_FIX.md)
- [Code Analysis](../CODE_ANALYSIS_REPORT.md)

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy --prod
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

### Docker
```bash
docker build -t masum-chat-frontend .
docker run -p 3000:3000 masum-chat-frontend
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Md Azad**
- GitHub: [@mdazadas](https://github.com/mdazadas)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)

## 📞 Support

For support, email mdazad@example.com or open an issue on GitHub.

---

Made with ❤️ by Md Azad
