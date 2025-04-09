// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Ajuste para produção, se necessário
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Trata requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Apenas permitir POST para envio de email
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  try {
    const { to, subject, html, attachments } = await req.json();
    console.log("Dados recebidos:", { to, subject, html, attachmentsLength: attachments?.length });

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const recipients = typeof to === "string" ? to.split(",").map(email => email.trim()) : [to];
    console.log("Destinatários processados:", recipients);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Chave API da Resend não configurada.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@oagronaopara.tec.br",
        to: recipients,
        subject: subject,
        html: html,
        attachments: attachments || [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro ao enviar email via Resend: ${errorData.message}`);
    }

    console.log("Email enviado com sucesso via Resend");

    // Registrar sucesso no email_logs
    await supabase.from('email_logs').insert([{
      recipient: to,
      subject: subject,
      sent_at: new Date().toISOString(),
      success: true,
    }]);

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado com sucesso" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao enviar email:", error);

    // Registrar falha no email_logs
    const body = await req.json().catch(() => ({}));
    await supabase.from('email_logs').insert([{
      recipient: body.to || 'unknown',
      subject: body.subject || 'unknown',
      sent_at: new Date().toISOString(),
      success: false,
      error_message: error.message || "Erro desconhecido",
    }]);

    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});