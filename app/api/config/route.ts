import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { UserConfigService } from '@/lib/user-config';

export async function GET() {
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
                { error: 'AWS configuration not found' },
                { status: 404 }
            );
        }

        // Return safe config (without secret key)
        return NextResponse.json({
            bucketName: userConfig.awsBucketName,
            region: userConfig.awsRegion,
            accessKeyId: userConfig.awsAccessKeyId,
        });
    } catch (error) {
        console.error('Error getting config:', error);
        return NextResponse.json(
            { error: 'Failed to get configuration' },
            { status: 500 }
        );
    }
}
