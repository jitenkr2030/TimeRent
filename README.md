# 🕰️ TimeRent - Rent Attention. Not Output.

A marketplace where people rent human presence—without advice, performance, or obligation.

## 🌟 Core Philosophy

Today's platforms monetize content, services, advice, and performance. TimeRent monetizes none of these. Instead, it monetizes **presence without obligation**.

## 🎯 What Exactly Is Being Rented?

### ❌ Not This:
- Skills
- Advice  
- Results
- Therapy

### ✅ Only This:
- Human attention, for a fixed amount of time
- "Sit with me while I think"
- "Be present while I calm down"
- "We can stay silent"

## 👥 User Roles

### 🧠 Time Seeker (Renter)
People who:
- Are lonely but don't want social drama
- Are founders with decision fatigue
- Are overwhelmed and don't want advice
- Need accountability without pressure

### 🧘 Time Giver (Lender)
People who:
- Are emotionally grounded
- Good listeners
- Retired professionals
- Therapists off the clock
- Calm humans

## 🎭 Session Formats

1. **Silent Presence** - No talking required. Camera optional. Just "being there".
2. **Open Talk** - Renter talks, Giver listens only.
3. **Mirror Mode** - Giver reflects feelings, not advice.
4. **Thinking Room** - Both stay mostly quiet. Occasional "I'm here".
5. **Focus Companion** - Work silently together.

## 🛡️ Safety Rules

### Hard Platform Rules:
- ❌ No advice unless asked explicitly
- ❌ No therapy language
- ❌ No problem-solving pressure
- ❌ No saving sessions (privacy)

### Soft Rules:
- 💙 "Presence over performance"
- 💙 "Silence is valid"
- 💙 "You owe nothing after time ends"

## 💰 Pricing Model (India-Specific)

- **10 minutes → ₹99** (Quick presence check)
- **30 minutes → ₹249** (Standard session)
- **60 minutes → ₹399** (Deep thinking time)

## 🚀 Features

### ✅ Implemented:
- ✅ User authentication (Time Seekers & Time Givers)
- ✅ Session booking system
- ✅ Smart matching algorithm based on:
  - Emotional tempo (fast/slow)
  - Silence comfort level
  - Energy level (calm/neutral)
  - Voice tone preference
- ✅ Video session interface with WebRTC
- ✅ Presence rating system (not traditional reviews)
- ✅ Mobile-responsive design
- ✅ Progressive Web App (PWA) support
- ✅ Real-time session management
- ✅ Privacy-focused (no session recordings)

### 🔄 In Progress:
- 🔄 Payment integration (Razorpay/Stripe)
- 🔄 Availability scheduling
- 🔄 Push notifications
- 🔄 Advanced matching algorithms

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (for development)
- **Authentication**: JWT with bcryptjs
- **Video**: WebRTC integration
- **Deployment**: Ready for Vercel/Netlify

## 📱 Mobile App

The application includes a mobile-optimized interface that works as a Progressive Web App (PWA):

- Native-like experience on mobile devices
- Bottom navigation for easy thumb access
- Optimized for presence sessions on-the-go
- Installable on iOS/Android devices

## 🛠️ Installation & Setup

### Prerequisites:
- Node.js 18+ 
- Bun (recommended) or npm/yarn

### Setup:

1. **Clone the repository**
```bash
git clone <repository-url>
cd timerent
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**
```bash
bun run db:push
bun run db:generate
```

5. **Create sample users (for testing)**
```bash
bun run create-samples.ts
```

6. **Start the development server**
```bash
bun run dev
```

7. **Open your browser**
Navigate to `http://localhost:3000`

## 🧪 Sample Accounts

The application comes with pre-configured test accounts:

### 🧘 Time Givers:
- **sarah@example.com** / password123 (4.8★, 42 sessions)
- **michael@example.com** / password123 (4.6★, 28 sessions)  
- **priya@example.com** / password123 (4.9★, 15 sessions)

### 🧠 Time Seekers:
- **alex@example.com** / password123
- **jordan@example.com** / password123

## 📱 How to Use

### For Time Seekers:
1. Sign up as a Time Seeker
2. Browse available Time Givers
3. Choose a session type (Silent Presence, Open Talk, etc.)
4. Book a session (30/60 minutes)
5. Join the video session at scheduled time
6. Rate the presence experience

### For Time Givers:
1. Sign up as a Time Giver
2. Complete your profile with presence preferences
3. Set your availability
4. Receive session requests
5. Provide presence during sessions
6. Build your presence rating

## 🎯 Key Differentiators

1. **No Advice Economy**: First platform to monetize pure presence
2. **Psychological Safety**: Hard rules against advice-giving
3. **Presence Ratings**: Unique rating system focused on feeling less alone
4. **Founder-Focused**: Specifically designed for decision fatigue
5. **India-Ready**: Culturally adapted for Indian market

## 🔮 Future Extensions

- AI Silence Coach (teaches humans to listen better)
- Grief Rooms
- Decision Fatigue Rooms  
- Founder Quiet Hours
- Elder Companionship Mode

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

Built with the philosophy that sometimes, the most valuable thing we can offer each other is simply our quiet, non-judgmental presence.

---

**TimeRent** - "Baat karni hai, ilaaj nahi." (Just want to talk, not treatment)

🕰️ Rent Attention. Not Output.