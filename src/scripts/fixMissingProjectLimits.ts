import { supabase } from '../lib/supabaseClient';

async function fixMissingProjectLimits() {
  try {
    console.log('Starting to fix missing project limits...');
    
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users.users.length} users to check`);
    
    // Get default free plan
    const { data: freePlan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('name', 'Free')
      .single();
      
    if (planError || !freePlan) {
      console.error('Error fetching Free plan:', planError);
      return;
    }
    
    let fixedCount = 0;
    
    // Check each user for project limits
    for (const user of users.users) {
      const { data: limit, error: limitError } = await supabase
        .from('project_limits')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (limitError && limitError.code === 'PGRST116') {
        // No limit found, create one
        console.log(`Creating missing project limit for user: ${user.id}`);
        
        const { error: insertError } = await supabase
          .from('project_limits')
          .insert({
            user_id: user.id,
            max_projects: freePlan.default_project_limit,
            plan_id: freePlan.id,
            max_prioritized_features: freePlan.default_prioritized_features_limit || 2
          });
          
        if (insertError) {
          console.error(`Error creating project limit for user ${user.id}:`, insertError);
        } else {
          fixedCount++;
          console.log(`Successfully created project limit for user: ${user.id}`);
        }
      }
    }
    
    console.log(`Fixed ${fixedCount} users missing project limits`);
  } catch (error) {
    console.error('Error fixing missing project limits:', error);
  }
}

fixMissingProjectLimits(); 