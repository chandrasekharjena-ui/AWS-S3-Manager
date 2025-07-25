import { NextRequest, NextResponse } from 'next/server'

// Temporary route that works without MongoDB
export async function GET() {
  return NextResponse.json({
    error: 'Configuration not found - MongoDB connection issue',
    message: 'Please set up your AWS configuration'
  }, { status: 404 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Would save config:', body)
    
    return NextResponse.json({ 
      message: 'Configuration would be saved (MongoDB currently unavailable)',
      received: body 
    })
<<<<<<< HEAD
  } catch {
=======
  } catch (error) {
>>>>>>> 5773621 (Initial commit: S3Manager - Multi-user AWS S3 file manager with Clerk authentication)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
