CREATE OR REPLACE FUNCTION prevent_ledger_update_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger lines are insert-only. Update or delete operations are prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_ledger_update_delete_trigger
BEFORE UPDATE OR DELETE ON ledger_lines
FOR EACH ROW
EXECUTE FUNCTION prevent_ledger_update_delete();