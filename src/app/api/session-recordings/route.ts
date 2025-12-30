import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { RecordingType, RecordingStatus, RecordingConsent, AccessLevel } from '@prisma/client'
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = process.env.RECORDING_ENCRYPTION_KEY || randomBytes(32).toString('hex')

// Helper function to generate encryption key
function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex')
}

// Helper function to encrypt data
function encryptData(data: Buffer, key: string): { encrypted: Buffer; iv: Buffer; tag: Buffer } {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(key, 'hex'), iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const tag = cipher.getAuthTag()
  return { encrypted, iv, tag }
}

// Helper function to decrypt data
function decryptData(encrypted: Buffer, key: string, iv: Buffer, tag: Buffer): Buffer {
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, Buffer.from(key, 'hex'), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, recordingType, consent, autoDelete, retentionDays } = await request.json()

    // Validate required fields
    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userId' },
        { status: 400 }
      )
    }

    // Check if session exists and user is participant
    const session = await db.session.findUnique({
      where: { id: sessionId },
      select: { seekerId: true, giverId: true }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.seekerId !== userId && session.giverId !== userId) {
      return NextResponse.json(
        { error: 'User is not a participant in this session' },
        { status: 403 }
      )
    }

    // Check if recording already exists for this session
    const existingRecording = await db.sessionRecording.findFirst({
      where: {
        sessionId,
        status: {
          in: [RecordingStatus.PENDING, RecordingStatus.RECORDING]
        }
      }
    })

    if (existingRecording) {
      return NextResponse.json(
        { error: 'Recording already exists or in progress for this session' },
        { status: 409 }
      )
    }

    // Generate encryption key for this recording
    const encryptionKey = generateEncryptionKey()

    // Calculate expiration date if auto-delete is enabled
    let expiresAt = null
    if (autoDelete) {
      const retentionPeriod = retentionDays || 30
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + retentionPeriod)
    }

    // Create session recording
    const sessionRecording = await db.sessionRecording.create({
      data: {
        sessionId,
        userId,
        recordingType: recordingType || RecordingType.AUDIO_VIDEO,
        consent: consent || RecordingConsent.BOTH_CONSENT,
        encryptionKey,
        status: RecordingStatus.PENDING,
        expiresAt,
        metadata: {
          autoDelete: autoDelete || true,
          retentionDays: retentionDays || 30,
          encryptionAlgorithm: ENCRYPTION_ALGORITHM
        },
        accessControl: {
          allowDownload: false,
          allowShare: false,
          requireAuth: true
        }
      }
    })

    // Grant access to both participants
    await db.recordingAccess.createMany({
      data: [
        {
          recordingId: sessionRecording.id,
          userId: session.seekerId,
          accessLevel: AccessLevel.VIEW,
          grantedBy: userId
        },
        {
          recordingId: sessionRecording.id,
          userId: session.giverId,
          accessLevel: AccessLevel.VIEW,
          grantedBy: userId
        }
      ]
    })

    return NextResponse.json({
      success: true,
      recording: {
        id: sessionRecording.id,
        sessionId: sessionRecording.sessionId,
        recordingType: sessionRecording.recordingType,
        status: sessionRecording.status,
        consent: sessionRecording.consent,
        encryptionEnabled: true,
        expiresAt: sessionRecording.expiresAt
      },
      message: 'Recording session initialized. Ready to start recording.'
    })

  } catch (error) {
    console.error('Create session recording error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      )
    }

    let whereClause: any = {
      isDeleted: false,
      OR: [
        { userId }, // User created the recording
        { 
          session: {
            OR: [
              { seekerId: userId },
              { giverId: userId }
            ]
          }
        }
      ]
    }

    if (sessionId) {
      whereClause.sessionId = sessionId
    }

    const recordings = await db.sessionRecording.findMany({
      where: whereClause,
      include: {
        session: {
          select: {
            id: true,
            sessionType: true,
            scheduledFor: true,
            seekerId: true,
            giverId: true
          }
        },
        recordingAccess: {
          where: {
            userId,
            isActive: true
          },
          select: {
            accessLevel: true,
            grantedAt: true,
            expiresAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter recordings based on access and consent
    const accessibleRecordings = recordings.filter(recording => {
      // Check if user has access
      const hasAccess = recording.recordingAccess.length > 0
      
      // Check consent requirements
      const isParticipant = recording.session.seekerId === userId || recording.session.giverId === userId
      const isCreator = recording.userId === userId
      
      if (recording.consent === RecordingConsent.BOTH_CONSENT && !isParticipant) {
        return false
      }
      
      if (recording.consent === RecordingConsent.SEEKER_ONLY && recording.session.seekerId !== userId) {
        return false
      }
      
      if (recording.consent === RecordingConsent.GIVER_ONLY && recording.session.giverId !== userId) {
        return false
      }
      
      return hasAccess || isCreator
    })

    return NextResponse.json({
      recordings: accessibleRecordings.map(recording => ({
        id: recording.id,
        sessionId: recording.sessionId,
        sessionType: recording.session.sessionType,
        recordingType: recording.recordingType,
        status: recording.status,
        consent: recording.consent,
        duration: recording.duration,
        fileSize: recording.fileSize,
        createdAt: recording.createdAt,
        expiresAt: recording.expiresAt,
        accessLevel: recording.recordingAccess[0]?.accessLevel,
        hasThumbnail: !!recording.thumbnailPath
      }))
    })

  } catch (error) {
    console.error('Get session recordings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { recordingId, userId, status, duration, fileSize, accessLevel } = await request.json()

    if (!recordingId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: recordingId, userId' },
        { status: 400 }
      )
    }

    // Verify user has access to this recording
    const recording = await db.sessionRecording.findFirst({
      where: {
        id: recordingId,
        isDeleted: false
      },
      include: {
        session: {
          select: { seekerId: true, giverId: true }
        },
        recordingAccess: {
          where: { userId, isActive: true }
        }
      }
    })

    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      )
    }

    const isParticipant = recording.session.seekerId === userId || recording.session.giverId === userId
    const hasAccess = recording.recordingAccess.length > 0

    if (!isParticipant && !hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this recording' },
        { status: 403 }
      )
    }

    // Update recording
    const updateData: any = {}
    
    if (status) updateData.status = status
    if (duration !== undefined) updateData.duration = duration
    if (fileSize !== undefined) updateData.fileSize = fileSize

    const updatedRecording = await db.sessionRecording.update({
      where: { id: recordingId },
      data: updateData
    })

    // Update access level if provided
    if (accessLevel) {
      await db.recordingAccess.updateMany({
        where: {
          recordingId,
          userId,
          isActive: true
        },
        data: { accessLevel }
      })
    }

    return NextResponse.json({
      success: true,
      recording: updatedRecording
    })

  } catch (error) {
    console.error('Update session recording error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recordingId = searchParams.get('recordingId')
    const userId = searchParams.get('userId')

    if (!recordingId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: recordingId, userId' },
        { status: 400 }
      )
    }

    // Verify user can delete this recording
    const recording = await db.sessionRecording.findUnique({
      where: { id: recordingId },
      select: { userId: true, isDeleted: true }
    })

    if (!recording || recording.isDeleted) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      )
    }

    // Only the creator can delete the recording
    if (recording.userId !== userId) {
      return NextResponse.json(
        { error: 'Only the recording creator can delete it' },
        { status: 403 }
      )
    }

    // Soft delete the recording
    await db.sessionRecording.update({
      where: { id: recordingId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: RecordingStatus.DELETED
      }
    })

    // Deactivate all access permissions
    await db.recordingAccess.updateMany({
      where: { recordingId },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Recording deleted successfully'
    })

  } catch (error) {
    console.error('Delete session recording error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}