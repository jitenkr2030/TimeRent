import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function createSampleWallets() {
  console.log('Creating sample wallets...')

  // Get sample users
  const sarah = await db.user.findUnique({ where: { email: 'sarah@example.com' } })
  const michael = await db.user.findUnique({ where: { email: 'michael@example.com' } })
  const priya = await db.user.findUnique({ where: { email: 'priya@example.com' } })

  // Create wallets for time givers
  if (sarah) {
    await db.wallet.create({
      data: {
        userId: sarah.id,
        balance: 12567.80,
        totalEarned: 15678.50,
        totalWithdrawn: 3110.70
      }
    })
  }

  if (michael) {
    await db.wallet.create({
      data: {
        userId: michael.id,
        balance: 8234.20,
        totalEarned: 9722.40,
        totalWithdrawn: 1488.20
      }
    })
  }

  if (priya) {
    await db.wallet.create({
      data: {
        userId: priya.id,
        balance: 4485.00,
        totalEarned: 4485.00,
        totalWithdrawn: 0
      }
    })
  }

  console.log('Sample wallets created successfully!')
}

createSampleWallets()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })