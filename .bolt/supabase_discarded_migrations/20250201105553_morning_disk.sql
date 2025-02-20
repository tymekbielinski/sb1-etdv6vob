-- Start transaction
BEGIN;

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created_setup ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_setup();

-- Add a note in case we need to rollback
COMMENT ON FUNCTION handle_new_user() IS 'Handles new user creation and team setup. Replaces handle_new_user_setup()';

COMMIT;