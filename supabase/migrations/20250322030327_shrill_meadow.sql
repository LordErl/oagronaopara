/*
  # Update admin phone number

  1. Changes
    - Updates the phone number for the admin user
    
  2. Security
    - Only updates the specific admin user
    - Maintains all other data
*/

UPDATE users 
SET phone = '+5563991338936'
WHERE email = 'efs.ceo@oagronaopara.tec.br';