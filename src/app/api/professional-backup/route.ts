import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      profession, 
      organization, 
      phone, 
      email, 
      specialization, 
      responseTime,
      timezone,
      priority 
    } = await request.json()

    // Validate required fields
    if (!name || !profession || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, profession, phone' },
        { status: 400 }
      )
    }

    // Create professional backup
    const professionalBackup = await db.professionalBackup.create({
      data: {
        name,
        profession,
        organization,
        phone,
        email,
        specialization,
        responseTime,
        timezone,
        priority: priority || 1
      }
    })

    return NextResponse.json({
      success: true,
      professionalBackup
    })

  } catch (error) {
    console.error('Create professional backup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const specialization = searchParams.get('specialization')
    const available = searchParams.get('available')
    const limit = parseInt(searchParams.get('limit') || '10')

    let whereClause: any = {
      isActive: true
    }

    if (specialization) {
      whereClause.specialization = {
        contains: specialization,
        mode: 'insensitive'
      }
    }

    if (available === 'true') {
      whereClause.isAvailable = true
    }

    const professionalBackups = await db.professionalBackup.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'asc' },
        { responseTime: 'asc' }
      ],
      take: limit
    })

    return NextResponse.json({
      professionalBackups
    })

  } catch (error) {
    console.error('Get professional backups error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { 
      id, 
      name, 
      profession, 
      organization, 
      phone, 
      email, 
      specialization, 
      isAvailable,
      responseTime,
      timezone,
      priority 
    } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Professional ID is required' },
        { status: 400 }
      )
    }

    // Update professional backup
    const updatedProfessional = await db.professionalBackup.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(profession && { profession }),
        ...(organization !== undefined && { organization }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(specialization !== undefined && { specialization }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(responseTime !== undefined && { responseTime }),
        ...(timezone !== undefined && { timezone }),
        ...(priority !== undefined && { priority })
      }
    })

    return NextResponse.json({
      success: true,
      professionalBackup: updatedProfessional
    })

  } catch (error) {
    console.error('Update professional backup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Professional ID is required' },
        { status: 400 }
      )
    }

    // Soft delete by setting isActive to false
    const deletedProfessional = await db.professionalBackup.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Professional backup removed successfully'
    })

  } catch (error) {
    console.error('Delete professional backup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}