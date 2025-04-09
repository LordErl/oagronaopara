-- Increase email rate limit in auth config
UPDATE auth.config 
SET smtp_max_frequency = 300; -- 5 minutes between emails

-- Add rate limit table
CREATE TABLE IF NOT EXISTS email_rate_limits (
  email text PRIMARY KEY,
  last_sent timestamptz,
  attempts integer DEFAULT 0
);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION check_email_rate_limit(p_email text)
RETURNS boolean AS $$
BEGIN
  -- Clean up old entries
  DELETE FROM email_rate_limits
  WHERE last_sent < now() - interval '1 hour';
  
  -- Check and update rate limit
  INSERT INTO email_rate_limits (email, last_sent, attempts)
  VALUES (p_email, now(), 1)
  ON CONFLICT (email) DO UPDATE
  SET last_sent = now(),
      attempts = email_rate_limits.attempts + 1
  WHERE email_rate_limits.last_sent < now() - interval '5 minutes'
     OR email_rate_limits.attempts < 3;
     
  RETURN EXISTS (
    SELECT 1 FROM email_rate_limits
    WHERE email = p_email
    AND (last_sent < now() - interval '5 minutes' OR attempts < 3)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;