'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Download, 
  Share, 
  Shield, 
  Clock,
  FileVideo,
  Lock,
  Unlock,
  Trash2,
  Play,
  Pause,
  Square,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface SessionRecording {
  id: string
  sessionId: string
  sessionType: string
  recordingType: string
  status: string
  consent: string
  duration?: number
  fileSize?: number
  createdAt: string
  expiresAt?: string
  accessLevel: string
  hasThumbnail: boolean
}

interface SessionRecordingProps {
  sessionId: string
  userId: string
  isSessionActive: boolean
}

const RECORDING_TYPES = [
  { value: 'AUDIO_ONLY', label: 'Audio Only', icon: Mic },
  { value: 'VIDEO_ONLY', label: 'Video Only', icon: Video },
  { value: 'AUDIO_VIDEO', label: 'Audio + Video', icon: Video },
  { value: 'SCREEN_SHARE', label: 'Screen Share', icon: FileVideo },
  { value: 'TRANSCRIPT_ONLY', label: 'Transcript Only', icon: FileVideo }
]

const CONSENT_TYPES = [
  { value: 'SEEKER_ONLY', label: 'Seeker Consent Only' },
  { value: 'GIVER_ONLY', label: 'Giver Consent Only' },
  { value: 'BOTH_CONSENT', label: 'Both Must Consent' },
  { value: 'AUTO_CONSENT', label: 'Auto-Consent' }
]

