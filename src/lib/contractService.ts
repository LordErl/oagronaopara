import { supabase } from './supabase';
import { User } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import DOMPurify from 'dompurify';
import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_hok2686';
const EMAILJS_TEMPLATE_ID = 'template_a67ihw4';
const EMAILJS_PUBLIC_KEY = 'xbNCmHLX22Y1hXFba';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// Adicione um log para debug
function debugLog(message: string, data?: any) {
  console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Upload contract to Supabase Storage
async function uploadContractToStorage(pdfBlob: Blob, userId: string): Promise<string> {
  const fileName = `${userId}_${new Date().getTime()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('contracts')
    .upload(`contracts/${fileName}`, pdfBlob, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  // Generate signed URL that expires in 7 days
  const { data: urlData, error: urlError } = await supabase.storage
    .from('contracts')
    .createSignedUrl(`contracts/${fileName}`, 7 * 24 * 60 * 60); // 7 days in seconds

  if (urlError) throw urlError;
  if (!urlData?.signedUrl) throw new Error('Falha ao gerar URL assinada');
  
  return urlData.signedUrl;
}

export async function sendContractEmail(user: User, contractContent: string, complianceEmail: string = '') {
  try {
    // Validate user email
    if (!user.email || !isValidEmail(user.email)) {
      throw new Error('Email do usuário inválido ou não fornecido');
    }

    debugLog('Iniciando envio para usuário', { email: user.email });

    // Format recipients list
    const recipients = [user.email];
    if (complianceEmail && isValidEmail(complianceEmail)) {
      recipients.push(complianceEmail);
    }

    debugLog('Lista de destinatários', recipients);

    // Generate PDF
    const pdfBlob = await generatePdfContract(user, contractContent);
    
    // Upload to Supabase Storage and get signed URL
    const contractUrl = await uploadContractToStorage(pdfBlob, user.id);
    
    debugLog('URL do contrato gerada', contractUrl);

    // Prepare email template content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #166534;">Contrato NCNDA</h1>
        
        <p>Olá ${user.name},</p>
        
        <p>Seu contrato NCNDA foi gerado com sucesso.</p>
        
        <p><strong>Próximos passos:</strong></p>
        <ol>
          <li>Faça o download do seu contrato através do link abaixo</li>
          <li>Assine digitalmente o documento</li>
          <li>Envie o contrato assinado para ${complianceEmail || 'compliance@oagronaopara.tec.br'}</li>
        </ol>
        
        <p><a href="${contractUrl}" style="display: inline-block; background-color: #166534; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Download do Contrato</a></p>
        
        <p><strong>Importante:</strong></p>
        <ul>
          <li>Este link expira em 7 dias</li>
          <li>Seu cadastro será ativado após recebermos o contrato assinado</li>
        </ul>
        
        <p style="margin-top: 20px; color: #666;">
          Atenciosamente,<br>
          Equipe O Agro Não Para
        </p>
      </div>
    `;

    // Para cada destinatário, enviar email individualmente
    const emails = recipients.map(async (recipient) => {
      // Adicione os parâmetros exatamente como aparecem no template
      const templateParams = {
        // Variáveis principais que o template espera
        email: recipient,               // Enviar para cada destinatário individualmente
        name: recipient === user.email ? user.name : 'Equipe de Compliance',  // Ajustar nome com base no destinatário
        
        // Link do contrato - adicionando múltiplas variações para garantir que o template utilize
        link: contractUrl,
        url: contractUrl,
        contract_url: contractUrl,
        contractUrl: contractUrl,
        download_link: contractUrl,
        downloadLink: contractUrl,
        
        // Logo da empresa
        logo_url: 'https://ppuhqfxgyovbiyfpkyfm.supabase.co/storage/v1/object/public/public/logo.png',
        
        // Outras variáveis de suporte
        from_name: 'O Agro Não Para',
        subject: 'Contrato NCNDA de Parceria - O Agro Não Para',
        message: emailContent,
      };

      debugLog('Parâmetros do template para', recipient);

      // Send email através do EmailJS
      return emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );
    });

    // Aguardar todos os emails serem enviados
    const responses = await Promise.all(emails);
    debugLog('Resposta do EmailJS', responses);

    if (responses.some(response => response.status !== 200)) {
      throw new Error('Falha ao enviar email');
    }

    // Save contract URL and log success
    await Promise.all([
      // Update contract URL in database
      supabase
        .from('contracts')
        .update({ contract_url: contractUrl })
        .eq('user_id', user.id),
      
      // Log email success
      supabase
        .from('email_logs')
        .insert([{
          recipient: user.email,
          subject: 'Contrato NCNDA de Parceria - O Agro Não Para',
          success: true,
          sent_at: new Date().toISOString(),
          contract_url: contractUrl
        }])
    ]);

    return { success: true, contractUrl };
  } catch (error: any) {
    console.error('Error sending contract:', error);
    
    // Log email failure
    await supabase
      .from('email_logs')
      .insert([{
        recipient: user.email,
        subject: 'Contrato NCNDA de Parceria - O Agro Não Para',
        success: false,
        error_message: error.message,
        sent_at: new Date().toISOString()
      }]);

    throw error;
  }
}

