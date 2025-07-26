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
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
