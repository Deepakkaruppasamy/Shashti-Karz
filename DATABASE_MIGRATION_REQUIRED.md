# 🚨 URGENT: Database Migration Required

## Error You're Seeing
```
Error: null value in column "name" of relation "user_vehicles" violates not-null constraint
```

## What Happened
The TypeScript code expects a `name` field in the `user_vehicles` table, but your database doesn't have this column yet. This is causing the 500 error when trying to add a vehicle.

## Quick Fix (Choose ONE option)

### ⚡ Option 1: Run Migration (RECOMMENDED)
This will add all missing columns and initialize missing features without losing data.

**Steps:**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. **Vehicle Fix**: Run `sql/migrations/add_missing_vehicle_columns.sql`
4. **Garage Fix**: Run `sql/migrations/fix_garage_health_score.sql`
5. **Showroom Fix**: Run `sql/community_showroom.sql` (Creates the social tables)
6. **Showroom Demo Data**: Run `sql/migrations/seed_showroom_data.sql` (Fixes "Empty Contest" and "Empty Leaderboard")
7. Refresh your browser and try the features again!

### 🔄 Option 2: Recreate Table (If you have no data)
If you haven't added any vehicles yet and don't mind starting fresh:

**Steps:**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this command first to drop the old table:
   ```sql
   DROP TABLE IF EXISTS public.user_vehicles CASCADE;
   ```
4. Then copy and paste the contents of: `sql/user_vehicles_table.sql`
5. Click **Run**
6. Refresh your browser and try adding a vehicle again

---

## What the Migration Does

The migration adds these missing columns:
- ✅ `name` - Custom name for the vehicle (e.g., "My BMW")
- ✅ `car_type` - Type of car (sedan, suv, hatchback, etc.)
- ✅ `last_service_at` - Timestamp of last service
- ✅ `next_service_at` - Timestamp for next scheduled service
- ✅ `image_url` - URL for vehicle image
- ✅ `fleet_id` - For fleet management features
- ✅ Updates `fuel_type` to include 'cng' option

**For existing vehicles:** The migration automatically generates names using the format "Brand Model" (e.g., "BMW M4").

---

## After Running the Migration

1. **Refresh your browser** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. Go to `/ai-diagnostic`
3. Try adding a vehicle with all the fields filled in
4. Upload a diagnostic image
5. Save the results

Everything should work perfectly! ✨

---

## Storage Bucket Setup (Also Required)

Don't forget to also run the storage buckets SQL to enable image uploads:

**Steps:**
1. In Supabase SQL Editor
2. Copy and paste: `sql/storage_buckets.sql`
3. Click **Run**

This creates the `vehicle-images` bucket for diagnostic image uploads.

---

## Need Help?

If you still see errors after running the migration:
1. Check the browser console for the exact error message
2. Check the Supabase logs in your dashboard
3. Make sure you're logged in when testing
4. Try logging out and back in

The migration is safe to run multiple times - it won't duplicate columns or lose data.
