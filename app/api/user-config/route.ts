import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UserConfigService } from '@/lib/user-config'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { awsAccessKeyId, awsSecretKey, awsBucketName, awsRegion } = await request.json()

    // Validate required fields
    if (!awsAccessKeyId || !awsSecretKey || !awsBucketName || !awsRegion) {
      return NextResponse.json(
        { error: 'All AWS configuration fields are required' },
        { status: 400 }
      )
    }

    // Save user configuration
    await UserConfigService.saveUserConfig({
      userId,
      awsAccessKeyId,
      awsSecretKey,
      awsBucketName,
      awsRegion,
    })

    return NextResponse.json({ message: 'Configuration saved successfully' })

  } catch (error) {
    console.error('Error saving user config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const config = await UserConfigService.getUserConfig(userId)
    
    if (!config) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    // Don't send the secret key back to the client
    const safeConfig = {
      awsAccessKeyId: config.awsAccessKeyId,
      awsBucketName: config.awsBucketName,
      awsRegion: config.awsRegion,
      hasSecretKey: !!config.awsSecretKey,
    }

    return NextResponse.json(safeConfig)

  } catch (error) {
    console.error('Error getting user config:', error)
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await UserConfigService.deleteUserConfig(userId)

    return NextResponse.json({ message: 'Configuration deleted successfully' })

  } catch (error) {
    console.error('Error deleting user config:', error)
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    )
  }
}
