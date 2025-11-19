/**
 * Email Testing Script
 * Tests AWS SES email configuration
 * 
 * Usage: node test-email.js <test-type> [email]
 * 
 * Test types:
 *   - verification <email> - Test email verification email
 *   - reset <email> - Test password reset email
 *   - both <email> - Test both emails
 */

const axios = require('axios');
const readline = require('readline');

const API_URL = process.env.API_URL || 'http://localhost:3003';
const TEST_EMAIL = process.argv[3] || null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testVerificationEmail(email) {
  console.log('\n📧 Testing Email Verification...');
  console.log(`   Sending to: ${email}`);
  
  try {
    // First, we need to create a test user or use an existing one
    // For testing, we'll use the send-verification endpoint which requires auth
    // So we'll need a token
    
    console.log('\n⚠️  Note: This requires an authenticated user.');
    console.log('   Option 1: Sign up a test user first, then use their token');
    console.log('   Option 2: Use the forgot-password endpoint (no auth needed)');
    
    const token = await question('\n   Enter auth token (or press Enter to skip): ');
    
    if (token) {
      const response = await axios.post(
        `${API_URL}/api/auth/send-verification`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('   ✅ Success:', response.data.message);
      return true;
    } else {
      console.log('   ⏭️  Skipped (requires authentication)');
      return false;
    }
  } catch (error) {
    console.error('   ❌ Error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testPasswordResetEmail(email) {
  console.log('\n🔐 Testing Password Reset Email...');
  console.log(`   Sending to: ${email}`);
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
      email: email
    });
    
    console.log('   ✅ Success:', response.data.message);
    console.log('   📬 Check your inbox for the password reset link');
    return true;
  } catch (error) {
    console.error('   ❌ Error:', error.response?.data?.error || error.message);
    if (error.response?.status === 500) {
      console.error('   💡 Tip: Check your AWS SES configuration in backend/.env');
      console.error('   💡 Make sure SMTP credentials are correct');
    }
    return false;
  }
}

async function testSignupFlow(email) {
  console.log('\n👤 Testing Signup Flow (sends verification email)...');
  console.log(`   Email: ${email}`);
  
  const username = `test_${Date.now()}`;
  const password = 'TestPassword123!';
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/signup`, {
      email: email,
      username: username,
      password: password,
      fullName: 'Test User'
    });
    
    console.log('   ✅ User created successfully');
    console.log('   📬 Check your inbox for verification email');
    console.log(`   🔑 Token: ${response.data.token.substring(0, 20)}...`);
    return response.data.token;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('already exists')) {
      console.log('   ⚠️  User already exists, trying password reset instead...');
      return null;
    }
    console.error('   ❌ Error:', error.response?.data?.error || error.message);
    return null;
  }
}

async function main() {
  console.log('🧪 Email Testing Tool');
  console.log('====================\n');
  console.log(`API URL: ${API_URL}\n`);
  
  const testType = process.argv[2] || 'both';
  let email = TEST_EMAIL;
  
  if (!email) {
    email = await question('Enter email address to test: ');
  }
  
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address');
    process.exit(1);
  }
  
  console.log(`\n📋 Testing with email: ${email}`);
  console.log(`📋 Test type: ${testType}\n`);
  
  let results = {
    verification: false,
    reset: false,
    signup: false
  };
  
  if (testType === 'verification' || testType === 'both') {
    // Try signup first to get verification email
    const token = await testSignupFlow(email);
    if (token) {
      results.signup = true;
      results.verification = true; // Signup sends verification email
    } else {
      // If user exists, try password reset instead
      results.reset = await testPasswordResetEmail(email);
    }
  }
  
  if (testType === 'reset' || testType === 'both') {
    results.reset = await testPasswordResetEmail(email);
  }
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`Signup: ${results.signup ? '✅' : '❌'}`);
  console.log(`Verification Email: ${results.verification ? '✅' : '❌'}`);
  console.log(`Password Reset Email: ${results.reset ? '✅' : '❌'}`);
  
  if (results.reset || results.verification) {
    console.log('\n✅ At least one email was sent successfully!');
    console.log('📬 Check your inbox (and spam folder) for the email');
  } else {
    console.log('\n❌ No emails were sent successfully');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check backend/.env has correct AWS SES credentials');
    console.log('   2. Verify AWS SES is out of sandbox mode (if needed)');
    console.log('   3. Check backend logs: tail -f backend.log');
    console.log('   4. Verify email address is verified in AWS SES (if in sandbox)');
  }
  
  rl.close();
}

main().catch(console.error);

