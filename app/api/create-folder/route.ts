import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { auth } from '@clerk/nextjs/server';
import { UserConfigService } from '@/lib/user-config';

export async function POST(request: NextRequest) {
    try {
        console.log('Create folder request received')
        
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get user's AWS configuration
        const userConfig = await UserConfigService.getUserConfig(userId);
        
        if (!userConfig) {
            return NextResponse.json(
                { error: 'AWS configuration not found. Please configure your AWS credentials.' },
                { status: 400 }
            );
        }

        const client = new S3Client({
            region: userConfig.awsRegion,
            credentials: {
                accessKeyId: userConfig.awsAccessKeyId,
                secretAccessKey: userConfig.awsSecretKey,
            },
        });
        
        const { folderName, prefix } = await request.json();
        
        console.log('Request data:', { folderName, prefix })
        
        if (!folderName) {
            console.error('No folderName provided')
            return NextResponse.json(
                { error: 'Folder name is required' },
                { 
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                }
            );
        }

        // Sanitize folder name - remove invalid characters
        const sanitizedFolderName = folderName.replace(/[^\w\s-]/g, '').trim();
        
        if (!sanitizedFolderName) {
            return NextResponse.json(
                { error: 'Invalid folder name' },
                { status: 400 }
            );
        }

        // Create the folder key - S3 folders are represented by objects ending with "/"
        const folderKey = prefix 
            ? `${prefix}${sanitizedFolderName}/`
            : `${sanitizedFolderName}/`;

        console.log('Creating folder with key:', folderKey)

        // Create an empty object with "/" suffix to represent a folder
        const command = new PutObjectCommand({
            Bucket: userConfig.awsBucketName,
            Key: folderKey,
            Body: '', // Empty body for folder
            ContentType: 'application/x-directory',
        });

        await client.send(command);

        console.log('Folder created successfully:', folderKey)

        return NextResponse.json({
            message: 'Folder created successfully',
            key: folderKey,
            folderName: sanitizedFolderName,
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

    } catch (error) {
        console.error('Error creating folder:', error);
        return NextResponse.json(
            { 
                error: 'Failed to create folder', 
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { 
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
