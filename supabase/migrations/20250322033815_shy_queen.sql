/*
  # Update WhatsApp phone number

  1. Changes
    - Updates the phone number in all relevant places
    - Ensures consistency across the system
*/

-- Update admin user phone number
UPDATE users 
SET phone = '+5563991338936'
WHERE email = 'efs.ceo@oagronaopara.tec.br';

-- Update any existing WhatsApp logs with old number
UPDATE whatsapp_logs
SET phone_number = '+5563991338936'
WHERE phone_number = '+5563999535432';