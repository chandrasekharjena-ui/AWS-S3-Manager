import { NextResponse } from "next/dist/server/web/spec-extension/response";
import {S3Client, ListObjectsV2Command} from '@aws-sdk/client-s3';
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