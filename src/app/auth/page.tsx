'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthForm from '@/components/auth/AuthForm'

export default function AuthPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  return <AuthForm />
}