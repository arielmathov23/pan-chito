# Supabase Authentication Setup

This document provides instructions on how to set up Supabase authentication for the 021 application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- A new Supabase project
- Node.js and npm installed

## Setup Steps

### 1. Create a Supabase Project

1. Log in to your Supabase account
2. Create a new project
3. Note your project URL and anon key (found in Project Settings > API)

### 2. Set Up Database Tables

Run the SQL commands from the `supabase_setup.sql` file in the SQL Editor in your Supabase dashboard. This will:

- Create the `profiles` table
- Set up Row Level Security (RLS) policies
- Create a trigger to automatically create a profile when a user signs up

### 3. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure the following settings:
   - Site URL: Your application URL (e.g., `http://localhost:3000` for local development)
   - Redirect URLs: Add your application URLs (e.g., `http://localhost:3000/login`, `http://localhost:3000/signup`)
   - Enable Email/Password sign-in method

### 4. Set Up Environment Variables

1. Copy the `.env.local.example` file to `.env.local`
2. Update the values with your Supabase project URL and anon key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 5. Install Dependencies

Make sure you have the required dependencies installed:

```bash
npm install @supabase/supabase-js
```

## Testing Authentication

1. Start your application:
   ```bash
   npm run dev
   ```
2. Navigate to the signup page and create a new account
3. Check your Supabase dashboard to verify that:
   - A new user was created in the Auth > Users section
   - A new profile was created in the `profiles` table

## Troubleshooting

- **Email confirmation**: By default, Supabase requires email confirmation. You can disable this in Authentication > Settings > Email Auth.
- **CORS issues**: Ensure your site URL is correctly set in the Supabase dashboard.
- **RLS policies**: If you're having trouble accessing data, check that your RLS policies are correctly configured.

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Auth Example](https://github.com/supabase/supabase/tree/master/examples/auth/nextjs) 