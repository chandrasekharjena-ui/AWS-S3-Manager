import { NextResponse } from "next/dist/server/web/spec-extension/response";
import {S3Client, ListObjectsV2Command, GetObjectCommand} from '@aws-sdk/client-s3';
import { NextRequest } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { UserConfigService } from '@/lib/user-config';

export async function GET(request: NextRequest) {
    try {
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

        const prefix = request.nextUrl.searchParams.get('prefix') ?? '';
        const command = new ListObjectsV2Command({
            Bucket: userConfig.awsBucketName,
            Prefix: prefix,
            Delimiter: '/',
        });
        
        const result = await client.send(command);
        console.log(result);

        // Get folders (CommonPrefixes)
        const folders = result.CommonPrefixes?.map(prefix => ({
            key: prefix.Prefix,
            type: 'folder',
            name: prefix.Prefix?.replace(/\/$/, '').split('/').pop()
        })) || [];

        // Get files (Contents) - exclude folders
        const files = result.Contents?.filter(obj => !obj.Key?.endsWith('/'))
            .map(obj => ({
                key: obj.Key,
                type: 'file',
                name: obj.Key?.split('/').pop(),
                lastModified: obj.LastModified?.toISOString(),
                size: obj.Size
            })) || [];

        const items = [...folders, ...files];
        
        return NextResponse.json({ items });
        
    } catch (error) {
        console.error('Error fetching objects:', error);
        return NextResponse.json(
            { error: 'Failed to fetch objects' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
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

        const { key, action } = await request.json();

        if (action === 'getContent') {
            if (!key) {
                return NextResponse.json(
                    { error: 'Key is required for getContent action' },
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

            const command = new GetObjectCommand({
                Bucket: userConfig.awsBucketName,
                Key: key,
            });

            const result = await client.send(command);
            
            if (!result.Body) {
                return NextResponse.json(
                    { error: 'No content found' },
                    { status: 404 }
                );
            }

            // Convert the stream to text
            const content = await result.Body.transformToString();
            
            return NextResponse.json({ 
                content,
                contentType: result.ContentType,
                lastModified: result.LastModified?.toISOString()
            });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
        
    } catch (error) {
        console.error('Error in POST /api/objects:', error);
        return NextResponse.json(
            { 
                error: 'Failed to process request',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}