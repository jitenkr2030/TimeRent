'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  AlertTriangle, 
  Phone, 
  Users, 
  Shield, 
  Ambulance, 
  Heart,
  UserPlus,
  Contact,
  Clock,
  CheckCircle,
  AlertCircle,
  PhoneCall
} from 'lucide-react'
import { toast } from 'sonner'

interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
  email?: string
  isPrimary: boolean
  priority: number
}

interface ProfessionalBackup {
  id: string
  name: string
  profession: string
  organization?: string
  phone: string
  email?: string
  specialization?: string
  responseTime?: number
  isAvailable: boolean
  priority: number
}

interface CrisisReport {
  id: string
  severity: string
  type: string
  status: string
  createdAt: string
  description: string
}

const CRISIS_SEVERITY = {
  LOW: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Low' },
  MEDIUM: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Medium' },
  HIGH: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'High' },
  CRITICAL: { color: 'bg-red-200 text-red-900', icon: Ambulance, label: 'Critical' }
}

const CRISIS_TYPES = [
  { value: 'SELF_HARM', label: 'Self Harm' },
  { value: 'SUICIDAL_IDEATION', label: 'Suicidal Thoughts' },
  { value: 'PANIC_ATTACK', label: 'Panic Attack' },
  { value: 'SEVERE_ANXIETY', label: 'Severe Anxiety' },
  { value: 'DEPRESSION', label: 'Depression' },
  { value: 'TRAUMA_TRIGGER', label: 'Trauma Trigger' },
  { value: 'SUBSTANCE_CRISIS', label: 'Substance Crisis' },
  { value: 'DOMESTIC_VIOLENCE', label: 'Domestic Violence' },
  { value: 'OTHER', label: 'Other' }
]

