import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find admin user
    const admin = await db.user.findFirst({
      where: {
        email,
        role: {
          in: ['ADMIN', 'MODERATOR']
        }
      }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session token (simplified for demo)
    const token = Buffer.from(`${admin.id}:${admin.role}:${Date.now()}`).toString('base64')

    // Log admin login
    await db.systemLog.create({
      data: {
        event: 'admin_login',
        message: `Admin ${admin.email} logged in`,
        userId: admin.id,
        metadata: {
          role: admin.role,
          userAgent: req.headers.get('user-agent'),
          ipAddress: req.ip || 'unknown'
        }
      }
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      token
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}