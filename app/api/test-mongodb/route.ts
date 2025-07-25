import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    // Get the MongoDB client
    const client = await clientPromise
    
    // Test the connection by pinging the database
    await client.db("s3manager").command({ ping: 1 })
    
    console.log("Pinged your deployment. You successfully connected to MongoDB!")
    
    return NextResponse.json({ 
      message: 'Successfully connected to MongoDB!',
      database: 's3manager',
      status: 'connected',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('MongoDB connection error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to connect to MongoDB',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
