/*
  # Add CPF field to users table

  1. Changes
    - Add CPF column to users table if it doesn't exist
    - Make CPF required and unique
    - Add index for faster lookups
    - Add comment explaining format

  2. Notes
    - CPF is stored without mask (only numbers)
    - Unique constraint prevents duplicate CPFs
    - Index improves query performance
*/

DO $$ 
BEGIN
  -- Add CPF column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'cpf'
  ) THEN
    ALTER TABLE users ADD COLUMN cpf text;

    -- Make CPF required and unique
    ALTER TABLE users 
      ALTER COLUMN cpf SET NOT NULL,
      ADD CONSTRAINT users_cpf_unique UNIQUE (cpf);

    -- Add index for CPF lookups
    CREATE INDEX IF NOT EXISTS users_cpf_idx ON users (cpf);

    -- Add comment explaining CPF format
    COMMENT ON COLUMN users.cpf IS 'CPF number without mask (only numbers)';
  END IF;
END $$;