import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function createSampleUsers() {
  console.log('Creating sample users...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create sample time givers
  const giver1 = await db.user.create({
    data: {
      email: 'sarah@example.com',
      name: 'Sarah Chen',
      password: hashedPassword,
      role: 'TIME_GIVER',
      bio: 'Calm presence for those who need to think. I specialize in silent companionship.',
      emotionalTempo: 'slow',
      silenceComfort: 9,
      energyLevel: 'calm',
      voiceTonePreference: 'medium',
      isAvailable: true,
      presenceRating: 4.8,
      totalSessions: 42,
      walletBalance: 12567.80,
      totalEarnings: 15678.50,
      latitude: 19.0760,
      longitude: 72.8777,
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      timezone: 'Asia/Kolkata',
      maxDistance: 25,
      isLocationPublic: true
    }
  })

  const giver2 = await db.user.create({
    data: {
      email: 'michael@example.com',
      name: 'Michael Rodriguez',
      password: hashedPassword,
      role: 'TIME_GIVER',
      bio: 'Here to sit with you while you process your thoughts. No judgment, just presence.',
      emotionalTempo: 'slow',
      silenceComfort: 8,
      energyLevel: 'calm',
      voiceTonePreference: 'deep',
      isAvailable: true,
      presenceRating: 4.6,
      totalSessions: 28,
      walletBalance: 8234.20,
      totalEarnings: 9722.40,
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      timezone: 'Asia/Kolkata',
      maxDistance: 30,
      isLocationPublic: true
    }
  })

  const giver3 = await db.user.create({
    data: {
      email: 'priya@example.com',
      name: 'Priya Sharma',
      password: hashedPassword,
      role: 'TIME_GIVER',
      bio: 'Quiet companion for your thinking time. Sometimes we just need someone to be there.',
      emotionalTempo: 'slow',
      silenceComfort: 10,
      energyLevel: 'calm',
      voiceTonePreference: 'medium',
      isAvailable: true,
      presenceRating: 4.9,
      totalSessions: 15,
      walletBalance: 4485.00,
      totalEarnings: 4485.00,
      latitude: 12.9716,
      longitude: 77.5946,
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      timezone: 'Asia/Kolkata',
      maxDistance: 20,
      isLocationPublic: true
    }
  })

  // Create sample time seekers
  const seeker1 = await db.user.create({
    data: {
      email: 'alex@example.com',
      name: 'Alex Johnson',
      password: hashedPassword,
      role: 'TIME_SEEKER',
      bio: 'Founder looking for presence while making important decisions'
    }
  })

  const seeker2 = await db.user.create({
    data: {
      email: 'jordan@example.com',
      name: 'Jordan Lee',
      password: hashedPassword,
      role: 'TIME_SEEKER',
      bio: 'Sometimes I just need someone to sit with me while I think'
    }
  })

  console.log('Sample users created successfully!')
  console.log('\n📧 Sample Accounts:')
  console.log('\n🧘 Time Givers:')
  console.log('  sarah@example.com / password123 (4.8★, 42 sessions)')
  console.log('  michael@example.com / password123 (4.6★, 28 sessions)')
  console.log('  priya@example.com / password123 (4.9★, 15 sessions)')
  console.log('\n🧠 Time Seekers:')
  console.log('  alex@example.com / password123')
  console.log('  jordan@example.com / password123')
  console.log('\n✨ You can now test the application!')
}

createSampleUsers()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })