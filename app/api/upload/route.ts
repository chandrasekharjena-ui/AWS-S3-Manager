import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
<<<<<<< HEAD
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
=======
        secretAccessKey: process.env.AWS_SECRET_KEY as string,
>>>>>>> 5773621 (Initial commit: S3Manager - Multi-user AWS S3 file manager with Clerk authentication)
    },
});

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const prefix = formData.get('prefix') as string || '';
        
        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create the S3 key (path)
        const key = prefix ? `${prefix}${file.name}` : file.name;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME as string,
            Key: key,
            Body: buffer,
            ContentType: file.type,
        });

        await client.send(command);

        return NextResponse.json(
            { 
                message: 'File uploaded successfully',
                key: key,
                size: file.size,
                type: file.type
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
