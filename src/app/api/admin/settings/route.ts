import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
    const category = searchParams.get('category') || ''

    const where = category ? { category } : {}

    const settings = await db.systemSettings.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    })

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      success: true,
      data: {
        settings: groupedSettings,
        flat: settings
      }
    })

  } catch (error) {
    console.error('Settings API error:', error)
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

    const { key, value, description, category, isPublic } = await req.json()

    if (!key || value === undefined || !category) {
      return NextResponse.json(
        { error: 'Key, value, and category are required' },
        { status: 400 }
      )
    }

    const setting = await db.systemSettings.create({
      data: {
        key,
        value,
        description,
        category,
        isPublic: isPublic || false,
        updatedBy: admin.id
      }
    })

    // Log admin action
    await db.adminAction.create({
      data: {
        adminId: admin.id,
        actionType: 'SYSTEM_SETTING_UPDATE',
        targetId: setting.id,
        targetType: 'setting',
        description: `Created setting ${key}`,
        metadata: { 
          key, 
          value, 
          category, 
          performedBy: admin.email 
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: setting
    })

  } catch (error) {
    console.error('Create setting error:', error)
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

    const { id, value, description, isPublic } = await req.json()

    if (!id || value === undefined) {
      return NextResponse.json(
        { error: 'Setting ID and value are required' },
        { status: 400 }
      )
    }

    const setting = await db.systemSettings.update({
      where: { id },
      data: {
        value,
        description,
        isPublic,
        updatedBy: admin.id,
        updatedAt: new Date()
      }
    })

    // Log admin action
    await db.adminAction.create({
      data: {
        adminId: admin.id,
        actionType: 'SYSTEM_SETTING_UPDATE',
        targetId: id,
        targetType: 'setting',
        description: `Updated setting ${setting.key}`,
        metadata: { 
          key: setting.key, 
          value, 
          performedBy: admin.email 
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: setting
    })

  } catch (error) {
    console.error('Update setting error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}