export default function EmergencySupportSystem({ userId }: { userId: string }) {
  const [activeCrises, setActiveCrises] = useState<CrisisReport[]>([])
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [professionalBackups, setProfessionalBackups] = useState<ProfessionalBackup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCrisisDialog, setShowCrisisDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [crisisForm, setCrisisForm] = useState({
    severity: '',
    type: '',
    description: ''
  })
  const [contactForm, setContactForm] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    isPrimary: false
  })

  useEffect(() => {
    fetchEmergencyData()
  }, [userId])

  const fetchEmergencyData = async () => {
    try {
      setLoading(true)
      
      // Fetch active crises
      const crisisResponse = await fetch(`/api/crisis/intervention?userId=${userId}`)
      const crisisData = await crisisResponse.json()
      
      if (crisisData.activeCrises) {
        setActiveCrises(crisisData.activeCrises)
      }

      // Fetch emergency contacts
      const contactsResponse = await fetch(`/api/emergency-contacts?userId=${userId}`)
      const contactsData = await contactsResponse.json()
      
      if (contactsData.emergencyContacts) {
        setEmergencyContacts(contactsData.emergencyContacts)
      }

      // Fetch professional backups
      const backupsResponse = await fetch('/api/professional-backup?available=true')
      const backupsData = await backupsResponse.json()
      
      if (backupsData.professionalBackups) {
        setProfessionalBackups(backupsData.professionalBackups)
      }
      
    } catch (error) {
      console.error('Error fetching emergency data:', error)
      toast.error('Failed to load emergency support data')
    } finally {
      setLoading(false)
    }
  }

  const handleCrisisIntervention = async () => {
    if (!crisisForm.severity || !crisisForm.type || !crisisForm.description) {
      toast.error('Please fill all crisis report fields')
      return
    }

    try {
      const response = await fetch('/api/crisis/intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...crisisForm
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Crisis intervention protocol activated')
        setShowCrisisDialog(false)
        setCrisisForm({ severity: '', type: '', description: '' })
        fetchEmergencyData()
        
        // Show emergency resources if critical
        if (crisisForm.severity === 'CRITICAL') {
          showEmergencyResources(data.emergencyResources)
        }
      } else {
        toast.error(data.error || 'Failed to activate crisis intervention')
      }
    } catch (error) {
      console.error('Crisis intervention error:', error)
      toast.error('Failed to activate crisis intervention')
    }
  }

  const handleAddEmergencyContact = async () => {
    if (!contactForm.name || !contactForm.relationship || !contactForm.phone) {
      toast.error('Please fill all required contact fields')
      return
    }

    try {
      const response = await fetch('/api/emergency-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...contactForm
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Emergency contact added successfully')
        setShowContactDialog(false)
        setContactForm({ name: '', relationship: '', phone: '', email: '', isPrimary: false })
        fetchEmergencyData()
      } else {
        toast.error(data.error || 'Failed to add emergency contact')
      }
    } catch (error) {
      console.error('Add emergency contact error:', error)
      toast.error('Failed to add emergency contact')
    }
  }

  const showEmergencyResources = (resources: any) => {
    // Create emergency resources alert
    const resourcesHtml = `
      <div class="emergency-resources">
        <h4>Emergency Resources</h4>
        <div class="resources-grid">
          <div>
            <strong>Suicide Prevention:</strong><br>
            iCall: 9152987821 (24/7)
          </div>
          <div>
            <strong>Mental Health:</strong><br>
            Vandrevala Foundation: 18602662345 (24/7)
          </div>
          <div>
            <strong>Domestic Violence:</strong><br>
            National Helpline: 181 (24/7)
          </div>
        </div>
      </div>
    `
    
    toast.info('Emergency resources have been provided. Please reach out for help.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alert Banner for Active Crises */}
      {activeCrises.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You have {activeCrises.length} active crisis report{activeCrises.length > 1 ? 's' : ''}. 
            Help is available - please reach out to your emergency contacts or call emergency services.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="crisis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="crisis">Crisis Support</TabsTrigger>
          <TabsTrigger value="contacts">Emergency Contacts</TabsTrigger>
          <TabsTrigger value="backup">Professional Network</TabsTrigger>
        </TabsList>

        <TabsContent value="crisis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Crisis Intervention
              </CardTitle>
              <CardDescription>
                If you're experiencing a crisis, activate our intervention protocol for immediate support.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  onClick={() => setShowCrisisDialog(true)}
                  className="bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Activate Crisis Protocol
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = 'tel:9152987821'}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Call Crisis Helpline
                </Button>
              </div>

              {/* Active Crisis Reports */}
              {activeCrises.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Active Crisis Reports</h4>
                  {activeCrises.map((crisis) => {
                    const severityConfig = CRISIS_SEVERITY[crisis.severity as keyof typeof CRISIS_SEVERITY]
                    const IconComponent = severityConfig.icon
                    
                    return (
                      <Card key={crisis.id} className="border-red-200">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <IconComponent className="h-5 w-5 text-red-600 mt-0.5" />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={severityConfig.color}>
                                    {severityConfig.label}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {crisis.type.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(crisis.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-red-600">
                              {crisis.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Contact className="h-5 w-5 text-blue-600" />
                    Emergency Contacts
                  </CardTitle>
                  <CardDescription>
                    People who can be contacted during emergencies.
                  </CardDescription>
                </div>
                <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Emergency Contact</DialogTitle>
                      <DialogDescription>
                        Add someone who can be contacted during emergencies.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="relationship">Relationship *</Label>
                        <Select
                          value={contactForm.relationship}
                          onValueChange={(value) => setContactForm(prev => ({ ...prev, relationship: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="family">Family</SelectItem>
                            <SelectItem value="friend">Friend</SelectItem>
                            <SelectItem value="therapist">Therapist</SelectItem>
                            <SelectItem value="partner">Partner</SelectItem>
                            <SelectItem value="colleague">Colleague</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Email address (optional)"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isPrimary"
                          checked={contactForm.isPrimary}
                          onCheckedChange={(checked) => setContactForm(prev => ({ ...prev, isPrimary: checked }))}
                        />
                        <Label htmlFor="isPrimary">Set as primary contact</Label>
                      </div>
                      <Button onClick={handleAddEmergencyContact} className="w-full">
                        Add Contact
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {emergencyContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Contact className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No emergency contacts added yet.</p>
                  <p className="text-sm">Add contacts who can help during emergencies.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emergencyContacts.map((contact) => (
                    <Card key={contact.id} className={contact.isPrimary ? 'border-blue-200 bg-blue-50/50' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-blue-100">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{contact.name}</span>
                                {contact.isPrimary && (
                                  <Badge variant="secondary" className="text-xs">Primary</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <a 
                                  href={`tel:${contact.phone}`}
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="h-3 w-3" />
                                  {contact.phone}
                                </a>
                                {contact.email && (
                                  <a 
                                    href={`mailto:${contact.email}`}
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    {contact.email}
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-600" />
                Professional Backup Network
              </CardTitle>
              <CardDescription>
                Mental health professionals available for crisis support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {professionalBackups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No professional backups available at the moment.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {professionalBackups.map((professional) => (
                    <Card key={professional.id} className={professional.isAvailable ? 'border-green-200' : 'border-gray-200 opacity-60'}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${professional.isAvailable ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <Heart className={`h-4 w-4 ${professional.isAvailable ? 'text-green-600' : 'text-gray-600'}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{professional.name}</span>
                                <Badge variant={professional.isAvailable ? "default" : "secondary"}>
                                  {professional.isAvailable ? 'Available' : 'Unavailable'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{professional.profession}</p>
                              {professional.organization && (
                                <p className="text-sm text-muted-foreground">{professional.organization}</p>
                              )}
                              {professional.specialization && (
                                <p className="text-sm text-blue-600">{professional.specialization}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <a 
                                  href={`tel:${professional.phone}`}
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="h-3 w-3" />
                                  {professional.phone}
                                </a>
                                {professional.responseTime && (
                                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    ~{professional.responseTime}min response
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Crisis Intervention Dialog */}
      <Dialog open={showCrisisDialog} onOpenChange={setShowCrisisDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Crisis Intervention
            </DialogTitle>
            <DialogDescription>
              We're here to help. Please provide some information about your situation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="severity">Severity Level *</Label>
              <Select
                value={crisisForm.severity}
                onValueChange={(value) => setCrisisForm(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low - Distressed but safe</SelectItem>
                  <SelectItem value="MEDIUM">Medium - Need immediate support</SelectItem>
                  <SelectItem value="HIGH">High - Crisis situation</SelectItem>
                  <SelectItem value="CRITICAL">Critical - Emergency services needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="type">Crisis Type *</Label>
              <Select
                value={crisisForm.type}
                onValueChange={(value) => setCrisisForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select crisis type" />
                </SelectTrigger>
                <SelectContent>
                  {CRISIS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={crisisForm.description}
                onChange={(e) => setCrisisForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please describe what's happening..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCrisisIntervention} 
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Get Help Now
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCrisisDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}