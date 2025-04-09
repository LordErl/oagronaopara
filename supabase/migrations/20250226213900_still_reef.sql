-- Create a scheduled job to run the function daily with fixed syntax
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'delete-expired-offers',
      '0 0 * * *',  -- Run at midnight every day
      'SELECT auto_delete_expired_offers()'
    );
  END IF;
END $$;