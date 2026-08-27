-- Bootstrap admin user for the Content CMS.
--
-- INSTRUCTIONS:
-- 1. Create a user in Supabase Auth (Dashboard → Auth → Users → Add User)
--    or have a user sign up via your app.
-- 2. Copy the user's UUID (auth.users.id).
-- 3. Run the INSERT below with that UUID.
-- 4. The user can now log in at /admin with their email/password.
--
-- Alternatively, you can run this from your app's bootstrap endpoint.

INSERT INTO profiles (id, role, display_name)
VALUES ('REPLACE_WITH_ADMIN_USER_UUID', 'admin', 'Admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();
