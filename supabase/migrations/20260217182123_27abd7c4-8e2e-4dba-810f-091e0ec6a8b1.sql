-- Enable leaked password protection (HaveIBeenPwned)
-- This is handled via auth config, not a migration.
-- Using a no-op migration as placeholder since the actual change is via configure-auth.
SELECT 1;
