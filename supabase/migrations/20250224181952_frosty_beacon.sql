/*
  # Add CPF field to users table

  1. Changes
    - Add CPF column to users table
    - Make CPF unique and not null
    - Add index for faster lookups

  2. Notes
    - CPF is stored without mask (only numbers)
    - Unique constraint prevents duplicate CPFs
*/

-- Add CPF column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf text;

-- Make CPF required and unique
ALTER TABLE users 
  ALTER COLUMN cpf SET NOT NULL,
  ADD CONSTRAINT users_cpf_unique UNIQUE (cpf);

-- Add index for CPF lookups
CREATE INDEX IF NOT EXISTS users_cpf_idx ON users (cpf);

-- Add comment explaining CPF format
COMMENT ON COLUMN users.cpf IS 'CPF number without mask (only numbers)';