export async function generatePdfContract(user: User, contractContent: string): Promise<Blob> {
  try {
    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });

    // Set font
    pdf.setFont("helvetica");
    
    // Add logo/header
    pdf.setFillColor(34, 197, 94);
    pdf.rect(0, 0, 210, 20, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text('O AGRO NÃO PARA', 20, 14);

    // Add watermark
    pdf.setTextColor(34, 197, 94, 0.05);
    pdf.setFontSize(60);
    pdf.text('O AGRO NÃO PARA', 105, 148.5, { align: 'center', angle: 45 });

    // Reset text color and size for content
    pdf.setTextColor(51, 51, 51);
    pdf.setFontSize(12);

    // Format contract content
    const cleanContent = DOMPurify.sanitize(contractContent, { ALLOWED_TAGS: [] })
      .replace(/\[NOME_COMPLETO\]/g, user.name)
      .replace(/\[CPF\]/g, user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'))
      .replace(/\[PASSAPORTE\]/g, user.passport_number)
      .replace(/\[EMAIL\]/g, user.email)
      .replace(/\[DATA_ATUAL\]/g, format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR }))
      .replace(/&nbsp;/g, '\n')
      .replace(/\n\s*\n/g, '\n\n');

    // Split content into lines that fit the page width
    const lines = cleanContent.split('\n').reduce((acc: string[], line) => {
      const wrappedLines = pdf.splitTextToSize(line.trim(), 170);
      return [...acc, ...wrappedLines, ''];
    }, []);

    // Add content with proper margins
    let y = 30;
    const lineHeight = 7;

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].trim()) {
        y += lineHeight / 2;
        continue;
      }

      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      
      if (lines[i].match(/^\d+\.\s/)) {
        pdf.setFont("helvetica", "bold");
        y += 5;
      } else {
        pdf.setFont("helvetica", "normal");
      }
      
      pdf.text(lines[i].trim(), 20, y);
      y += lineHeight;
    }

    // Add signature lines
    y += 10;
    if (y > 240) {
      pdf.addPage();
      y = 40;
    }

    pdf.line(20, y, 90, y);
    pdf.text(user.name, 20, y + 5);
    pdf.text(`CPF: ${user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`, 20, y + 10);
    pdf.text(`Passaporte: ${user.passport_number}`, 20, y + 15);

    pdf.line(120, y, 190, y);
    pdf.text('O AGRO NÃO PARA TECNOLOGIA LTDA', 120, y + 5);
    pdf.text('CNPJ: XX.XXX.XXX/0001-XX', 120, y + 10);

    // Add passport images if available
    if (user.passport_url) {
      try {
        const response = await fetch(user.passport_url);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        pdf.addPage();
        pdf.text('Passaporte do Parceiro:', 20, 30);
        pdf.addImage(base64, 'JPEG', 20, 40, 170, 100, undefined, 'FAST');
      } catch (err) {
        console.error('Error adding partner passport image:', err);
      }
    }

    // Add admin passport if available
    try {
      console.log('Buscando passaporte do administrador...');
      
      const { data: admins, error: adminsError } = await supabase
        .from('users')
        .select('email, passport_url, name')
        .eq('is_admin', true);
      
      console.log('Administradores encontrados:', admins);
      
      if (adminsError) {
        console.error('Erro ao buscar administradores:', adminsError);
        throw adminsError;
      }
      
      console.log('O template contém o marcador [ESPAÇO PARA IMAGEM DO PASSAPORTE_AGRO]?', 
                 contractContent.includes('[ESPAÇO PARA IMAGEM DO PASSAPORTE_AGRO]'));
      
      const adminWithPassport = admins?.find(admin => admin.passport_url);
      
      if (adminWithPassport) {
        console.log('Administrador com passaporte encontrado:', adminWithPassport.email);
        contractContent = contractContent.replace(
          '[ESPAÇO PARA IMAGEM DO PASSAPORTE_AGRO]',
          `<div class="passport-image">
            <p class="passport-title">Passaporte do Administrador (${adminWithPassport.name}):</p>
            <img src="${adminWithPassport.passport_url}" alt="Passaporte do Administrador" crossorigin="anonymous"/>
          </div>`
        );
      } else {
        console.log('Nenhum administrador com passaporte encontrado');
        contractContent = contractContent.replace(
          '[ESPAÇO PARA IMAGEM DO PASSAPORTE_AGRO]',
          `<div class="missing-passport">
            <p>Imagem do passaporte do administrador não disponível</p>
          </div>`
        );
      }
    } catch (adminError) {
      console.error('Error fetching admin passport:', adminError);
      contractContent = contractContent.replace(
        '[ESPAÇO PARA IMAGEM DO PASSAPORTE_AGRO]',
        `<div class="missing-passport">
          <p>Imagem do passaporte do administrador não disponível</p>
        </div>`
      );
    }

    return pdf.output('blob');
  } catch (error: any) {
    console.error('Error generating PDF contract:', error);
    throw new Error(`Falha ao gerar PDF do contrato: ${error.message}`);
  }
}

