import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function updateSampleUsersWithLocation() {
  console.log('Updating sample users with location data...')

  // Update existing users with location data
  const updatedSarah = await db.user.update({
    where: { email: 'sarah@example.com' },
    data: {
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

  const updatedMichael = await db.user.update({
    where: { email: 'michael@example.com' },
    data: {
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

  const updatedPriya = await db.user.update({
    where: { email: 'priya@example.com' },
    data: {
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

  console.log('Sample users updated with location data!')
  console.log('\n📍 Updated Locations:')
  console.log('  Sarah Chen: Mumbai, Maharashtra (19.0760, 72.8777)')
  console.log('  Michael Rodriguez: Delhi, Delhi (28.6139, 77.2090)')
  console.log('  Priya Sharma: Bangalore, Karnataka (12.9716, 77.5946)')
}

updateSampleUsersWithLocation()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })