import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { auth } from '@clerk/nextjs/server';
import { UserConfigService } from '@/lib/user-config';

export async function POST(request: NextRequest) {
    try {
        console.log('Presigned URL request received')
        
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
        
        const { fileName, fileType, prefix, key, operation } = await request.json();
        
        console.log('Request data:', { fileName, fileType, prefix, key, operation })
        
        // For getObject operations, we need either fileName or key
        // For putObject operations, we need fileName
        if (operation === 'getObject') {
            const objectKey = key || (prefix ? `${prefix}${fileName}` : fileName);
            if (!objectKey) {
                console.error('No key or fileName provided for getObject operation')
                return NextResponse.json(
                    { error: 'Key or file name is required for download' },
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

            console.log('Get object key:', objectKey)

            const command = new GetObjectCommand({
                Bucket: userConfig.awsBucketName,
                Key: objectKey,
            });

            // Generate presigned URL that expires in 1 hour for viewing
            const presignedUrl = await getSignedUrl(client, command, {
                expiresIn: 3600, // 1 hour
            });

            console.log('Get presigned URL generated successfully')

            return NextResponse.json({
                url: presignedUrl,
                key: objectKey,
            }, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        } else {
            // Default to putObject operation for upload
            if (!fileName) {
                console.error('No fileName provided')
                return NextResponse.json(
                    { error: 'File name is required' },
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

            // Create the S3 key (path)
            const uploadKey = prefix ? `${prefix}${fileName}` : fileName;
            console.log('Upload S3 key:', uploadKey)

            const command = new PutObjectCommand({
                Bucket: userConfig.awsBucketName,
                Key: uploadKey,
                ContentType: fileType,
            });

            // Generate presigned URL that expires in 5 minutes
            const presignedUrl = await getSignedUrl(client, command, {
                expiresIn: 300, // 5 minutes
            });

            console.log('Upload presigned URL generated successfully')

            return NextResponse.json({
                presignedUrl,
                key: uploadKey,
                fileName,
            }, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return NextResponse.json(
            { 
                error: 'Failed to generate upload URL', 
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
