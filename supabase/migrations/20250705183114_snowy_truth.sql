/*
  # Create work_entries table with proper schema

  1. New Tables
    - `work_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `date` (date)
      - `category` (text)
      - `description` (text)
      - `amount` (numeric)
      - `currency` (text)
      - `payment_status` (text, default 'unpaid')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `work_entries` table
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Performance indexes on user_id, date, and payment_status

  4. Triggers
    - Auto-update updated_at timestamp
*/

-- Drop existing table if it exists (for clean setup)
DROP TABLE IF EXISTS work_entries CASCADE;

-- Create the work_entries table
CREATE TABLE work_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL,
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE work_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create indexes for performance
CREATE INDEX idx_work_entries_user_id ON work_entries(user_id);
CREATE INDEX idx_work_entries_date ON work_entries(date DESC);
CREATE INDEX idx_work_entries_user_date ON work_entries(user_id, date DESC);
CREATE INDEX idx_work_entries_payment_status ON work_entries(payment_status);
CREATE INDEX idx_work_entries_user_payment_status ON work_entries(user_id, payment_status);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_work_entries_updated_at
  BEFORE UPDATE ON work_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();