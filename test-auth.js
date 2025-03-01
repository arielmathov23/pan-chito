// This is a simple script to test Supabase authentication
// Run this in your browser console when on your application pages

const testAuth = {
  // Test credentials - use a unique email for testing
  testEmail: `test-user-${Date.now()}@example.com`,
  testPassword: 'Test123456!',
  
  // Step 1: Test signup
  async testSignup() {
    console.log('🧪 TESTING SIGNUP');
    console.log(`Using test email: ${this.testEmail}`);
    
    try {
      // Navigate to signup page if needed
      if (!window.location.pathname.includes('/signup')) {
        console.log('Navigating to signup page...');
        window.location.href = '/signup';
        return 'Please run testSignup() again when on the signup page';
      }
      
      // Fill in the signup form
      // This assumes your form has inputs with id/name 'email' and 'password'
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const signupButton = document.querySelector('button[type="submit"]');
      
      if (!emailInput || !passwordInput || !signupButton) {
        throw new Error('Could not find signup form elements');
      }
      
      // Fill in the form
      emailInput.value = this.testEmail;
      passwordInput.value = this.testPassword;
      
      // Trigger input events to ensure form validation works
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('Form filled, submitting...');
      
      // Submit the form
      signupButton.click();
      
      console.log('Signup form submitted. Check if you are redirected to the home page or dashboard.');
      console.log('Then check Supabase dashboard to verify user creation.');
      
      return 'Signup test initiated. After redirect, run testVerifyAuth() to check if you are logged in.';
    } catch (error) {
      console.error('Error during signup test:', error);
      return `Signup test failed: ${error.message}`;
    }
  },
  
  // Step 2: Verify authentication state
  async testVerifyAuth() {
    console.log('🧪 VERIFYING AUTHENTICATION STATE');
    
    try {
      // This assumes you have the Supabase client available globally
      // If not, you'll need to check auth state another way
      if (typeof supabase === 'undefined') {
        console.log('Supabase client not available globally. Checking auth state from localStorage...');
        
        // Check if there's a session in localStorage
        const hasSession = localStorage.getItem('supabase.auth.token');
        
        if (hasSession) {
          console.log('✅ Session found in localStorage. You appear to be logged in.');
          return 'Authentication verified via localStorage. Now run testLogout() to test logout.';
        } else {
          console.log('❌ No session found in localStorage. You appear to be logged out.');
          return 'No authentication found. Signup may have failed.';
        }
      }
      
      // Check auth state using Supabase client
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        console.log('✅ Authentication verified. You are logged in as:', data.session.user.email);
        return 'Authentication verified. Now run testLogout() to test logout.';
      } else {
        console.log('❌ No active session found. You are not logged in.');
        return 'No authentication found. Signup may have failed.';
      }
    } catch (error) {
      console.error('Error verifying authentication:', error);
      return `Auth verification failed: ${error.message}`;
    }
  },
  
  // Step 3: Test logout
  async testLogout() {
    console.log('🧪 TESTING LOGOUT');
    
    try {
      // Find and click the logout button
      // This assumes you have a logout button or link somewhere in the UI
      const logoutButton = Array.from(document.querySelectorAll('button'))
        .find(button => button.textContent.toLowerCase().includes('logout') || 
                        button.textContent.toLowerCase().includes('sign out'));
      
      if (!logoutButton) {
        console.log('Could not find logout button. Trying to logout programmatically...');
        
        // Try to access the logout function from the auth context
        // This is a fallback and may not work depending on your implementation
        if (typeof supabase !== 'undefined') {
          await supabase.auth.signOut();
          console.log('Logged out programmatically via Supabase client.');
        } else {
          console.log('Supabase client not available globally. Please logout manually.');
          return 'Please logout manually and then run testLogin() to test login.';
        }
      } else {
        console.log('Logout button found, clicking...');
        logoutButton.click();
      }
      
      console.log('Logout initiated. Check if you are redirected to the login page.');
      
      return 'Logout test initiated. After redirect, run testLogin() to test login.';
    } catch (error) {
      console.error('Error during logout test:', error);
      return `Logout test failed: ${error.message}`;
    }
  },
  
  // Step 4: Test login
  async testLogin() {
    console.log('🧪 TESTING LOGIN');
    console.log(`Using test email: ${this.testEmail}`);
    
    try {
      // Navigate to login page if needed
      if (!window.location.pathname.includes('/login')) {
        console.log('Navigating to login page...');
        window.location.href = '/login';
        return 'Please run testLogin() again when on the login page';
      }
      
      // Fill in the login form
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const loginButton = document.querySelector('button[type="submit"]');
      
      if (!emailInput || !passwordInput || !loginButton) {
        throw new Error('Could not find login form elements');
      }
      
      // Fill in the form
      emailInput.value = this.testEmail;
      passwordInput.value = this.testPassword;
      
      // Trigger input events
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('Form filled, submitting...');
      
      // Submit the form
      loginButton.click();
      
      console.log('Login form submitted. Check if you are redirected to the home page or dashboard.');
      
      return 'Login test initiated. After redirect, run testVerifyAuth() again to check if you are logged in.';
    } catch (error) {
      console.error('Error during login test:', error);
      return `Login test failed: ${error.message}`;
    }
  },
  
  // Step 5: Test profile management
  async testProfileUpdate() {
    console.log('🧪 TESTING PROFILE UPDATE');
    
    try {
      // Navigate to profile page if needed
      if (!window.location.pathname.includes('/profile')) {
        console.log('Navigating to profile page...');
        window.location.href = '/profile';
        return 'Please run testProfileUpdate() again when on the profile page';
      }
      
      // Find profile form elements
      const fullNameInput = document.querySelector('input[name="fullName"]');
      const avatarUrlInput = document.querySelector('input[name="avatarUrl"]');
      const saveButton = Array.from(document.querySelectorAll('button'))
        .find(button => button.textContent.toLowerCase().includes('save'));
      
      if (!fullNameInput || !avatarUrlInput || !saveButton) {
        throw new Error('Could not find profile form elements');
      }
      
      // Fill in the form with test data
      fullNameInput.value = 'Test User';
      avatarUrlInput.value = 'https://via.placeholder.com/150';
      
      // Trigger input events
      fullNameInput.dispatchEvent(new Event('input', { bubbles: true }));
      avatarUrlInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('Profile form filled, submitting...');
      
      // Submit the form
      saveButton.click();
      
      console.log('Profile update submitted. Check for success message.');
      
      return 'Profile update test initiated. Check for success message and verify in Supabase dashboard.';
    } catch (error) {
      console.error('Error during profile update test:', error);
      return `Profile update test failed: ${error.message}`;
    }
  },
  
  // Run all tests in sequence
  runAllTests() {
    console.log('⚠️ This will run all tests in sequence.');
    console.log('⚠️ You need to manually run each function after the previous one completes.');
    console.log('⚠️ Follow these steps:');
    console.log('1. Run testAuth.testSignup() on the signup page');
    console.log('2. After redirect, run testAuth.testVerifyAuth()');
    console.log('3. Run testAuth.testLogout()');
    console.log('4. After redirect, run testAuth.testLogin() on the login page');
    console.log('5. After redirect, run testAuth.testVerifyAuth() again');
    console.log('6. Run testAuth.testProfileUpdate() on the profile page');
    
    return 'Please follow the steps above to run all tests in sequence.';
  }
};

console.log('🧪 Auth Testing Utility loaded!');
console.log('Run testAuth.runAllTests() to see instructions for testing the auth flow.');
console.log('Or run individual test functions:');
console.log('- testAuth.testSignup()');
console.log('- testAuth.testVerifyAuth()');
console.log('- testAuth.testLogout()');
console.log('- testAuth.testLogin()');
console.log('- testAuth.testProfileUpdate()'); 