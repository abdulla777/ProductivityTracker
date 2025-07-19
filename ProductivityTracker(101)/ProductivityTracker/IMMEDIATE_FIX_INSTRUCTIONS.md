# IMMEDIATE FIX - Manual Database Update

Since the pg package isn't available, here's the direct solution:

## Quick Fix (30 seconds)

**Open a terminal and run these commands:**

```bash
# Connect to your PostgreSQL database
psql -U postgres -d productivity_tracker

# Add the missing columns
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS clock_in_time TEXT;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS clock_out_time TEXT;

# Verify the fix worked
\d attendance

# Exit PostgreSQL
\q
```

## What This Does:
- Adds the missing `clock_in_time` column to your attendance table
- Adds the missing `clock_out_time` column to your attendance table
- These are the exact columns causing your HTTP 500 errors

## After Running This:
1. **Restart your application:** `npm run dev`
2. **Test manual attendance registration** - it should work without errors
3. **Dashboard attendance views** should load properly

## Expected Result:
- No more "column clock_in_time does not exist" errors
- Manual attendance form will work properly
- HTTP 201 responses instead of HTTP 500 errors

## If You Get Permission Errors:
Try with sudo or adjust the username:
```bash
sudo -u postgres psql -d productivity_tracker
```

This fix takes 30 seconds and will immediately resolve your attendance registration issues.