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

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  )
  return R * c
}

// POST /api/discover/nearby - Find nearby time givers
export async function POST(request: NextRequest) {
  try {
    const tokenData = verifyToken(request)
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { latitude, longitude, maxDistance = 50, filters = {} } = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Location coordinates are required' },
        { status: 400 }
      )
    }

    // Find available time givers with location data
    const timeGivers = await db.user.findMany({
      where: {
        role: {
          in: ['TIME_GIVER', 'BOTH']
        },
        isAvailable: true,
        latitude: {
          not: null
        },
        longitude: {
          not: null
        },
        isLocationPublic: true,
        ...(filters.maxDistance && {
          maxDistance: {
            lte: filters.maxDistance
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
        voiceTonePreference: true,
        hourlyRate: true,
        latitude: true,
        longitude: true,
        city: true,
        state: true,
        country: true,
        maxDistance: true
      }
    })

    // Calculate distances and filter
    const giversWithDistance = timeGivers
      .map(giver => {
        const distance = calculateDistance(
          latitude,
          longitude,
          giver.latitude!,
          giver.longitude!
        )
        return { ...giver, distance }
      })
      .filter(giver => giver.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50) // Limit to 50 results

    return NextResponse.json({
      success: true,
      givers: giversWithDistance,
      center: { latitude, longitude },
      searchRadius: maxDistance,
      totalFound: giversWithDistance.length
    })
  } catch (error) {
    console.error('Find nearby givers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/discover/locations - Get popular cities/regions
export async function GET(request: NextRequest) {
  try {
    // Get unique cities from time givers
    const cities = await db.user.groupBy({
      by: ['city', 'state', 'country'],
      where: {
        role: {
          in: ['TIME_GIVER', 'BOTH']
        },
        isLocationPublic: true,
        city: {
          not: null
        }
      },
      _count: {
        city: true
      },
      orderBy: {
        _count: {
          city: 'desc'
        }
      },
      take: 20
    })

    const popularCities = cities.map(city => ({
      city: city.city,
      state: city.state,
      country: city.country,
      giverCount: city._count.city,
      latitude: city.latitude,
      longitude: city.longitude
    }))

    return NextResponse.json({
      success: true,
      cities: popularCities
    })
  } catch (error) {
    console.error('Get locations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/discover/search - Search time givers by location
export async function PUT(request: NextRequest) {
  try {
    const { query, location } = await request.json()

    let whereClause: any = {
      role: {
        in: ['TIME_GIVER', 'BOTH']
      },
      isAvailable: true,
      isLocationPublic: true
    }

    if (query) {
      whereClause.OR = [
        {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          bio: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          city: {
            contains: query,
            mode: 'insensitive'
          }
        }
      ]
    }

    if (location) {
      whereClause.AND = [
        {
          OR: [
            {
              city: {
                contains: location,
                mode: 'insensitive'
              }
            },
            {
              state: {
                contains: location,
                mode: 'insensitive'
              }
            },
            {
              country: {
                contains: location,
                mode: 'insensitive'
              }
            }
          ]
        }
      ]
    }

    const timeGivers = await db.user.findMany({
      where: whereClause,
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
        voiceTonePreference: true,
        hourlyRate: true,
        latitude: true,
        longitude: true,
        city: true,
        state: true,
        country: true
      },
      take: 20,
      orderBy: [
        { presenceRating: 'desc' },
        { totalSessions: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      givers: timeGivers,
      query,
      location
    })
  } catch (error) {
    console.error('Search givers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}