# Manual Testing Guide for Supabase Authentication

This guide provides step-by-step instructions to manually test and verify that your Supabase authentication is working correctly.

## Prerequisites

1. Your application is running locally or deployed
2. You have access to your Supabase dashboard
3. You have set up the SQL tables using the `updated_supabase_setup.sql` file
4. Your environment variables are correctly configured in `.env.local`

## Testing Steps

### 1. Test User Signup

1. Navigate to your application's signup page (e.g., `/signup`)
2. Fill in the signup form with a test email and password
   - Use a unique email like `test-user-[timestamp]@example.com`
   - Use a secure password like `Test123456!`
3. Submit the form
4. Verify that:
   - No error messages appear
   - You are redirected to the home page or dashboard
   - The UI shows that you are logged in (e.g., your email is displayed, logout button is visible)

### 2. Verify User Creation in Supabase

1. Open your Supabase dashboard
2. Navigate to Authentication > Users
3. Verify that:
   - Your test user appears in the list
   - The email matches what you entered
   - The created timestamp is recent

4. Navigate to Table Editor > profiles
5. Verify that:
   - A profile record was automatically created for your user
   - The email field matches your test user's email
   - The `full_name` and `avatar_url` fields are NULL (as expected)

### 3. Test User Logout

1. In your application, click the logout button
2. Verify that:
   - You are redirected to the login page
   - The UI shows that you are logged out (e.g., login/signup links are visible)
   - Protected routes are no longer accessible

### 4. Test User Login

1. Navigate to your application's login page (e.g., `/login`)
2. Fill in the login form with the same test email and password used during signup
3. Submit the form
4. Verify that:
   - No error messages appear
   - You are redirected to the home page or dashboard
   - The UI shows that you are logged in again

### 5. Test Session Persistence

1. Refresh the page
2. Verify that:
   - You remain logged in (session persists)
   - No additional login is required

2. Open a new browser tab and navigate to your application
3. Verify that:
   - You remain logged in across tabs (session is shared)

### 6. Test Profile Management

1. Navigate to your profile page (e.g., `/profile`)
2. Fill in the profile form:
   - Add a full name
   - Add an avatar URL (e.g., `https://via.placeholder.com/150`)
3. Save the changes
4. Verify that:
   - A success message appears
   - The form shows the updated values

5. Refresh the page
6. Verify that:
   - The profile data persists after refresh

7. Check your Supabase dashboard
8. Navigate to Table Editor > profiles
9. Verify that:
   - The profile record has been updated with the full name and avatar URL

## Using the Automated Testing Script

For a more automated approach, you can use the `test-auth.js` script:

1. Open your browser's developer console (F12 or right-click > Inspect > Console)
2. Copy and paste the entire contents of `test-auth.js` into the console
3. Run `testAuth.runAllTests()` to see instructions
4. Follow the steps to run each test function in sequence

## Troubleshooting

If any of the tests fail, check the following:

### Signup Issues

- Verify that your Supabase URL and anon key are correct in `.env.local`
- Check if email confirmation is required in your Supabase settings
- Look for CORS errors in the browser console

### Login Issues

- Verify that the user exists in Supabase
- Check if the password meets the requirements
- Look for authentication errors in the browser console

### Profile Update Issues

- Verify that the RLS policies are correctly set up
- Check if the user has permission to update their profile
- Look for database errors in the browser console

## Next Steps

Once you've verified that the basic authentication flow works, you can:

1. Test edge cases (invalid emails, weak passwords, etc.)
2. Implement additional authentication features (password reset, email verification)
3. Add more profile fields as needed
4. Implement social login providers if required 