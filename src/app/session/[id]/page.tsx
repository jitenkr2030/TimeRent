'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import VideoSession from '@/components/session/VideoSession'

interface Session {
  id: string
  sessionType: string
  duration: number
  status: string
  scheduledFor: string
  meetingLink?: string
  seeker: { name: string; avatar?: string }
  giver: { name: string; avatar?: string }
}

export default function SessionPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/auth')
          return
        }

        const response = await fetch(`/api/sessions/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setSession(data.session)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to load session')
        }
      } catch (error) {
        console.error('Error fetching session:', error)
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [params.id, router])

  const handleEndSession = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Session Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <VideoSession
      sessionId={session.id}
      sessionType={session.sessionType}
      duration={session.duration}
      meetingLink={session.meetingLink || ''}
      seeker={session.seeker}
      giver={session.giver}
      onEndSession={handleEndSession}
    />
  )
}