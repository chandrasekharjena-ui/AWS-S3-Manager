import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const envVars = {
            AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
            AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
            AWS_BUCKET_NAME: !!process.env.AWS_BUCKET_NAME,
            AWS_REGION: !!process.env.AWS_REGION,
            MONGODB_URI: !!process.env.MONGODB_URI,
        };

        return NextResponse.json({
            message: 'Environment variables check',
            variables: envVars,
            allPresent: Object.values(envVars).every(v => v === true)
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to check environment variables', details: error },
            { status: 500 }
        );
    }
}
