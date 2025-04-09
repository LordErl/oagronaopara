-- Enable email confirmations in auth.config
UPDATE auth.config 
SET enable_signup_email_verification = true;

-- Create email template for confirmation
INSERT INTO auth.mfa_factors (
  factor_type,
  status,
  friendly_name,
  secret,
  created_at,
  updated_at,
  factor_id
) VALUES (
  'email',
  'verified',
  'Email Confirmation',
  'email_confirmation',
  now(),
  now(),
  gen_random_uuid()
);

-- Set email template content
INSERT INTO auth.mfa_challenges (
  factor_id,
  created_at,
  verified_at,
  ip_address,
  user_agent
) 
SELECT 
  id as factor_id,
  now() as created_at,
  now() as verified_at,
  '127.0.0.1' as ip_address,
  'System' as user_agent
FROM auth.mfa_factors 
WHERE secret = 'email_confirmation'
LIMIT 1;

-- Update email settings
UPDATE auth.config SET
  mailer_autoconfirm = false,
  mailer_secure_email_change_enabled = true,
  smtp_admin_email = 'efs.ceo@oagronaopara.tec.br',
  smtp_max_frequency = 60,
  smtp_sender_name = 'O Agro Não Para',
  smtp_template_forgot_password = '
    <h2>Redefinir Senha</h2>
    <p>Clique no link abaixo para redefinir sua senha:</p>
    <p><a href="{{ .ConfirmationURL }}">Redefinir Senha</a></p>
  ',
  smtp_template_invite = '
    <h2>Convite para O Agro Não Para</h2>
    <p>Você foi convidado para se juntar à plataforma. Clique no link abaixo para aceitar:</p>
    <p><a href="{{ .ConfirmationURL }}">Aceitar Convite</a></p>
  ',
  smtp_template_magic_link = '
    <h2>Link de Acesso</h2>
    <p>Clique no link abaixo para acessar sua conta:</p>
    <p><a href="{{ .ConfirmationURL }}">Acessar Conta</a></p>
  ',
  smtp_template_email_change = '
    <h2>Confirmar Alteração de Email</h2>
    <p>Clique no link abaixo para confirmar a alteração do seu email:</p>
    <p><a href="{{ .ConfirmationURL }}">Confirmar Alteração</a></p>
  ',
  smtp_template_confirmation = '
    <h2>Bem-vindo ao O Agro Não Para!</h2>
    <p>Obrigado por se cadastrar. Para confirmar seu email e ativar sua conta, clique no link abaixo:</p>
    <p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>
    <p>Se você não se cadastrou em nossa plataforma, por favor ignore este email.</p>
  ';