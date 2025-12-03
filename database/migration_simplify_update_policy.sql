-- Simplify Update Policy to Debug Recursion
-- Temporarily remove the Admin check to see if it resolves the hanging issue.
-- This policy strictly allows users to update ONLY their own rows.

DROP POLICY IF EXISTS "Update Users Policy" ON public.users;

CREATE POLICY "Update Users Policy" ON public.users
FOR UPDATE USING (
  auth.uid() = id
);
