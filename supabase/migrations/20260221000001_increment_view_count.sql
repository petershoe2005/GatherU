CREATE OR REPLACE FUNCTION increment_view_count(item_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE items SET view_count = COALESCE(view_count, 0) + 1 WHERE id = item_id;
$$;
