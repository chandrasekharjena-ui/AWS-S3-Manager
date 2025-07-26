'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { TempConfigService } from '@/lib/temp-config'
import { 
  Folder, 
  File, 
  Download, 
  ArrowLeft, 
  Home,
  Calendar,
  HardDrive,
  Upload,
  X,
  Check,
  Trash2,
  FolderPlus,
  AlertCircle,
  Search,
  Eye,
  FileText,
  Image as ImageIcon,
  FileType
} from 'lucide-react'

interface S3Item {
  key: string
  type: 'folder' | 'file'
  name: string
  lastModified?: string
  size?: number
}

interface FileBrowserProps {
  bucketName?: string
}

export default function FileBrowser({ bucketName: propBucketName }: FileBrowserProps) {
  const [items, setItems] = useState<S3Item[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPrefix, setCurrentPrefix] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [dragOver, setDragOver] = useState(false)
  const [bucketName, setBucketName] = useState(propBucketName || '')
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [fallbackMode, setFallbackMode] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<S3Item[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  
  // Preview functionality
  const [previewFile, setPreviewFile] = useState<S3Item | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const toast = useToast()

  // Helper function to get file type for preview
  const getFileType = (filename: string): 'image' | 'text' | 'pdf' | 'code' | 'other' => {
    const ext = filename.toLowerCase().split('.').pop() || ''
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return 'image'
    }
    if (['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(ext)) {
      return 'text'
    }
    if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'sql', 'php', 'rb', 'go', 'rs', 'sh', 'yml', 'yaml'].includes(ext)) {
      return 'code'
    }
    if (ext === 'pdf') {
      return 'pdf'
    }
    return 'other'
  }

  // Helper function to get file icon
  const getFileIcon = (filename: string) => {
    const fileType = getFileType(filename)
    switch (fileType) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />
      case 'text':
      case 'code':
        return <FileText className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  // Check if file is previewable
  const isPreviewable = (filename: string): boolean => {
    const fileType = getFileType(filename)
    return ['image', 'text', 'code', 'pdf'].includes(fileType)
  }

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.info('Please enter a search query')
      return
    }

    setIsSearching(true)
    setSearchMode(true)
    
    try {
      const response = await fetch('/api/objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prefix: '', // Search from root
          search: searchQuery
        })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      
      // Filter results based on search query (case-insensitive)
      const filtered = data.items.filter((item: S3Item) => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      setSearchResults(filtered)
      toast.success(`Found ${filtered.length} matching files`)
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchMode(false)
    setSearchQuery('')
    setSearchResults([])
    toast.info('Search cleared')
  }

  // Handle file preview
  const handlePreview = async (item: S3Item) => {
    setPreviewFile(item)
    setPreviewLoading(true)
    setPreviewUrl(null)
    setPreviewContent(null)

    try {
      const fileType = getFileType(item.name)
      
      if (fileType === 'image' || fileType === 'pdf') {
        // Get signed URL for direct viewing
        const response = await fetch('/api/presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: item.key,
            operation: 'getObject'
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(`API Error: ${errorData.error || 'Failed to get presigned URL'}`)
        }
        
        const data = await response.json()
        setPreviewUrl(data.url)
      } else if (fileType === 'text' || fileType === 'code') {
        // Fetch text content
        const response = await fetch('/api/presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: item.key,
            operation: 'getObject'
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(`API Error: ${errorData.error || 'Failed to get presigned URL'}`)
        }
        
        const data = await response.json()
        // Fetch the actual content
        const contentResponse = await fetch(data.url)
        if (!contentResponse.ok) {
          throw new Error('Failed to fetch file content from S3')
        }
        const textContent = await contentResponse.text()
        setPreviewContent(textContent)
      }
    } catch (error) {
      console.error('Error loading preview:', error)
      toast.error(`Failed to load preview: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setPreviewFile(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  // Close preview modal
  const closePreview = () => {
    setPreviewFile(null)
    setPreviewUrl(null)
    setPreviewContent(null)
  }

  // Fetch bucket name from config if not provided as prop
  useEffect(() => {
    const fetchConfig = async () => {
      if (!propBucketName) {
        try {
          const response = await fetch('/api/config')
          if (response.ok) {
            const config = await response.json()
            setBucketName(config.bucketName || 'Unknown Bucket')
            setFallbackMode(false)
            setConfigError(null)
          } else {
            // Database unavailable - try fallback mode
            console.log('Config API unavailable, trying fallback mode')
            const tempConfig = TempConfigService.getConfig()
            if (tempConfig) {
              setBucketName(tempConfig.awsBucketName)
              setFallbackMode(true)
              setConfigError(null)
            } else {
              setConfigError('No AWS configuration found. Please configure your AWS credentials.')
            }
          }
        } catch (error) {
          console.log('Config fetch error, trying fallback mode:', error)
          // Network error - try fallback mode
          const tempConfig = TempConfigService.getConfig()
          if (tempConfig) {
            setBucketName(tempConfig.awsBucketName)
            setFallbackMode(true)
            setConfigError(null)
          } else {
            setConfigError('Unable to load AWS configuration. Please check your setup.')
          }
        }
      }
    }
    fetchConfig()
  }, [propBucketName])

  const fetchItems = async (prefix: string = '') => {
    setLoading(true)
    try {
      const url = prefix 
        ? `/api/objects?prefix=${encodeURIComponent(prefix)}`
        : '/api/objects'
      
      const response = await fetch(url)
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error fetching items:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems(currentPrefix)
  }, [currentPrefix])

  const handleFolderClick = (folderKey: string, folderName: string) => {
    setCurrentPrefix(folderKey)
    setBreadcrumbs([...breadcrumbs, folderName])
  }

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1)
    setBreadcrumbs(newBreadcrumbs)
    
    if (index === -1) {
      setCurrentPrefix('')
    } else {
      const prefix = newBreadcrumbs.join('/') + '/'
      setCurrentPrefix(prefix)
    }
  }

  const handleBack = () => {
    if (breadcrumbs.length > 0) {
      const newBreadcrumbs = breadcrumbs.slice(0, -1)
      setBreadcrumbs(newBreadcrumbs)
      
      if (newBreadcrumbs.length === 0) {
        setCurrentPrefix('')
      } else {
        const prefix = newBreadcrumbs.join('/') + '/'
        setCurrentPrefix(prefix)
      }
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleFileUpload = async (files: FileList) => {
    setUploading(true)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        console.log('Getting presigned URL for:', file.name, 'prefix:', currentPrefix)
        
        // Step 1: Get presigned URL
        const presignedResponse = await fetch('/api/presigned-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            prefix: currentPrefix,
          }),
        })
        
        console.log('Presigned URL response status:', presignedResponse.status)
        
        if (!presignedResponse.ok) {
          const errorText = await presignedResponse.text()
          console.error('Presigned URL error:', errorText)
          throw new Error(`Failed to get presigned URL: ${presignedResponse.status}`)
        }
        
        const { presignedUrl } = await presignedResponse.json()
        console.log('Got presigned URL, starting upload...')
        
        // Step 2: Upload file directly to S3 using presigned URL
        const uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        })
        
        console.log('S3 upload response status:', uploadResponse.status)
        
        if (uploadResponse.ok) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
          console.log('Upload successful for:', file.name)
          // Refresh the file list after successful upload
          await fetchItems(currentPrefix)
        } else {
          const errorText = await uploadResponse.text()
          console.error('S3 upload failed for', file.name, 'Error:', errorText)
        }
      } catch (error) {
        console.error('Upload error for', file.name, ':', error)
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
      }
    }
    
    setUploading(false)
    setUploadProgress({})
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleDelete = async (key: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      console.log('Deleting object:', key)
      
      const response = await fetch('/api/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      })

      if (response.ok) {
        console.log('Delete successful for:', name)
        // Refresh the file list after successful deletion
        await fetchItems(currentPrefix)
      } else {
        const errorData = await response.json()
        console.error('Delete failed for', name, 'Error:', errorData)
        alert(`Failed to delete ${name}: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Delete error for', name, ':', error)
      alert(`Error deleting ${name}`)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name')
      return
    }

    setCreatingFolder(true)
    
    try {
      console.log('Creating folder:', newFolderName)
      
      const response = await fetch('/api/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderName: newFolderName.trim(),
          prefix: currentPrefix,
        }),
      })

      if (response.ok) {
        console.log('Folder created successfully:', newFolderName)
        setShowCreateFolder(false)
        setNewFolderName('')
        // Refresh the file list after successful creation
        await fetchItems(currentPrefix)
      } else {
        const errorData = await response.json()
        console.error('Create folder failed:', errorData)
        alert(`Failed to create folder: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Create folder error:', error)
      alert('Error creating folder')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleCancelCreateFolder = () => {
    setShowCreateFolder(false)
    setNewFolderName('')
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-5 h-5 text-white" />
          <h1 className="text-2xl font-bold text-white">S3 Browser</h1>
          <span className="text-gray-400">- {bucketName}</span>
        </div>
        
        {/* Status indicators */}
        {fallbackMode && (
          <div className="mb-4 p-3 bg-orange-900/20 border border-orange-600/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-orange-200 text-sm">
                <strong>Fallback Mode:</strong> Using locally stored AWS credentials. Database unavailable.
              </span>
            </div>
          </div>
        )}
        
        {configError && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-600/30 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-200 text-sm">{configError}</span>
            </div>
          </div>
        )}
        
        {/* Search */}
        <div className="mb-4 flex items-center space-x-2">
          <div className="flex items-center space-x-2 flex-1">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
            {searchMode && (
              <Button
                onClick={clearSearch}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {/* Search Results Header */}
        {searchMode && (
          <div className="mb-4 text-sm text-gray-400">
            🔍 Search results for &quot;{searchQuery}&quot; ({searchResults.length} items found)
          </div>
        )}
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleBreadcrumbClick(-1)}
            className="p-1 h-8 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <Home className="w-4 h-4" />
          </Button>
          
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-gray-600">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBreadcrumbClick(index)}
                className="h-8 px-2 font-medium text-gray-300 hover:text-white hover:bg-gray-800"
              >
                {crumb}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      {breadcrumbs.length > 0 && (
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      )}

      {/* Upload Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">Upload Files</h2>
          <input
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            id="file-upload"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploading}
            className="flex items-center gap-2 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <Upload className="w-4 h-4" />
            Choose Files
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateFolder(true)}
            className="flex items-center gap-2 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </Button>
        </div>

        {/* Create Folder Dialog */}
        {showCreateFolder && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <FolderPlus className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-medium">Create New Folder</h3>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder()
                  } else if (e.key === 'Escape') {
                    handleCancelCreateFolder()
                  }
                }}
                autoFocus
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateFolder}
                disabled={creatingFolder || !newFolderName.trim()}
                className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
              >
                {creatingFolder ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelCreateFolder}
                className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Folder will be created in: {currentPrefix || 'root'}
            </p>
          </div>
        )}

        {/* Drag and Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-400 bg-blue-400/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-400 mb-1">
            Drag and drop files here, or click &quot;Choose Files&quot;
          </p>
          <p className="text-sm text-gray-500">
            Files will be uploaded to: {currentPrefix || 'root'}
          </p>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className="flex items-center gap-3 p-2 bg-gray-800 rounded">
                <File className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300 flex-1">{fileName}</span>
                <div className="flex items-center gap-2">
                  {progress === 100 ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-400 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File List */}
      <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>This folder is empty</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {(() => {
              const displayItems = searchMode ? searchResults : items
              return displayItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {item.type === 'folder' ? (
                    <Folder className="w-5 h-5 text-blue-400" />
                  ) : (
                    getFileIcon(item.name)
                  )}
                  
                  {item.type === 'folder' ? (
                    <button
                      onClick={() => handleFolderClick(item.key, item.name)}
                      className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <span className="font-medium text-gray-200">{item.name}</span>
                  )}
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-400">
                  {item.type === 'file' && item.lastModified && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(item.lastModified)}
                    </div>
                  )}
                  
                  {item.type === 'file' && item.size !== undefined && (
                    <span className="min-w-[60px] text-right">
                      {formatFileSize(item.size)}
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {item.type === 'file' && isPreviewable(item.name) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handlePreview(item)}
                        className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700"
                        title={`Preview ${item.name}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {item.type === 'file' && (
                      <Button variant="ghost" size="sm" className="p-1 text-gray-400 hover:text-white hover:bg-gray-700">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(item.key, item.name)}
                      className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700"
                      title={`Delete ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
            })()}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden border border-gray-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white truncate">Preview: {previewFile.name}</h3>
              <Button
                onClick={closePreview}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {previewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-300">Loading preview...</span>
                </div>
              ) : previewUrl ? (
                <div className="text-center">
                  {getFileType(previewFile.name) === 'image' ? (
                    <img
                      src={previewUrl}
                      alt={previewFile.name}
                      className="max-w-full max-h-96 mx-auto object-contain"
                      onError={() => {
                        toast.error('Failed to load image preview')
                        closePreview()
                      }}
                    />
                  ) : getFileType(previewFile.name) === 'pdf' ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-96 border border-gray-600 rounded"
                      title={previewFile.name}
                    />
                  ) : null}
                </div>
              ) : previewContent ? (
                <div className="text-left">
                  <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap text-gray-200 border border-gray-600">
                    {previewContent}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileType className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Preview not available for this file type</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
