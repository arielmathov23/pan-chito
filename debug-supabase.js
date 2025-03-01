// Supabase Debugging Tool
// Paste this in your browser console to debug Supabase authentication and profile data

const debugSupabase = {
  // Check current session
  async checkSession() {
    console.log('🔍 Checking Supabase session...');
    
    try {
      if (typeof supabase === 'undefined') {
        throw new Error('Supabase client not available globally. Make sure you are on a page where the Supabase client is initialized.');
      }
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        console.log('✅ Active session found:');
        console.log('User ID:', data.session.user.id);
        console.log('Email:', data.session.user.email);
        console.log('Created at:', new Date(data.session.user.created_at).toLocaleString());
        console.log('Session expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
        
        // Return the user ID for use in other functions
        return data.session.user.id;
      } else {
        console.log('❌ No active session found. You are not logged in.');
        return null;
      }
    } catch (error) {
      console.error('Error checking session:', error);
      return null;
    }
  },
  
  // Fetch profile data
  async fetchProfile(userId) {
    console.log('🔍 Fetching profile data...');
    
    try {
      if (!userId) {
        userId = await this.checkSession();
        
        if (!userId) {
          throw new Error('No user ID available. Please log in first.');
        }
      }
      
      if (typeof supabase === 'undefined') {
        throw new Error('Supabase client not available globally.');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        console.log('✅ Profile data found:');
        console.table(data);
        return data;
      } else {
        console.log('❌ No profile data found for this user.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  },
  
  // Check localStorage for Supabase data
  checkLocalStorage() {
    console.log('🔍 Checking localStorage for Supabase data...');
    
    const supabaseItems = {};
    let count = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supabase')) {
        supabaseItems[key] = localStorage.getItem(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`✅ Found ${count} Supabase-related items in localStorage:`);
      console.log(supabaseItems);
    } else {
      console.log('❌ No Supabase-related items found in localStorage.');
    }
    
    return supabaseItems;
  },
  
  // Test database connection
  async testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    
    try {
      if (typeof supabase === 'undefined') {
        throw new Error('Supabase client not available globally.');
      }
      
      // Try to fetch a single row from the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Database connection successful!');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  },
  
  // Run all debug checks
  async runAllChecks() {
    console.log('🔍 Running all Supabase debug checks...');
    
    const userId = await this.checkSession();
    console.log('-----------------------------------');
    
    if (userId) {
      await this.fetchProfile(userId);
      console.log('-----------------------------------');
    }
    
    this.checkLocalStorage();
    console.log('-----------------------------------');
    
    await this.testDatabaseConnection();
    console.log('-----------------------------------');
    
    console.log('✅ All debug checks completed!');
  }
};

console.log('🔧 Supabase Debugging Tool loaded!');
console.log('Run debugSupabase.runAllChecks() to run all checks');
console.log('Or run individual functions:');
console.log('- debugSupabase.checkSession()');
console.log('- debugSupabase.fetchProfile()');
console.log('- debugSupabase.checkLocalStorage()');
console.log('- debugSupabase.testDatabaseConnection()'); 