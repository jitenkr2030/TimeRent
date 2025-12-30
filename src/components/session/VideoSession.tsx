'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Video, VideoOff, Mic, MicOff, Phone, Clock, Users } from 'lucide-react'

interface VideoSessionProps {
  sessionId: string
  sessionType: string
  duration: number
  meetingLink: string
  seeker: { name: string; avatar?: string }
  giver: { name: string; avatar?: string }
  onEndSession: () => void
}

export default function VideoSession({ 
  sessionId, 
  sessionType, 
  duration, 
  meetingLink, 
  seeker, 
  giver,
  onEndSession 
}: VideoSessionProps) {
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [sessionTime, setSessionTime] = useState(0)
  const [sessionStatus, setSessionStatus] = useState<'waiting' | 'active' | 'ended'>('waiting')
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    // Initialize video stream
    const initVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        })
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error('Error accessing media devices:', error)
      }
    }

    initVideo()

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (sessionStatus === 'active') {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [sessionStatus])

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !isVideoOn
      })
      setIsVideoOn(!isVideoOn)
    }
  }

  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !isMicOn
      })
      setIsMicOn(!isMicOn)
    }
  }

  const startSession = () => {
    setSessionStatus('active')
    // Here you would typically establish WebRTC connection
    // For now, we'll simulate the session
  }

  const endSession = async () => {
    setSessionStatus('ended')
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    
    // Update session status in database
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          endedAt: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Error ending session:', error)
    }
    
    onEndSession()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionTypeDisplay = (type: string) => {
    const types: { [key: string]: string } = {
      'SILENT_PRESENCE': 'Silent Presence',
      'OPEN_TALK': 'Open Talk',
      'MIRROR_MODE': 'Mirror Mode',
      'THINKING_ROOM': 'Thinking Room',
      'FOCUS_COMPANION': 'Focus Companion'
    }
    return types[type] || type
  }

  const getSessionRules = (type: string) => {
    const rules: { [key: string]: string[] } = {
      'SILENT_PRESENCE': [
        'No talking required',
        'Camera optional',
        'Just "being there"'
      ],
      'OPEN_TALK': [
        'Seeker talks freely',
        'Giver listens only',
        'No advice or feedback'
      ],
      'MIRROR_MODE': [
        'Giver reflects feelings only',
        'No advice or solutions',
        'Focus on emotional validation'
      ],
      'THINKING_ROOM': [
        'Mostly quiet time',
        'Occasional "I\'m here"',
        'No pressure to talk'
      ],
      'FOCUS_COMPANION': [
        'Work silently together',
        'Shared focus time',
        'Minimal interaction'
      ]
    }
    return rules[type] || []
  }

  if (sessionStatus === 'ended') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Session Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Thank you for your time together. Your presence matters.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Session duration: {formatTime(sessionTime)}</p>
              <p>Session type: {getSessionTypeDisplay(sessionType)}</p>
            </div>
            <Button onClick={onEndSession} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{getSessionTypeDisplay(sessionType)}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatTime(sessionTime)} / {formatTime(duration * 60)}
            </div>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={endSession}
            disabled={sessionStatus === 'waiting'}
          >
            <Phone className="h-4 w-4 mr-2" />
            End Session
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Main Video Area */}
        <div className="flex-1 relative bg-black">
          {/* Remote Video (Other Person) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {sessionStatus === 'waiting' ? (
              <div className="text-white text-center">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Waiting for other person to join...</p>
                <Button onClick={startSession} className="bg-blue-600 hover:bg-blue-700">
                  Start Session
                </Button>
              </div>
            ) : (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                // In a real implementation, this would show the remote stream
                style={{ display: 'none' }}
              />
            )}
            
            {/* Placeholder for remote video */}
            {sessionStatus === 'active' && (
              <div className="text-white text-center">
                <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {giver.name[0]}
                  </span>
                </div>
                <p className="text-lg">{giver.name}</p>
              </div>
            )}
          </div>

          {/* Local Video (Self) */}
          <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
            {isVideoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <VideoOff className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Session Rules Overlay */}
          {sessionStatus === 'waiting' && (
            <div className="absolute top-4 left-4 bg-black/50 text-white p-3 rounded-lg max-w-xs">
              <h4 className="font-semibold mb-2">Session Rules:</h4>
              <ul className="text-sm space-y-1">
                {getSessionRules(sessionType).map((rule, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-white border-l p-4">
          <div className="space-y-4">
            {/* Session Info */}
            <div>
              <h3 className="font-semibold mb-2">Session Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{getSessionTypeDisplay(sessionType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time elapsed:</span>
                  <span>{formatTime(sessionTime)}</span>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div>
              <h3 className="font-semibold mb-2">Participants</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">{seeker.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{seeker.name}</p>
                    <p className="text-xs text-muted-foreground">Time Seeker</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">{giver.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{giver.name}</p>
                    <p className="text-xs text-muted-foreground">Time Giver</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-2">
              <h3 className="font-semibold">Controls</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={isVideoOn ? "default" : "destructive"}
                  size="sm"
                  onClick={toggleVideo}
                  className="flex items-center gap-2"
                >
                  {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  Camera
                </Button>
                <Button
                  variant={isMicOn ? "default" : "destructive"}
                  size="sm"
                  onClick={toggleMic}
                  className="flex items-center gap-2"
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  Microphone
                </Button>
              </div>
            </div>

            {/* Reminder */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-800 mb-1">Remember</h4>
              <p className="text-xs text-blue-700">
                This is a presence-only session. No advice, no solutions, no pressure. 
                Just being together is enough.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}