// Minimal Supabase Auth Debugging Tool
// Copy and paste this into your browser console

const authDebug = {
  // Check if you're logged in
  async checkLogin() {
    console.log('🔍 Checking login status...');
    
    try {
      if (typeof supabase === 'undefined') {
        throw new Error('Supabase client not available globally');
      }
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        console.log('✅ Logged in as:', data.session.user.email);
        console.log('User ID:', data.session.user.id);
        return true;
      } else {
        console.log('❌ Not logged in');
        return false;
      }
    } catch (error) {
      console.error('Error checking login:', error);
      return false;
    }
  },
  
  // Check profile data
  async checkProfile() {
    console.log('🔍 Checking profile data...');
    
    try {
      if (typeof supabase === 'undefined') {
        throw new Error('Supabase client not available globally');
      }
      
      // First check if logged in
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        console.log('❌ Not logged in, cannot check profile');
        return null;
      }
      
      const userId = sessionData.session.user.id;
      
      // Fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log('✅ Profile found:');
        console.table(data);
        return data;
      } else {
        console.log('❌ No profile found for this user');
        return null;
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      return null;
    }
  },
  
  // Logout programmatically
  async logout() {
    console.log('🔍 Logging out...');
    
    try {
      if (typeof supabase === 'undefined') {
        throw new Error('Supabase client not available globally');
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Logged out successfully');
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  },
  
  // Run all checks
  async runChecks() {
    const isLoggedIn = await this.checkLogin();
    console.log('-----------------------------------');
    
    if (isLoggedIn) {
      await this.checkProfile();
    }
  }
};

console.log('🔧 Auth Debug Tool loaded!');
console.log('Run authDebug.runChecks() to check login status and profile');
console.log('Or run individual functions:');
console.log('- authDebug.checkLogin()');
console.log('- authDebug.checkProfile()');
console.log('- authDebug.logout()'); 