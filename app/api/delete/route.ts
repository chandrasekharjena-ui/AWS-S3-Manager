import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { auth } from '@clerk/nextjs/server';
import { UserConfigService } from '@/lib/user-config';

export async function DELETE(request: NextRequest) {
    try {
        console.log('Delete request received')
        
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
        
        const { key } = await request.json();
        
        console.log('Delete key:', key)
        
        if (!key) {
            console.error('No key provided')
            return NextResponse.json(
                { error: 'Object key is required' },
                { 
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                }
            );
        }

        const command = new DeleteObjectCommand({
            Bucket: userConfig.awsBucketName,
            Key: key,
        });

        await client.send(command);

        console.log('Object deleted successfully:', key)

        return NextResponse.json({
            message: 'Object deleted successfully',
            key: key,
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });

    } catch (error) {
        console.error('Error deleting object:', error);
        return NextResponse.json(
            { 
                error: 'Failed to delete object', 
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { 
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
