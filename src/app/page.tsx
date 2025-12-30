'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Users, Heart, Shield, IndianRupee, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/auth')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">TimeRent</h1>
          </div>
          {user ? (
            <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
          ) : (
            <Button variant="outline" onClick={() => router.push('/auth')}>Sign In</Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Rent Attention. Not Output.
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            "I don't need advice. I don't need solutions.<br />
            I just need someone to sit with me while I think."
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
              {user ? 'Go to Dashboard' : 'Find Someone to Sit With'}
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" onClick={handleGetStarted}>
              {user ? 'Your Profile' : 'Become a Time Giver'}
            </Button>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">What Exactly Is Being Rented?</h3>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <span className="text-2xl">❌</span> Not This
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-red-700">
                  <li>• Skills</li>
                  <li>• Advice</li>
                  <li>• Results</li>
                  <li>• Therapy</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <span className="text-2xl">✅</span> Only This
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-green-700">
                  <li>• Human attention, for a fixed amount of time</li>
                  <li>• "Sit with me while I think"</li>
                  <li>• "Be present while I calm down"</li>
                  <li>• "We can stay silent"</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Session Types */}
          <h3 className="text-3xl font-bold text-center mb-8">Session Formats</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Silent Presence",
                description: "No talking required. Camera optional. Just 'being there'.",
                icon: "🤫"
              },
              {
                title: "Open Talk",
                description: "Renter talks, Giver listens only.",
                icon: "🗣️"
              },
              {
                title: "Mirror Mode",
                description: "Giver reflects feelings, not advice.",
                icon: "🪞"
              },
              {
                title: "Thinking Room",
                description: "Both stay mostly quiet. Occasional 'I'm here'.",
                icon: "🤔"
              },
              {
                title: "Focus Companion",
                description: "Work silently together.",
                icon: "🧘"
              }
            ].map((format, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-2">{format.icon}</div>
                  <CardTitle className="text-lg">{format.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center">{format.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Time-Based Pricing</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { minutes: 10, price: 99, description: "Quick presence check" },
              { minutes: 30, price: 249, description: "Standard session" },
              { minutes: 60, price: 399, description: "Deep thinking time" }
            ].map((plan, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    {plan.price}
                  </CardTitle>
                  <CardDescription>{plan.minutes} minutes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <Button className="w-full" onClick={handleGetStarted}>
                    {user ? 'Book Session' : 'Get Started'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Rules */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-8">Rules That Make It Safe</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Hard Platform Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">❌</span>
                    <span>No advice unless asked explicitly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">❌</span>
                    <span>No therapy language</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">❌</span>
                    <span>No problem-solving pressure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">❌</span>
                    <span>No saving sessions (privacy)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Soft Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">💙</span>
                    <span>"Presence over performance"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">💙</span>
                    <span>"Silence is valid"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">💙</span>
                    <span>"You owe nothing after time ends"</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to experience human presence?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands who've found comfort in simply being together.</p>
          <Button size="lg" variant="secondary" className="text-lg px-8" onClick={handleGetStarted}>
            {user ? 'Go to Dashboard' : 'Get Started Now'}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Clock className="h-6 w-6 text-primary" />
              <span className="font-semibold">TimeRent</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 TimeRent. Rent Attention. Not Output.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}