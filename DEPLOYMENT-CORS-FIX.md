# Deployment CORS Fix for Text Preview

## Problem
Text document preview fails in deployment due to CORS issues when fetching content directly from S3 presigned URLs.

## Solution
The application has been updated to handle text content through a server-side proxy instead of direct client-side fetches.

## Changes Made

### 1. Updated File Browser Component
- Changed text/code file preview to use `/api/objects` endpoint instead of direct S3 URLs
- This avoids CORS issues by handling the S3 request on the server side

### 2. Enhanced Objects API
- Added POST method to `/api/objects/route.ts`
- Supports `getContent` action for fetching text file content
- Returns content as JSON response, avoiding CORS issues

### 3. Updated S3 CORS Policy
- Added support for Vercel and Netlify deployment domains
- Updated `s3-cors-policy-fixed.json` with deployment-friendly origins

## S3 CORS Configuration

Apply this CORS policy to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001", 
            "https://localhost:3000",
            "https://localhost:3001",
            "https://your-domain.com",
            "https://*.vercel.app",
            "https://*.netlify.app",
            "*"
        ],
        "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"],
        "MaxAgeSeconds": 3000
    }
]
```

## AWS CLI Command

```bash
aws s3api put-bucket-cors --bucket YOUR_BUCKET_NAME --cors-configuration file://s3-cors-policy-fixed.json
```

## Testing

1. Deploy your application to Vercel/Netlify
2. Try previewing text files (.txt, .md, .json, etc.)
3. Check browser console for any remaining CORS errors

## Benefits

- ✅ No more CORS errors in deployment
- ✅ Text content loads reliably
- ✅ Server-side error handling
- ✅ Consistent behavior across environments
- ✅ Better security (credentials stay on server)

## File Types Affected

- Text files (.txt, .md, .log)
- Code files (.js, .ts, .py, .json, etc.)
- Configuration files
- Documentation files

Images and PDFs continue to use direct presigned URLs since they don't have CORS restrictions for display.
