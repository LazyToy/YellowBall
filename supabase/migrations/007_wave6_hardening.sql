CREATE OR REPLACE FUNCTION prevent_super_admin_account_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'super_admin' AND NEW.status = 'deleted_pending' THEN
    RAISE EXCEPTION 'super_admin cannot request account deletion';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_super_admin_account_deletion_trigger ON profiles;

CREATE TRIGGER prevent_super_admin_account_deletion_trigger
  BEFORE UPDATE OF status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_super_admin_account_deletion();
