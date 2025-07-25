import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Test AWS configuration using environment variables
        const client = new S3Client({
            region: process.env.AWS_REGION as string,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
            },
        });

        // Simple test - list buckets
        const command = new ListBucketsCommand({});
        const result = await client.send(command);
        
        return NextResponse.json({
            success: true,
            message: 'AWS configuration is working',
            bucketCount: result.Buckets?.length || 0
        });
    } catch (error) {
        return NextResponse.json(
            { 
                error: 'AWS configuration test failed', 
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}