-- Fix for "Database error saving new user"
-- The issue is that the `username` column has a unique constraint and defaults to empty string ''.
-- This causes a collision when a second user signs up.

-- 1. Alter the column to drop the default value (so it defaults to NULL)
ALTER TABLE public.profiles ALTER COLUMN username DROP DEFAULT;

-- 2. (Optional) If you want to allow multiple empty strings, you'd need to drop the constraint,
-- but standard practice for "not set" is NULL. Multiple NULLs are allowed in unique columns.

-- 3. If there are existing rows with empty string '' that collide, you might need to fix them manually.
-- This query sets empty string usernames to NULL:
UPDATE public.profiles SET username = NULL WHERE username = '';

-- 4. Ensure the column is nullable (it should be by default unless NOT NULL was set)
ALTER TABLE public.profiles ALTER COLUMN username DROP NOT NULL;
