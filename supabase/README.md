# Supabase Database Setup

## Quick Start

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Go to **SQL Editor** in your Supabase dashboard

3. Copy the contents of `schema.sql` and run it

4. Copy your project credentials to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `persons` | User profiles linked to auth.users |
| `weight_logs` | Daily weight tracking |
| `workout_logs` | Workout session logs |
| `workout_exercises` | Weekly exercise schedules |
| `recipes` | Recipe database |
| `meal_plans` | Weekly meal planning |
| `pantry_items` | Pantry inventory |
| `grocery_items` | Shopping lists |

### Row Level Security (RLS)

- **Personal data** (`weight_logs`, `workout_logs`, `workout_exercises`): Users can only access their own records
- **Shared data** (`recipes`, `meal_plans`, `pantry_items`, `grocery_items`): All authenticated users can access (household sharing)

### Auto-created Records

When a user signs up, a `persons` record is automatically created via a database trigger. The name is pulled from:
1. User metadata (if provided during signup)
2. Email prefix (fallback)

## Authentication Settings

In your Supabase dashboard, configure these settings:

### Auth > Providers
- Enable **Email** provider

### Auth > URL Configuration
- **Site URL**: `http://localhost:3000` (development) or your production URL
- **Redirect URLs**: Add your app URLs for auth callbacks

### Auth > Email Templates (Optional)
Customize the confirmation and password reset email templates.

## Troubleshooting

### "Permission denied" errors
- Ensure RLS policies are created correctly
- Check that the user is authenticated
- Verify the anon key is correct

### Person record not created on signup
- Check the `handle_new_user` trigger exists
- The signup API also has a fallback to create the person record
