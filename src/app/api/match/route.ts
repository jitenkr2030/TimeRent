import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Helper function to verify JWT token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string }
  } catch {
    return null
  }
}

// POST /api/match - Find matching time givers
export async function POST(request: NextRequest) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionType, emotionalTempo, silenceComfort, energyLevel } = await request.json()

    // Find available time givers based on matching criteria
    const givers = await db.user.findMany({
      where: {
        role: {
          in: ['TIME_GIVER', 'BOTH']
        },
        isAvailable: true,
        // Optional matching criteria
        ...(emotionalTempo && { emotionalTempo }),
        ...(energyLevel && { energyLevel }),
        ...(silenceComfort && {
          silenceComfort: {
            gte: Math.max(1, silenceComfort - 2),
            lte: Math.min(10, silenceComfort + 2)
          }
        })
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        presenceRating: true,
        totalSessions: true,
        emotionalTempo: true,
        silenceComfort: true,
        energyLevel: true,
        voiceTonePreference: true
      },
      orderBy: [
        { presenceRating: 'desc' },
        { totalSessions: 'desc' }
      ],
      take: 10 // Limit to top 10 matches
    })

    // Calculate match score for each giver
    const giversWithScore = givers.map(giver => {
      let score = 0
      
      // Base score from rating and experience
      score += (giver.presenceRating || 0) * 20
      score += Math.min(giver.totalSessions * 2, 30)
      
      // Compatibility scoring
      if (emotionalTempo && giver.emotionalTempo === emotionalTempo) {
        score += 15
      }
      if (energyLevel && giver.energyLevel === energyLevel) {
        score += 15
      }
      if (silenceComfort && giver.silenceComfort) {
        const comfortDiff = Math.abs(silenceComfort - giver.silenceComfort)
        score += Math.max(0, 20 - comfortDiff * 5)
      }
      
      return {
        ...giver,
        matchScore: Math.min(100, score)
      }
    })

    // Sort by match score
    const sortedGivers = giversWithScore.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json({
      givers: sortedGivers,
      total: sortedGivers.length
    })
  } catch (error) {
    console.error('Match error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}