export default function SessionRecording({ sessionId, userId, isSessionActive }: SessionRecordingProps) {
  const [recordings, setRecordings] = useState<SessionRecording[]>([])
  const [loading, setLoading] = useState(false)
  const [showStartDialog, setShowStartDialog] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingSettings, setRecordingSettings] = useState({
    recordingType: 'AUDIO_VIDEO',
    consent: 'BOTH_CONSENT',
    autoDelete: true,
    retentionDays: 30
  })

  useEffect(() => {
    fetchRecordings()
  }, [sessionId, userId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const fetchRecordings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/session-recordings?userId=${userId}&sessionId=${sessionId}`)
      const data = await response.json()
      
      if (data.recordings) {
        setRecordings(data.recordings)
      }
    } catch (error) {
      console.error('Error fetching recordings:', error)
      toast.error('Failed to load session recordings')
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const response = await fetch('/api/session-recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId,
          ...recordingSettings
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsRecording(true)
        setRecordingTime(0)
        setShowStartDialog(false)
        toast.success('Recording started successfully')
        fetchRecordings()
      } else {
        toast.error(data.error || 'Failed to start recording')
      }
    } catch (error) {
      console.error('Start recording error:', error)
      toast.error('Failed to start recording')
    }
  }

  const stopRecording = async () => {
    try {
      // Find the active recording
      const activeRecording = recordings.find(r => r.status === 'RECORDING')
      if (!activeRecording) {
        toast.error('No active recording found')
        return
      }

      const response = await fetch('/api/session-recordings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordingId: activeRecording.id,
          userId,
          status: 'PROCESSING',
          duration: recordingTime
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsRecording(false)
        setRecordingTime(0)
        toast.success('Recording stopped and is being processed')
        fetchRecordings()
      } else {
        toast.error(data.error || 'Failed to stop recording')
      }
    } catch (error) {
      console.error('Stop recording error:', error)
      toast.error('Failed to stop recording')
    }
  }

  const deleteRecording = async (recordingId: string) => {
    if (!confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/session-recordings?recordingId=${recordingId}&userId=${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Recording deleted successfully')
        fetchRecordings()
      } else {
        toast.error(data.error || 'Failed to delete recording')
      }
    } catch (error) {
      console.error('Delete recording error:', error)
      toast.error('Failed to delete recording')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'RECORDING': return 'bg-red-100 text-red-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecordingTypeIcon = (type: string) => {
    const config = RECORDING_TYPES.find(t => t.value === type)
    return config ? config.icon : Video
  }

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      {isSessionActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Session Recording
            </CardTitle>
            <CardDescription>
              Record your session for personal review. All recordings are encrypted and private.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isRecording ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Recording</span>
                    <span className="text-sm text-muted-foreground">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No active recording
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <Button onClick={stopRecording} variant="destructive">
                    <Square className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                ) : (
                  <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Video className="mr-2 h-4 w-4" />
                        Start Recording
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Start Session Recording</DialogTitle>
                        <DialogDescription>
                          Configure your recording settings before starting.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="recordingType">Recording Type</Label>
                          <Select
                            value={recordingSettings.recordingType}
                            onValueChange={(value) => setRecordingSettings(prev => ({ ...prev, recordingType: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RECORDING_TYPES.map((type) => {
                                const IconComponent = type.icon
                                return (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      <IconComponent className="h-4 w-4" />
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="consent">Consent Required</Label>
                          <Select
                            value={recordingSettings.consent}
                            onValueChange={(value) => setRecordingSettings(prev => ({ ...prev, consent: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONSENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="autoDelete"
                            checked={recordingSettings.autoDelete}
                            onCheckedChange={(checked) => setRecordingSettings(prev => ({ ...prev, autoDelete: checked }))}
                          />
                          <Label htmlFor="autoDelete">Auto-delete after retention period</Label>
                        </div>

                        {recordingSettings.autoDelete && (
                          <div>
                            <Label htmlFor="retentionDays">Retention Period (days)</Label>
                            <Input
                              id="retentionDays"
                              type="number"
                              min="1"
                              max="365"
                              value={recordingSettings.retentionDays}
                              onChange={(e) => setRecordingSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                            />
                          </div>
                        )}

                        <Alert>
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            All recordings are encrypted end-to-end and only accessible to you and your session partner.
                          </AlertDescription>
                        </Alert>

                        <div className="flex gap-2">
                          <Button onClick={startRecording} className="flex-1">
                            Start Recording
                          </Button>
                          <Button variant="outline" onClick={() => setShowStartDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {isRecording && (
              <div className="mt-4">
                <Progress value={(recordingTime % 60) * 1.67} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recordings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            Session Recordings
          </CardTitle>
          <CardDescription>
            Your encrypted session recordings. Access is controlled by consent settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recordings found for this session.</p>
              <p className="text-sm">Start a recording during your session to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map((recording) => {
                const IconComponent = getRecordingTypeIcon(recording.recordingType)
                const isExpired = recording.expiresAt && new Date(recording.expiresAt) < new Date()
                
                return (
                  <Card key={recording.id} className={isExpired ? 'opacity-60' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-100">
                            <IconComponent className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {recording.recordingType.replace('_', ' ')}
                              </span>
                              <Badge className={getStatusColor(recording.status)}>
                                {recording.status}
                              </Badge>
                              {recording.accessLevel === 'MANAGE' && (
                                <Badge variant="outline">
                                  <Lock className="h-3 w-3 mr-1" />
                                  Owner
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {recording.duration ? formatTime(recording.duration) : 'Processing...'}
                              </span>
                              <span>{formatFileSize(recording.fileSize)}</span>
                              <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                              {recording.expiresAt && (
                                <span className={isExpired ? 'text-red-500' : ''}>
                                  {isExpired ? 'Expired' : `Expires ${new Date(recording.expiresAt).toLocaleDateString()}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {recording.status === 'COMPLETED' && !isExpired && (
                            <>
                              <Button size="sm" variant="outline">
                                <Play className="h-4 w-4 mr-1" />
                                Play
                              </Button>
                              {recording.accessLevel === 'DOWNLOAD' && (
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              )}
                            </>
                          )}
                          
                          {recording.accessLevel === 'MANAGE' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteRecording(recording.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {recording.status === 'PROCESSING' && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Processing recording... This may take a few minutes.
                          </div>
                        </div>
                      )}
                      
                      {isExpired && (
                        <Alert className="mt-3">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            This recording has expired and is no longer accessible.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}