# S3Manager - Multi-User AWS S3 File Manager

A modern, secure web application for managing AWS S3 buckets with user authentication and multi-user support.

## Features

- 🔐 **User Authentication** - Secure login with Clerk
- 📁 **S3 File Management** - Browse, upload, delete files and create folders
- 👥 **Multi-User Support** - Each user has their own AWS credentials
- 🎨 **Modern UI** - Built with Next.js, Tailwind CSS, and shadcn/ui
- 🔄 **Fallback Mode** - Works offline with localStorage when database is unavailable
- 🌐 **Presigned URLs** - Secure direct uploads to S3

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB Atlas
- **Authentication**: Clerk
- **AWS Services**: S3
- **Deployment**: Vercel

## Deployment to Vercel

### Prerequisites

1. **MongoDB Atlas Database**
2. **Clerk Account** for authentication
3. **AWS Account** with S3 access
4. **Vercel Account**

### Step 1: Environment Variables

In your Vercel dashboard, add these environment variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/s3manager?retryWrites=true&w=majority&appName=Cluster0
```

### Step 2: Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Step 3: Configure MongoDB Network Access

1. Go to MongoDB Atlas → Network Access
2. Add `0.0.0.0/0` to allow all IPs (or specific Vercel IPs)
3. Ensure your cluster is accessible from Vercel

## Local Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# AWS-S3-Manager
<img width="1080" height="832" alt="20250728_015826" src="https://github.com/user-attachments/assets/1ada0b90-2101-4112-9a76-b112d03a9bc9" />
