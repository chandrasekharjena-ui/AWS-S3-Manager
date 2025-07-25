# Apply CORS Policy to S3 Bucket

## Using AWS CLI:

1. **Install AWS CLI** (if not already installed):
   ```bash
   # Windows
   winget install Amazon.AWSCLI
   
   # Or download from: https://aws.amazon.com/cli/
   ```

2. **Configure AWS CLI** (if not already configured):
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key  
   # Enter your region: ap-south-1
   # Enter output format: json
   ```

3. **Apply CORS Policy to your S3 bucket**:
   ```bash
   aws s3api put-bucket-cors --bucket s3manager45 --cors-configuration file://s3-cors-policy.json
   ```

4. **Verify CORS Policy**:
   ```bash
   aws s3api get-bucket-cors --bucket s3manager45
   ```

## Using AWS Console:

1. Go to **AWS S3 Console**
2. Select bucket: **s3manager45**
3. Go to **Permissions** tab
4. Scroll down to **Cross-origin resource sharing (CORS)**
5. Click **Edit**
6. Paste the JSON content from `s3-cors-policy.json`
7. Click **Save changes**

## CORS Policy Explanation:

- **AllowedOrigins**: Includes localhost:3000 and your domain
- **AllowedMethods**: GET, PUT, POST, DELETE, HEAD for full functionality
- **AllowedHeaders**: "*" allows all headers (including Content-Type)
- **ExposeHeaders**: Allows access to ETag and custom headers
- **MaxAgeSeconds**: Browser caches preflight requests for 50 minutes

## Important Notes:

- Replace "https://your-domain.com" with your actual domain in production
- The CORS policy is applied at the S3 bucket level, not your Next.js app
- After applying CORS, restart your Next.js development server
