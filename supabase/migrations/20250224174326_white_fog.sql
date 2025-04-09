/*
  # Add initial contract template

  1. New Data
    - Adds a default contract template with variable placeholders
    - Template includes: NOME_COMPLETO, CPF, PASSAPORTE, EMAIL, DATA_ATUAL
  
  2. Changes
    - Inserts initial template into contract_templates table
*/

INSERT INTO contract_templates (name, content, is_active)
VALUES (
  'Template Padrão de Contrato',
  E'CONTRATO DE PARCERIA COMERCIAL\n\n' ||
  E'Pelo presente instrumento particular, de um lado:\n\n' ||
  E'NOME_COMPLETO, portador do Passaporte nº PASSAPORTE, residente e domiciliado no endereço cadastrado em nosso sistema, e-mail: EMAIL, doravante denominado PARCEIRO;\n\n' ||
  E'E de outro lado:\n\n' ||
  E'O AGRO NÃO PARA TECNOLOGIA LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº XX.XXX.XXX/0001-XX, com sede na [ENDEREÇO COMPLETO], doravante denominada EMPRESA;\n\n' ||
  E'Têm entre si justo e acordado o presente Contrato de Parceria Comercial, que se regerá pelas seguintes cláusulas e condições:\n\n' ||
  E'1. OBJETO\n' ||
  E'1.1. O presente contrato tem por objeto estabelecer as condições gerais para a parceria comercial entre as partes.\n\n' ||
  E'[CONTEÚDO COMPLETO DO CONTRATO...]\n\n' ||
  E'Local e Data: DATA_ATUAL\n\n' ||
  E'_____________________________\n' ||
  E'NOME_COMPLETO\n' ||
  E'Passaporte: PASSAPORTE\n\n' ||
  E'_____________________________\n' ||
  E'O AGRO NÃO PARA TECNOLOGIA LTDA\n' ||
  E'CNPJ: XX.XXX.XXX/0001-XX\n\n' ||
  E'[ESPAÇO PARA IMAGEM DO PASSAPORTE]'
  ,
  true
);