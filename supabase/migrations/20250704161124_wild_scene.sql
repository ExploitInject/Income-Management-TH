/*
  Setup for `work_entries` table in Supabase/PostgreSQL

  1. Table Creation
    - Fields: id, user_id, date, category, description, amount, currency, created_at, updated_at, payment_status
    - Foreign key to auth.users
    - Default values for created_at, updated_at, and payment_status

  2. Row Level Security (RLS)
    - Enable RLS
    - Policies for SELECT, INSERT, UPDATE, DELETE (only allow own data)

  3. Indexes
    - Index on user_id
    - Index on date DESC
    - Composite index on user_id + date DESC
    - Indexes on payment_status

  4. Triggers
    - update `updated_at` on every row update

  5. Constraints
    - Valid `payment_status` values (paid, unpaid)
*/

-- STEP 1: Create the work_entries table
CREATE TABLE IF NOT EXISTS work_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  payment_status text DEFAULT 'unpaid' NOT NULL
);

-- STEP 2: Enable Row Level Security
ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create RLS policies
CREATE POLICY "Users can view their own work entries"
  ON work_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work entries"
  ON work_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work entries"
  ON work_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work entries"
  ON work_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- STEP 4: Add indexes
CREATE INDEX IF NOT EXISTS idx_work_entries_user_id ON work_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_work_entries_date ON work_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_work_entries_user_date ON work_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_work_entries_payment_status ON work_entries(payment_status);
CREATE INDEX IF NOT EXISTS idx_work_entries_user_payment_status ON work_entries(user_id, payment_status);

-- STEP 5: Add check constraint for payment_status
ALTER TABLE work_entries
  ADD CONSTRAINT IF NOT EXISTS work_entries_payment_status_check
  CHECK (payment_status IN ('paid', 'unpaid'));

-- STEP 6: Create function and trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_work_entries_updated_at
  BEFORE UPDATE ON work_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
