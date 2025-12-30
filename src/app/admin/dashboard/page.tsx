'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Activity, 
  DollarSign, 
  AlertTriangle, 
  MessageSquare,
  TrendingUp,
  Eye,
  Clock
} from 'lucide-react'

interface DashboardData {
  overview: {
    totalUsers: number
    totalSessions: number
    activeUsers: number
    totalRevenue: number
    pendingModeration: number
    activeCrisisReports: number
  }
  userGrowth: any[]
  sessionStats: any[]
  recentLogs: any[]
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-slate-500">Failed to load dashboard data</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Users',
      value: data.overview.totalUsers.toLocaleString(),
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Total Sessions',
      value: data.overview.totalSessions.toLocaleString(),
      change: '+8%',
      changeType: 'positive' as const,
      icon: Activity,
      color: 'text-green-600'
    },
    {
      title: 'Active Listeners',
      value: data.overview.activeUsers.toLocaleString(),
      change: '+5%',
      changeType: 'positive' as const,
      icon: Eye,
      color: 'text-purple-600'
    },
    {
      title: 'Revenue',
      value: `₹${data.overview.totalRevenue.toLocaleString()}`,
      change: '+15%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'text-yellow-600'
    },
    {
      title: 'Pending Moderation',
      value: data.overview.pendingModeration.toLocaleString(),
      change: '-2%',
      changeType: 'negative' as const,
      icon: MessageSquare,
      color: 'text-orange-600'
    },
    {
      title: 'Active Crises',
      value: data.overview.activeCrisisReports.toLocaleString(),
      change: '0%',
      changeType: 'neutral' as const,
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening on TimeRent today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-slate-600">
                <span className={`inline-flex items-center ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {stat.changeType === 'positive' && <TrendingUp className="w-3 h-3 mr-1" />}
                  {stat.change} from last month
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentLogs.slice(0, 5).map((log, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    log.level === 'ERROR' ? 'bg-red-500' :
                    log.level === 'WARN' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {log.event}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session Status */}
        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Breakdown of session states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.sessionStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      stat.status === 'COMPLETED' ? 'bg-green-500' :
                      stat.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                      stat.status === 'SCHEDULED' ? 'bg-yellow-500' :
                      'bg-slate-500'
                    }`} />
                    <span className="text-sm font-medium capitalize">
                      {stat.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-sm text-slate-600">
                    {stat._count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/admin/users" className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-sm font-medium">Manage Users</p>
            </a>
            <a href="/admin/content" className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <MessageSquare className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-sm font-medium">Moderate Content</p>
            </a>
            <a href="/admin/settings" className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Settings className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-sm font-medium">System Settings</p>
            </a>
            <a href="/admin/logs" className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              <Clock className="w-6 h-6 text-orange-600 mb-2" />
              <p className="text-sm font-medium">View Logs</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}