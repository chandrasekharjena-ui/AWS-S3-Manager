'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import NavBar from "@/components/nav";
import FileBrowser from "@/components/file-browser";

export default function Home() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [hasConfig, setHasConfig] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkConfig = async () => {
      if (isLoaded && user) {
        try {
          const response = await fetch('/api/user-config')
          if (response.ok) {
            setHasConfig(true)
          } else if (response.status === 404) {
            // No config found - normal for new users
            setHasConfig(false)
          } else if (response.status === 401) {
            // Unauthorized - not signed in properly
            setHasConfig(false)
          } else {
            // Database connection issues or other server errors - redirect to config
            console.log('Server error (likely database connection), redirecting to config. Status:', response.status)
            setHasConfig(false)
          }
        } catch (error) {
          // Network errors - redirect to config where fallback mode can handle it
          console.log('Network error checking config, redirecting to config:', error)
          setHasConfig(false)
        }
      } else if (isLoaded && !user) {
        // User not signed in
        setHasConfig(null)
      }
      setLoading(false)
    }

    checkConfig()
  }, [isLoaded, user])

  useEffect(() => {
    if (!loading && isLoaded && user && hasConfig === false) {
      router.push('/config')
    }
  }, [loading, isLoaded, user, hasConfig, router])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <NavBar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Welcome to S3Manager</h1>
            <p className="text-gray-400">Please sign in to manage your S3 buckets</p>
          </div>
        </div>
      </div>
    )
  }

  if (hasConfig === false) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <NavBar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Setting up your AWS configuration...</p>
          </div>
        </div>
      </div>
    ) // Will redirect to /config
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <NavBar />
      <main className="py-8">
        <FileBrowser />
      </main>
    </div>
  );
}
