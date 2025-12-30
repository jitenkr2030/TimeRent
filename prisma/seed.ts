import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.adminAction.deleteMany()
  await prisma.systemLog.deleteMany()
  await prisma.contentModeration.deleteMany()
  await prisma.systemSettings.deleteMany()
  await prisma.experienceComment.deleteMany()
  await prisma.experienceReaction.deleteMany()
  await prisma.sharedExperience.deleteMany()
  await prisma.groupSessionParticipant.deleteMany()
  await prisma.groupSession.deleteMany()
  await prisma.supportGroupMember.deleteMany()
  await prisma.supportGroup.deleteMany()
  await prisma.forumReply.deleteMany()
  await prisma.forumPost.deleteMany()
  await prisma.recordingAccess.deleteMany()
  await prisma.sessionRecording.deleteMany()
  await prisma.crisisReport.deleteMany()
  await prisma.professionalBackup.deleteMany()
  await prisma.crisisProtocol.deleteMany()
  await prisma.emergencyContact.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.paymentMethod.deleteMany()
  await prisma.presenceRating.deleteMany()
  await prisma.availability.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Database cleaned')

  // Create demo users
  console.log('👥 Creating demo users...')

  const adminPassword = await bcrypt.hash('admin123', 10)
  const moderatorPassword = await bcrypt.hash('mod123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@timerent.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN',
      isAvailable: true,
      walletBalance: 0,
      totalEarnings: 0,
      totalSessions: 0
    }
  })

  // Moderator user
  const moderator = await prisma.user.create({
    data: {
      email: 'mod@timerent.com',
      name: 'Content Moderator',
      password: moderatorPassword,
      role: 'MODERATOR',
      isAvailable: true,
      walletBalance: 0,
      totalEarnings: 0,
      totalSessions: 0
    }
  })

  // Time Givers (Listeners)
  const timeGivers = await Promise.all([
    {
      email: 'listener1@timerent.com',
      name: 'Sarah Johnson',
      role: 'TIME_GIVER' as const,
      hourlyRate: 500,
      bio: 'Experienced listener with background in psychology',
      presenceRating: 4.8,
      emotionalTempo: 'calm',
      silenceComfort: 8,
      energyLevel: 'calm',
      voiceTonePreference: 'medium',
      isAvailable: true,
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    {
      email: 'listener2@timerent.com',
      name: 'Raj Patel',
      role: 'TIME_GIVER' as const,
      hourlyRate: 600,
      bio: 'Compassionate listener, here to support you',
      presenceRating: 4.9,
      emotionalTempo: 'slow',
      silenceComfort: 9,
      energyLevel: 'calm',
      voiceTonePreference: 'deep',
      isAvailable: true,
      city: 'Delhi',
      state: 'Delhi',
      country: 'India'
    },
    {
      email: 'listener3@timerent.com',
      name: 'Priya Sharma',
      role: 'TIME_GIVER' as const,
      hourlyRate: 450,
      bio: 'Warm and empathetic listener',
      presenceRating: 4.7,
      emotionalTempo: 'medium',
      silenceComfort: 7,
      energyLevel: 'neutral',
      voiceTonePreference: 'high',
      isAvailable: false,
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    {
      email: 'listener4@timerent.com',
      name: 'Amit Kumar',
      role: 'TIME_GIVER' as const,
      hourlyRate: 550,
      bio: 'Patient understanding listener',
      presenceRating: 4.6,
      emotionalTempo: 'slow',
      silenceComfort: 8,
      energyLevel: 'calm',
      voiceTonePreference: 'medium',
      isAvailable: true,
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India'
    },
    {
      email: 'listener5@timerent.com',
      name: 'Neha Gupta',
      role: 'BOTH' as const,
      hourlyRate: 500,
      bio: 'Both listener and seeker, understand both perspectives',
      presenceRating: 4.8,
      emotionalTempo: 'medium',
      silenceComfort: 7,
      energyLevel: 'neutral',
      voiceTonePreference: 'medium',
      isAvailable: true,
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India'
    }
  ].map(async (giver) => {
    const hashedPassword = await bcrypt.hash('listener123', 10)
    return prisma.user.create({
      data: {
        ...giver,
        password: hashedPassword,
        walletBalance: Math.floor(Math.random() * 5000),
        totalEarnings: Math.floor(Math.random() * 10000),
        totalSessions: Math.floor(Math.random() * 50),
        latitude: 19.0760 + Math.random() * 10 - 5,
        longitude: 72.8777 + Math.random() * 10 - 5,
        timezone: 'Asia/Kolkata',
        maxDistance: 50
      }
    })
  }))

  // Time Seekers (Clients)
  const timeSeekers = await Promise.all([
    {
      email: 'seeker1@timerent.com',
      name: 'Alex Thompson',
      role: 'TIME_SEEKER' as const,
      bio: 'Looking for someone to talk to during difficult times',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    {
      email: 'seeker2@timerent.com',
      name: 'Maria Garcia',
      role: 'TIME_SEEKER' as const,
      bio: 'Need support and understanding',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India'
    },
    {
      email: 'seeker3@timerent.com',
      name: 'John Smith',
      role: 'TIME_SEEKER' as const,
      bio: 'Seeking companionship and conversation',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    {
      email: 'seeker4@timerent.com',
      name: 'Emma Wilson',
      role: 'BOTH' as const,
      bio: 'Sometimes need support, sometimes provide it',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India'
    },
    {
      email: 'seeker5@timerent.com',
      name: 'David Lee',
      role: 'TIME_SEEKER' as const,
      bio: 'Looking for meaningful connections',
      city: 'Kolkata',
      state: 'West Bengal',
      country: 'India'
    }
  ].map(async (seeker) => {
    const hashedPassword = await bcrypt.hash('seeker123', 10)
    return prisma.user.create({
      data: {
        ...seeker,
        password: hashedPassword,
        walletBalance: Math.floor(Math.random() * 2000),
        totalEarnings: 0,
        totalSessions: Math.floor(Math.random() * 20),
        latitude: 19.0760 + Math.random() * 10 - 5,
        longitude: 72.8777 + Math.random() * 10 - 5,
        timezone: 'Asia/Kolkata'
      }
    })
  }))

  const allUsers = [admin, moderator, ...timeGivers, ...timeSeekers]

  console.log(`✅ Created ${allUsers.length} users`)

  // Create availabilities for time givers
  console.log('📅 Creating availabilities...')
  for (const giver of timeGivers) {
    for (let day = 0; day < 7; day++) {
      if (Math.random() > 0.3) { // 70% chance of availability on each day
        await prisma.availability.create({
          data: {
            userId: (await giver).id,
            dayOfWeek: day,
            startTime: `${9 + Math.floor(Math.random() * 8)}:00`,
            endTime: `${18 + Math.floor(Math.random() * 4)}:00`,
            isActive: true
          }
        })
      }
    }
  }

  // Create sample sessions
  console.log('🤝 Creating sample sessions...')
  const sessionTypes = ['SILENT_PRESENCE', 'OPEN_TALK', 'MIRROR_MODE', 'THINKING_ROOM', 'FOCUS_COMPANION']
  const sessionStatuses = ['COMPLETED', 'SCHEDULED', 'IN_PROGRESS', 'CANCELLED']

  for (let i = 0; i < 20; i++) {
    const seeker = timeSeekers[Math.floor(Math.random() * timeSeekers.length)]
    const giver = timeGivers[Math.floor(Math.random() * timeGivers.length)]
    
    const session = await prisma.session.create({
      data: {
        seekerId: (await seeker).id,
        giverId: (await giver).id,
        sessionType: sessionTypes[Math.floor(Math.random() * sessionTypes.length)] as any,
        duration: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
        status: sessionStatuses[Math.floor(Math.random() * sessionStatuses.length)] as any,
        scheduledFor: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        startedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : null,
        endedAt: Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : null,
        paymentStatus: 'PAID',
        amount: [250, 375, 500, 750][Math.floor(Math.random() * 4)],
        platformFee: 50,
        giverEarnings: [200, 325, 450, 700][Math.floor(Math.random() * 4)],
        meetingLink: `https://meet.timerent.com/session/${Math.random().toString(36).substr(2, 9)}`
      }
    })

    // Create ratings for completed sessions
    if (session.status === 'COMPLETED') {
      await prisma.presenceRating.create({
        data: {
          sessionId: session.id,
          userId: (await seeker).id,
          rating: 3.5 + Math.random() * 1.5,
          feltLessAlone: Math.random() > 0.3,
          timeFeltHeavy: Math.random() > 0.5,
          wouldSitAgain: Math.random() > 0.2,
          feedback: 'Great session, very supportive and understanding.'
        }
      })
    }
  }

  // Create forum posts
  console.log('💬 Creating forum posts...')
  const categories = ['GENERAL', 'ANXIETY', 'DEPRESSION', 'RELATIONSHIPS', 'TRAUMA', 'RECOVERY', 'SELF_CARE']
  
  for (let i = 0; i < 15; i++) {
    const author = allUsers[Math.floor(Math.random() * allUsers.length)]
    const post = await prisma.forumPost.create({
      data: {
        title: `Sample Forum Post ${i + 1}`,
        content: `This is a sample forum post for testing purposes. It discusses various topics related to mental health and well-being. Post number ${i + 1}.`,
        category: categories[Math.floor(Math.random() * categories.length)] as any,
        isAnonymous: Math.random() > 0.5,
        authorId: (await author).id,
        isPinned: Math.random() > 0.9,
        replyCount: Math.floor(Math.random() * 10),
        viewCount: Math.floor(Math.random() * 100),
        likeCount: Math.floor(Math.random() * 20)
      }
    })

    // Create replies for some posts
    if (Math.random() > 0.5) {
      for (let j = 0; j < Math.floor(Math.random() * 3); j++) {
        const replyAuthor = allUsers[Math.floor(Math.random() * allUsers.length)]
        await prisma.forumReply.create({
          data: {
            postId: post.id,
            authorId: (await replyAuthor).id,
            content: `This is a reply to post ${i + 1}.`,
            isAnonymous: Math.random() > 0.5,
            likeCount: Math.floor(Math.random() * 5)
          }
        })
      }
    }
  }

  // Create system settings
  console.log('⚙️ Creating system settings...')
  const defaultSettings = [
    { key: 'platform_fee_percentage', value: 10, description: 'Platform fee percentage', category: 'payments' },
    { key: 'min_session_duration', value: 30, description: 'Minimum session duration in minutes', category: 'sessions' },
    { key: 'max_session_duration', value: 180, description: 'Maximum session duration in minutes', category: 'sessions' },
    { key: 'auto_moderation_enabled', value: true, description: 'Enable automatic content moderation', category: 'safety' },
    { key: 'crisis_hotline_number', value: '9152987821', description: '24/7 crisis support hotline', category: 'safety' },
    { key: 'welcome_message', value: 'Welcome to TimeRent - Rent Attention. Not Output.', description: 'Platform welcome message', category: 'platform' },
    { key: 'maintenance_mode', value: false, description: 'Enable maintenance mode', category: 'platform' },
    { key: 'max_daily_sessions', value: 10, description: 'Maximum sessions per user per day', category: 'sessions' }
  ]

  for (const setting of defaultSettings) {
    await prisma.systemSettings.create({
      data: {
        ...setting,
        updatedBy: admin.id
      }
    })
  }

  // Create professional backup network
  console.log('🏥 Creating professional backup network...')
  const professionals = [
    {
      name: 'Dr. Ananya Sharma',
      profession: 'Clinical Psychologist',
      organization: 'Mental Health Center',
      phone: '+919876543210',
      email: 'ananya@mentalhealth.com',
      specialization: 'Crisis Intervention',
      responseTime: 15,
      priority: 1
    },
    {
      name: 'Dr. Rajiv Kumar',
      profession: 'Psychiatrist',
      organization: 'City Hospital',
      phone: '+919876543211',
      email: 'rajiv@cityhospital.com',
      specialization: 'Mental Health',
      responseTime: 20,
      priority: 2
    },
    {
      name: 'Dr. Priya Nair',
      profession: 'Counselor',
      organization: 'Wellness Clinic',
      phone: '+919876543212',
      email: 'priya@wellness.com',
      specialization: 'Substance Abuse',
      responseTime: 25,
      priority: 3
    }
  ]

  for (const professional of professionals) {
    await prisma.professionalBackup.create({
      data: professional
    })
  }

  // Create crisis protocols
  console.log('🚨 Creating crisis protocols...')
  const protocols = [
    {
      title: 'Suicidal Ideation Protocol',
      description: 'Immediate response protocol for suicidal ideation',
      severity: 'CRITICAL' as const,
      steps: [
        'Stay calm and listen without judgment',
        'Ask direct questions about suicide plans',
        'Do not leave the person alone',
        'Remove any means of self-harm',
        'Contact emergency services immediately',
        'Provide crisis hotline numbers'
      ],
      resources: {
        hotlines: ['9152987821', '1800-599-0019'],
        websites: ['https://www.suicidepreventionlifeline.org'],
        emergencyServices: ['911', '108']
      }
    },
    {
      title: 'Panic Attack Protocol',
      description: 'Response protocol for panic attacks',
      severity: 'HIGH' as const,
      steps: [
        'Guide person through breathing exercises',
        'Encourage focus on the present moment',
        'Use grounding techniques (5-4-3-2-1 method)',
        'Reassure that panic attacks are temporary',
        'Offer water and comfortable space',
        'Monitor for 15-30 minutes'
      ]
    }
  ]

  for (const protocol of protocols) {
    await prisma.crisisProtocol.create({
      data: protocol
    })
  }

  // Create some system logs
  console.log('📝 Creating system logs...')
  const logEvents = [
    { event: 'user_signup', message: 'New user registered', level: 'INFO' as const },
    { event: 'session_created', message: 'New session scheduled', level: 'INFO' as const },
    { event: 'payment_completed', message: 'Payment processed successfully', level: 'INFO' as const },
    { event: 'content_flagged', message: 'Content flagged for review', level: 'WARN' as const },
    { event: 'admin_login', message: 'Admin user logged in', level: 'INFO' as const },
    { event: 'system_error', message: 'Database connection timeout', level: 'ERROR' as const }
  ]

  for (let i = 0; i < 20; i++) {
    const logEvent = logEvents[Math.floor(Math.random() * logEvents.length)]
    const user = allUsers[Math.floor(Math.random() * allUsers.length)]
    
    await prisma.systemLog.create({
      data: {
        ...logEvent,
        userId: (await user).id,
        metadata: {
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          source: 'system'
        }
      }
    })
  }

  console.log('✅ Database seeding completed!')
  console.log('\n🎯 Demo Accounts Created:')
  console.log('📧 Admin: admin@timerent.com / admin123')
  console.log('📧 Moderator: mod@timerent.com / mod123')
  console.log('📧 Listeners: listener1-5@timerent.com / listener123')
  console.log('📧 Seekers: seeker1-5@timerent.com / seeker123')
  console.log('\n🌐 Admin Portal: http://localhost:3000/admin/login')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })