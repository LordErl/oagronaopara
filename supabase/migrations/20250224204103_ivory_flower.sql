-- Create initial contract template
INSERT INTO contract_templates (name, content, is_active)
VALUES (
  'Template Padrão de Contrato',
  'CONTRATO DE PARCERIA COMERCIAL

Pelo presente instrumento particular, de um lado:

NOME_COMPLETO, portador do Passaporte nº PASSAPORTE, residente e domiciliado no endereço cadastrado em nosso sistema, e-mail: EMAIL, doravante denominado PARCEIRO;

E de outro lado:

O AGRO NÃO PARA TECNOLOGIA LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº XX.XXX.XXX/0001-XX, com sede na [ENDEREÇO COMPLETO], doravante denominada EMPRESA;

Têm entre si justo e acordado o presente Contrato de Parceria Comercial, que se regerá pelas seguintes cláusulas e condições:

1. OBJETO
1.1. O presente contrato tem por objeto estabelecer as condições gerais para a parceria comercial entre as partes.

[CONTEÚDO COMPLETO DO CONTRATO...]

Local e Data: DATA_ATUAL

_____________________________
NOME_COMPLETO
Passaporte: PASSAPORTE

_____________________________
O AGRO NÃO PARA TECNOLOGIA LTDA
CNPJ: XX.XXX.XXX/0001-XX

[ESPAÇO PARA IMAGEM DO PASSAPORTE]',
  true
);