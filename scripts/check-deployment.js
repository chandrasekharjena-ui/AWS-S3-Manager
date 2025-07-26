#!/usr/bin/env node

// Deployment readiness checker for S3Manager
import fs from 'fs';


console.log('🔍 Checking S3Manager deployment readiness...\n');

const checks = [
  {
    name: 'Package.json exists',
    check: () => fs.existsSync('./package.json'),
    required: true
  },
  {
    name: 'Next.js config exists',
    check: () => fs.existsSync('./next.config.ts') || fs.existsSync('./next.config.js'),
    required: true
  },
  {
    name: 'Vercel config exists',
    check: () => fs.existsSync('./vercel.json'),
    required: false
  },
  {
    name: 'Environment example exists',
    check: () => fs.existsSync('./.env.local.example'),
    required: false
  },
  {
    name: 'TypeScript config exists',
    check: () => fs.existsSync('./tsconfig.json'),
    required: true
  },
  {
    name: 'API routes exist',
    check: () => fs.existsSync('./app/api') && fs.readdirSync('./app/api').length > 0,
    required: true
  },
  {
    name: 'Components exist',
    check: () => fs.existsSync('./components') && fs.readdirSync('./components').length > 0,
    required: true
  },
  {
    name: 'Build script exists',
    check: () => {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      return packageJson.scripts && packageJson.scripts.build;
    },
    required: true
  },
  {
    name: 'Start script exists',
    check: () => {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      return packageJson.scripts && packageJson.scripts.start;
    },
    required: true
  },
  {
    name: 'Toast component exists',
    check: () => fs.existsSync('./components/ui/toast.tsx'),
    required: true
  },
  {
    name: 'File browser component exists',
    check: () => fs.existsSync('./components/file-browser.tsx'),
    required: true
  },
  {
    name: 'MongoDB lib exists',
    check: () => fs.existsSync('./lib/mongodb.ts'),
    required: true
  },
  {
    name: 'User config lib exists',
    check: () => fs.existsSync('./lib/user-config.ts'),
    required: true
  },
  {
    name: 'Essential API routes exist',
    check: () => {
      const essentialRoutes = [
        './app/api/config/route.ts',
        './app/api/objects/route.ts',
        './app/api/presigned-url/route.ts',
        './app/api/user-config/route.ts'
      ];
      return essentialRoutes.every(route => fs.existsSync(route));
    },
    required: true
  },
  {
    name: 'Main layout file exists',
    check: () => fs.existsSync('./app/layout.tsx'),
    required: true
  },
  {
    name: 'Main page file exists',
    check: () => fs.existsSync('./app/page.tsx'),
    required: true
  }
];

let allPassed = true;
let requiredPassed = true;

checks.forEach(({ name, check, required }) => {
  try {
    const passed = check();
    const status = passed ? '✅' : '❌';
    const req = required ? '(Required)' : '(Optional)';
    
    console.log(`${status} ${name} ${req}`);
    
    if (!passed) {
      allPassed = false;
      if (required) {
        requiredPassed = false;
      }
    }
  } catch (error) {
    console.log(`❌ ${name} (Required) - Error: ${error.message}`);
    allPassed = false;
    if (required) {
      requiredPassed = false;
    }
  }
});

console.log('\n📋 Summary:');

if (requiredPassed) {
  console.log('✅ All required checks passed! Your app is ready for Vercel deployment.');
  console.log('\n🚀 Next steps:');
  console.log('1. Set up environment variables in Vercel:');
  console.log('   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY');
  console.log('   - CLERK_SECRET_KEY');
  console.log('   - MONGODB_URI');
  console.log('   - Optional: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION');
  console.log('2. Run: vercel --prod');
  console.log('3. Configure your domains in Clerk dashboard');
  console.log('4. Test your deployed application');
  console.log('\n💡 Features included:');
  console.log('   ✓ File preview (images, text, PDF)');
  console.log('   ✓ Global search across S3 bucket');
  console.log('   ✓ Toast notifications for user feedback');
  console.log('   ✓ Drag & drop file upload');
  console.log('   ✓ Folder creation and navigation');
  console.log('   ✓ File deletion with confirmation');
} else {
  console.log('❌ Some required checks failed. Please fix the issues above before deploying.');
}

if (!allPassed && requiredPassed) {
  console.log('\n⚠️  Some optional features are missing but deployment should still work.');
}

console.log('\n📖 For detailed instructions, see DEPLOYMENT.md');

process.exit(requiredPassed ? 0 : 1);
