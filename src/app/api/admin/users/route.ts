import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Helper function to verify admin token
async function verifyAdminToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId, role] = decoded.split(':')
    
    const admin = await db.user.findFirst({
      where: {
        id: userId,
        role: {
          in: ['ADMIN', 'MODERATOR']
        }
      }
    })

    return admin
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    }
    if (role) {
      where.role = role
    }
    if (status === 'active') {
      where.isAvailable = true
    } else if (status === 'inactive') {
      where.isAvailable = false
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          isAvailable: true,
          totalSessions: true,
          presenceRating: true,
          walletBalance: true,
          totalEarnings: true,
          createdAt: true,
          lastLogin: true
        }
      }),
      db.user.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req)
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { email, name, password, role, hourlyRate } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'TIME_SEEKER',
        hourlyRate: hourlyRate || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    // Log admin action
    await db.adminAction.create({
      data: {
        adminId: admin.id,
        actionType: 'USER_VERIFICATION',
        targetId: user.id,
        targetType: 'user',
        description: `Created user ${user.email} with role ${user.role}`,
        metadata: { createdBy: admin.email }
      }
    })

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req)
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { userId, action, data } = await req.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    let updateData: any = {}
    let actionType: any = 'USER_VERIFICATION'

    switch (action) {
      case 'ban':
        updateData = { isAvailable: false }
        actionType = 'USER_BAN'
        break
      case 'suspend':
        updateData = { isAvailable: false }
        actionType = 'USER_SUSPEND'
        break
      case 'verify':
        updateData = { isAvailable: true }
        actionType = 'USER_VERIFICATION'
        break
      case 'update':
        updateData = data
        actionType = 'USER_VERIFICATION'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isAvailable: true,
        updatedAt: true
      }
    })

    // Log admin action
    await db.adminAction.create({
      data: {
        adminId: admin.id,
        actionType,
        targetId: userId,
        targetType: 'user',
        description: `${action} user ${user.email}`,
        metadata: { action, data: updateData, performedBy: admin.email }
      }
    })

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}