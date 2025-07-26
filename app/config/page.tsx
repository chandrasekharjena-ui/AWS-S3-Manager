'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import NavBar from '@/components/nav'
import { TempConfigService } from '@/lib/temp-config'
import { 
  Settings, 
  Key, 
  Database, 
  Globe, 
  Save, 
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface UserConfig {
  awsAccessKeyId: string
  awsBucketName: string
  awsRegion: string
  hasSecretKey: boolean
}

export default function ConfigPage() {
  const { user, isLoaded } = useUser()
  const [config, setConfig] = useState<UserConfig | null>(null)
  const [formData, setFormData] = useState({
    awsAccessKeyId: '',
    awsSecretKey: '',
    awsBucketName: '',
    awsRegion: 'us-east-1',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [fallbackMode, setFallbackMode] = useState(false)

  useEffect(() => {
    console.log('Config page - isLoaded:', isLoaded, 'user:', !!user)
    if (isLoaded && user) {
      console.log('User authenticated, fetching config...')
      fetchConfig()
    } else if (isLoaded && !user) {
      console.log('User not authenticated')
    }
  }, [isLoaded, user])

  const fetchConfig = async () => {
    setLoading(true)
    setFallbackMode(false)
    
    try {
      console.log('Fetching user config...')
      const response = await fetch('/api/user-config')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Config data:', data)
        setConfig(data)
        setFormData({
          awsAccessKeyId: data.awsAccessKeyId,
          awsSecretKey: '', // Never populate secret key
          awsBucketName: data.awsBucketName,
          awsRegion: data.awsRegion,
        })
      } else if (response.status === 404) {
        console.log('No config found - this is expected for new users')
        setConfig(null)
      } else {
        // For other errors (like MongoDB connection issues), switch to fallback mode
        console.log('Config fetch failed, switching to fallback mode. Status:', response.status)
        setFallbackMode(true)
        
        // Try to load from localStorage
        const tempConfig = TempConfigService.getConfig()
        if (tempConfig) {
          setConfig({
            awsAccessKeyId: tempConfig.awsAccessKeyId,
            awsBucketName: tempConfig.awsBucketName,
            awsRegion: tempConfig.awsRegion,
            hasSecretKey: !!tempConfig.awsSecretKey
          })
          setFormData({
            awsAccessKeyId: tempConfig.awsAccessKeyId,
            awsSecretKey: '', // Never populate secret key
            awsBucketName: tempConfig.awsBucketName,
            awsRegion: tempConfig.awsRegion,
          })
        } else {
          setConfig(null)
        }
      }
    } catch (error) {
      // Network errors - switch to fallback mode
      console.log('Network error, switching to fallback mode:', error)
      setFallbackMode(true)
      
      // Try to load from localStorage
      const tempConfig = TempConfigService.getConfig()
      if (tempConfig) {
        setConfig({
          awsAccessKeyId: tempConfig.awsAccessKeyId,
          awsBucketName: tempConfig.awsBucketName,
          awsRegion: tempConfig.awsRegion,
          hasSecretKey: !!tempConfig.awsSecretKey
        })
        setFormData({
          awsAccessKeyId: tempConfig.awsAccessKeyId,
          awsSecretKey: '', // Never populate secret key
          awsBucketName: tempConfig.awsBucketName,
          awsRegion: tempConfig.awsRegion,
        })
      } else {
        setConfig(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    if (fallbackMode) {
      // Save to localStorage in fallback mode
      try {
        TempConfigService.saveConfig(formData)
        setMessage({ 
          type: 'success', 
          text: 'Configuration saved locally! (Database unavailable - will sync when connection is restored)' 
        })
        fetchConfig() // Refresh the config
      } catch (error) {
        console.log('Fallback save error:', error)
        setMessage({ 
          type: 'error', 
          text: 'Failed to save configuration locally' 
        })
      } finally {
        setSaving(false)
      }
      return
    }

    // Normal MongoDB save
    try {
      const response = await fetch('/api/user-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await response.json()
        setMessage({ type: 'success', text: 'Configuration saved successfully!' })
        fetchConfig() // Refresh the config
      } else {
        let errorMessage = 'Failed to save configuration'
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch {
          // If we can't parse the error response, use a generic message
          if (response.status === 500) {
            errorMessage = 'Database connection issue. Switching to fallback mode...'
            // Switch to fallback mode and save locally
            setFallbackMode(true)
            TempConfigService.saveConfig(formData)
            setMessage({ 
              type: 'success', 
              text: 'Configuration saved locally! (Database unavailable)' 
            })
            fetchConfig()
            return
          }
        }
        setMessage({ type: 'error', text: errorMessage })
      }
    } catch (error) {
      console.log('Save error, trying fallback mode:', error)
      // Network error - try fallback mode
      setFallbackMode(true)
      try {
        TempConfigService.saveConfig(formData)
        setMessage({ 
          type: 'success', 
          text: 'Configuration saved locally! (Network issue - will sync when connection is restored)' 
        })
        fetchConfig()
      } catch {
        setMessage({ 
          type: 'error', 
          text: 'Failed to save configuration' 
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your AWS configuration?')) {
      return
    }

    try {
      const response = await fetch('/api/user-config', {
        method: 'DELETE',
      })

      if (response.ok) {
        setConfig(null)
        setFormData({
          awsAccessKeyId: '',
          awsSecretKey: '',
          awsBucketName: '',
          awsRegion: 'us-east-1',
        })
        setMessage({ type: 'success', text: 'Configuration deleted successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to delete configuration' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error deleting configuration' })
    }
  }

  const awsRegions = [
    // US Regions
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-east-2', label: 'US East (Ohio)' },
    { value: 'us-west-1', label: 'US West (N. California)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    
    // Africa
    { value: 'af-south-1', label: 'Africa (Cape Town)' },
    
    // Asia Pacific
    { value: 'ap-east-1', label: 'Asia Pacific (Hong Kong)' },
    { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
    { value: 'ap-south-2', label: 'Asia Pacific (Hyderabad)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
    { value: 'ap-southeast-3', label: 'Asia Pacific (Jakarta)' },
    { value: 'ap-southeast-4', label: 'Asia Pacific (Melbourne)' },
    { value: 'ap-southeast-5', label: 'Asia Pacific (Malaysia)' },
    { value: 'ap-southeast-7', label: 'Asia Pacific (Thailand)' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
    { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
    { value: 'ap-northeast-3', label: 'Asia Pacific (Osaka)' },
    { value: 'ap-east-2', label: 'Asia Pacific (Taipei)' },
    
    // Canada
    { value: 'ca-central-1', label: 'Canada (Central)' },
    { value: 'ca-west-1', label: 'Canada West (Calgary)' },
    
    // Europe
    { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
    { value: 'eu-central-2', label: 'Europe (Zurich)' },
    { value: 'eu-west-1', label: 'Europe (Ireland)' },
    { value: 'eu-west-2', label: 'Europe (London)' },
    { value: 'eu-west-3', label: 'Europe (Paris)' },
    { value: 'eu-north-1', label: 'Europe (Stockholm)' },
    { value: 'eu-south-1', label: 'Europe (Milan)' },
    { value: 'eu-south-2', label: 'Europe (Spain)' },
    
    // Israel
    { value: 'il-central-1', label: 'Israel (Tel Aviv)' },
    
    // Mexico
    { value: 'mx-central-1', label: 'Mexico (Central)' },
    
    // Middle East
    { value: 'me-south-1', label: 'Middle East (Bahrain)' },
    { value: 'me-central-1', label: 'Middle East (UAE)' },
    
    // South America
    { value: 'sa-east-1', label: 'South America (São Paulo)' },
  ]

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <p className="text-white">Please sign in to access this page.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <NavBar />
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-6 h-6 text-white" />
            <h1 className="text-2xl font-bold text-white">S3Manager Configuration</h1>
          </div>
          <p className="text-gray-400">
            Configure your AWS credentials to access your S3 buckets securely.
          </p>
          
          {/* Database connection status */}
          {fallbackMode ? (
            <div className="mt-4 p-3 bg-orange-900/20 border border-orange-600/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-orange-200 text-sm">
                  <strong>Fallback Mode:</strong> Database unavailable. Configuration is stored locally and will sync when connection is restored.
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-200 text-sm">
                  Database connected. Your configuration will be saved securely.
                </span>
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-900/50 border border-green-700 text-green-200' 
              : 'bg-red-900/50 border border-red-700 text-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Access Credentials</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AWS Access Key ID
                </label>
                <input
                  type="text"
                  value={formData.awsAccessKeyId}
                  onChange={(e) => setFormData({...formData, awsAccessKeyId: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AWS Secret Access Key
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={formData.awsSecretKey}
                    onChange={(e) => setFormData({...formData, awsSecretKey: e.target.value})}
                    className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                    placeholder={config?.hasSecretKey ? '••••••••••••••••' : 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'}
                    required={!config?.hasSecretKey}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {config?.hasSecretKey && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep existing secret key
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">S3 Configuration</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  S3 Bucket Name
                </label>
                <input
                  type="text"
                  value={formData.awsBucketName}
                  onChange={(e) => setFormData({...formData, awsBucketName: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  placeholder="my-s3-bucket"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AWS Region
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={formData.awsRegion}
                    onChange={(e) => setFormData({...formData, awsRegion: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-400"
                    required
                  >
                    {awsRegions.map((region) => (
                      <option key={region.value} value={region.value}>
                        {region.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={saving || loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>

            {config && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                className="flex items-center gap-2 border-red-700 text-red-400 hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete Configuration
              </Button>
            )}
          </div>
        </form>

        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <h3 className="text-yellow-200 font-medium mb-2">Security Notice</h3>
          <p className="text-yellow-300 text-sm">
            Your AWS credentials are encrypted and stored securely. Never share your credentials 
            or use credentials with excessive permissions. We recommend creating an IAM user with 
            only the necessary S3 permissions.
          </p>
        </div>
      </div>
    </div>
  )
}
