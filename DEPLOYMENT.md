# Vercel Deployment Checklist for S3Manager

## Pre-Deployment Setup

### 1. MongoDB Atlas Configuration
- [ ] MongoDB Atlas cluster created and active
- [ ] Database user created with read/write permissions
- [ ] Network access configured (add 0.0.0.0/0 for Vercel)
- [ ] Connection string obtained

### 2. Clerk Authentication Setup
- [ ] Clerk account created
- [ ] Application created in Clerk dashboard
- [ ] Publishable key and secret key obtained
- [ ] Domain configured in Clerk (add your Vercel domain)

### 3. AWS Configuration
- [ ] AWS account setup
- [ ] S3 bucket created
- [ ] IAM user created with S3 permissions
- [ ] Access key and secret key obtained
- [ ] CORS policy configured on S3 bucket

## Vercel Deployment Steps

### 1. Environment Variables
Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
MONGODB_URI
```

Optional (users can set their own):
```
AWS_ACCESS_KEY_ID
<<<<<<< HEAD
AWS_SECRET_ACCESS_KEY
=======
AWS_SECRET_KEY
>>>>>>> 5773621 (Initial commit: S3Manager - Multi-user AWS S3 file manager with Clerk authentication)
AWS_BUCKET_NAME
AWS_REGION
```

### 2. Deploy
```bash
# Method 1: Vercel CLI
npm i -g vercel
vercel

# Method 2: GitHub Integration
# Connect your GitHub repo to Vercel for automatic deployments
```

### 3. Post-Deployment Configuration

#### Update Clerk Settings
- [ ] Add your Vercel domain to Clerk's authorized domains
- [ ] Update redirect URLs in Clerk dashboard

#### Test Functionality
- [ ] Sign up/login works
- [ ] Configuration page loads
- [ ] MongoDB connection works
- [ ] AWS credential storage works
- [ ] S3 file operations work

#### Optional: Custom Domain
- [ ] Add custom domain in Vercel
- [ ] Update Clerk settings with custom domain
- [ ] Update S3 CORS policy with custom domain

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check network access settings
   - Verify connection string format
   - Ensure database name is included

2. **Clerk Authentication Issues**
   - Verify environment variables
   - Check domain configuration
   - Ensure redirect URLs are correct

3. **S3 CORS Errors**
   - Update CORS policy with your domain
   - Check AWS credentials
   - Verify bucket permissions

4. **Build Errors**
   - Check Next.js version compatibility
   - Verify all dependencies are installed
   - Check TypeScript errors

## Security Considerations

- [ ] Environment variables are properly set
- [ ] MongoDB connection uses SSL
- [ ] AWS credentials have minimal required permissions
- [ ] S3 CORS policy is restrictive to your domain
- [ ] No sensitive data in client-side code

## Performance Optimization

- [ ] Enable Vercel Analytics
- [ ] Configure caching headers
- [ ] Optimize images and assets
- [ ] Monitor function execution times
- [ ] Set up error monitoring

## Monitoring

- [ ] Set up Vercel monitoring
- [ ] Configure error tracking
- [ ] Monitor MongoDB Atlas metrics
- [ ] Set up AWS CloudWatch (optional)

## Backup Strategy

- [ ] MongoDB Atlas automatic backups enabled
- [ ] S3 versioning enabled (optional)
- [ ] Regular database exports (optional)