export async function generateContract(user: User): Promise<string> {
  try {
    // Get active contract template
    const { data: templates, error: templateError } = await supabase
      .from('contract_templates')
      .select('content')
      .eq('is_active', true)
      .single();

    if (templateError) throw templateError;
    if (!templates) throw new Error('Nenhum modelo de contrato ativo encontrado');

    // Format CPF with mask for display
    const formattedCpf = user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

    // Replace variables in the template
    let contractContent = templates.content
      .replace(/\[NOME_COMPLETO\]/g, user.name)
      .replace(/\[CPF\]/g, formattedCpf)
      .replace(/\[PASSAPORTE\]/g, user.passport_number)
      .replace(/\[EMAIL\]/g, user.email)
      .replace(/\[DATA_ATUAL\]/g, format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR }));

    // Add partner's passport image if available
    if (user.passport_url) {
      contractContent = contractContent.replace(
        '[ESPAÇO PARA IMAGEM DO PASSAPORTE_PARCEIRO]',
        `<div style="text-align: center; margin: 20px 0;">
          <p style="font-weight: bold; margin-bottom: 10px;">Passaporte do Parceiro:</p>
          <img src="${user.passport_url}" alt="Passaporte do Parceiro" style="max-width: 100%; height: auto; max-height: 300px; border: 1px solid #ccc; padding: 5px;" crossorigin="anonymous"/>
        </div>`
      );
    } else {
      contractContent = contractContent.replace(
        '[ESPAÇO PARA IMAGEM DO PASSAPORTE_PARCEIRO]',
        `<div style="text-align: center; border: 1px dashed #ccc; padding: 20px; margin: 20px 0;">
          <p>Imagem do passaporte do parceiro não disponível</p>
        </div>`
      );
    }

    // Get admin passport image
    try {
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('passport_url')
        .eq('email', 'efs.ceo@oagronaopara.tec.br')
        .single();

      if (adminError) throw adminError;

      if (adminData && adminData.passport_url) {
        contractContent = contractContent.replace(
          '[ESPAÇO PARA IMAGEM DO PASSAPORTE_AGRO]',
          `<div style="text-align: center; margin: 20px 0;">
            <p style="font-weight: bold; margin-bottom: 10px;">Passaporte do Administrador:</p>
            <img src="${adminData.passport_url}" alt="Passaporte do Administrador" style="max-width: 100%; height: auto; max-height: 300px; border: 1px solid #ccc; padding: 5px;" crossorigin="anonymous"/>
          </div>`
        );
      } else {
        contractContent = contractContent.replace(
          '[ESPAÇO PARA IMAGEM DO PASSAPORTE_AGRO]',
          `<div style="text-align: center; border: 1px dashed #ccc; padding: 20px; margin: 20px 0;">
            <p>Imagem do passaporte do administrador não disponível</p>
          </div>`
        );
      }
    } catch (adminError) {
      console.error('Error fetching admin passport:', adminError);
      contractContent = contractContent.replace(
        '[ESPAÇO PARA IMAGEM DO PASSAPORTE_AGRO]',
        `<div style="text-align: center; border: 1px dashed #ccc; padding: 20px; margin: 20px 0;">
          <p>Imagem do passaporte do administrador não disponível</p>
        </div>`
      );
    }

    return contractContent;
  } catch (error: any) {
    console.error('Error generating contract:', error);
    throw new Error(`Falha ao gerar contrato: ${error.message}`);
  }
}

export async function resendConfirmationEmail(userId: string) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;
    if (!user) throw new Error('Usuário não encontrado');

    // Generate contract content
    const contractContent = await generateContract(user);

    // Send email with contract
    await sendContractEmail(user, contractContent, 'compliance@oagronaopara.tec.br');

    return true;
  } catch (error: any) {
    console.error('Error resending confirmation:', error);
    throw new Error(`Falha ao reenviar confirmação: ${error.message}`);
  }
}