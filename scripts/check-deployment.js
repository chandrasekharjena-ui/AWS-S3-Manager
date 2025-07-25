#!/usr/bin/env node

// Deployment readiness checker for S3Manager
const fs = require('fs');
const path = require('path');

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
  console.log('1. Set up environment variables in Vercel');
  console.log('2. Run: vercel --prod');
  console.log('3. Configure your domains in Clerk');
  console.log('4. Test your deployed application');
} else {
  console.log('❌ Some required checks failed. Please fix the issues above before deploying.');
}

if (!allPassed && requiredPassed) {
  console.log('\n⚠️  Some optional features are missing but deployment should still work.');
}

console.log('\n📖 For detailed instructions, see DEPLOYMENT.md');

process.exit(requiredPassed ? 0 : 1);
