import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create sample time givers
  const hashedPassword = await bcrypt.hash('password123', 10)

  const timeGivers = await Promise.all([
    db.user.create({
      data: {
        email: 'giver1@example.com',
        name: 'Sarah Chen',
        password: hashedPassword,
        role: 'TIME_GIVER',
        bio: 'Calm presence for those who need to think',
        emotionalTempo: 'slow',
        silenceComfort: 9,
        energyLevel: 'calm',
        voiceTonePreference: 'medium',
        isAvailable: true,
        hourlyRate: 399,
        presenceRating: 4.8,
        totalSessions: 42
      }
    }),
    db.user.create({
      data: {
        email: 'giver2@example.com',
        name: 'Michael Rodriguez',
        password: hashedPassword,
        role: 'TIME_GIVER',
        bio: 'Here to sit with you while you process',
        emotionalTempo: 'slow',
        silenceComfort: 8,
        energyLevel: 'calm',
        voiceTonePreference: 'deep',
        isAvailable: true,
        hourlyRate: 349,
        presenceRating: 4.6,
        totalSessions: 28
      }
    }),
    db.user.create({
      data: {
        email: 'giver3@example.com',
        name: 'Priya Sharma',
        password: hashedPassword,
        role: 'TIME_GIVER',
        bio: 'Quiet companion for your thinking time',
        emotionalTempo: 'slow',
        silenceComfort: 10,
        energyLevel: 'calm',
        voiceTonePreference: 'medium',
        isAvailable: true,
        hourlyRate: 299,
        presenceRating: 4.9,
        totalSessions: 15
      }
    })
  ])

  // Create sample time seekers
  const timeSeekers = await Promise.all([
    db.user.create({
      data: {
        email: 'seeker1@example.com',
        name: 'Alex Johnson',
        password: hashedPassword,
        role: 'TIME_SEEKER',
        bio: 'Looking for presence while I work through decisions'
      }
    }),
    db.user.create({
      data: {
        email: 'seeker2@example.com',
        name: 'Jordan Lee',
        password: hashedPassword,
        role: 'TIME_SEEKER',
        bio: 'Need someone to sit with me while I think'
      }
    })
  ])

  // Create sample sessions
  await Promise.all([
    db.session.create({
      data: {
        seekerId: timeSeekers[0].id,
        giverId: timeGivers[0].id,
        sessionType: 'SILENT_PRESENCE',
        duration: 30,
        status: 'COMPLETED',
        scheduledFor: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        meetingLink: 'https://meet.jit.si/TimeRent-123456'
      }
    }),
    db.session.create({
      data: {
        seekerId: timeSeekers[1].id,
        giverId: timeGivers[1].id,
        sessionType: 'THINKING_ROOM',
        duration: 60,
        status: 'SCHEDULED',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        meetingLink: 'https://meet.jit.si/TimeRent-789012'
      }
    })
  ])

  // Create sample ratings
  await Promise.all([
    db.presenceRating.create({
      data: {
        sessionId: 'session-id-placeholder', // This would be the actual session ID
        userId: timeSeekers[0].id,
        rating: 5,
        feltLessAlone: true,
        timeFeltHeavy: false,
        wouldSitAgain: true,
        feedback: 'Exactly what I needed - quiet presence'
      }
    })
  ])

  console.log('Database seeded successfully!')
  console.log('\nSample Accounts:')
  console.log('Time Givers:')
  console.log('  giver1@example.com / password123')
  console.log('  giver2@example.com / password123')
  console.log('  giver3@example.com / password123')
  console.log('\nTime Seekers:')
  console.log('  seeker1@example.com / password123')
  console.log('  seeker2@example.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })