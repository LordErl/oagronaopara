-- Insert default contract template
INSERT INTO contract_templates (name, content, is_active)
VALUES (
  'Template Padrão de Contrato',
  $contract_content$CONTRATO DE PARCERIA COMERCIAL

Pelo presente instrumento particular, de um lado:

[NOME_COMPLETO], portador do CPF nº [CPF] e Passaporte nº [PASSAPORTE], residente e domiciliado no endereço cadastrado em nosso sistema, e-mail: [EMAIL], doravante denominado PARCEIRO;

E de outro lado:

O AGRO NÃO PARA TECNOLOGIA LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº XX.XXX.XXX/0001-XX, com sede na Avenida Tocantins, 1000, Palmas/TO, doravante denominada EMPRESA;

Têm entre si justo e acordado o presente Contrato de Parceria Comercial, que se regerá pelas seguintes cláusulas e condições:

1. OBJETO
1.1. O presente contrato tem por objeto estabelecer as condições gerais para a parceria comercial entre as partes.
1.2. O PARCEIRO compromete-se a manter sigilo sobre todas as informações comerciais obtidas através da plataforma.

2. CONFIDENCIALIDADE
2.1. As partes se comprometem a manter em sigilo todas as informações confidenciais a que tiverem acesso.
2.2. São consideradas informações confidenciais todas aquelas obtidas através da plataforma, incluindo, mas não se limitando a: preços, volumes, condições comerciais, dados de contato e estratégias de negócio.

3. NÃO CIRCUNVENÇÃO
3.1. O PARCEIRO compromete-se a não circunvencionar a EMPRESA em nenhuma negociação iniciada através da plataforma.
3.2. Entende-se por circunvenção qualquer tentativa de contato direto com outros parceiros da plataforma sem a intermediação da EMPRESA.

4. VIGÊNCIA
4.1. O presente contrato tem vigência de 24 (vinte e quatro) meses a partir da data de sua assinatura.
4.2. Após este período, o contrato será renovado automaticamente por períodos iguais e sucessivos, salvo manifestação contrária de qualquer das partes.

5. PENALIDADES
5.1. O descumprimento de qualquer cláusula deste contrato implicará em multa equivalente a USD 50.000,00 (cinquenta mil dólares americanos), sem prejuízo de outras medidas legais cabíveis.

6. FORO
6.1. As partes elegem o foro da Comarca de Palmas/TO para dirimir quaisquer dúvidas oriundas do presente contrato.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.

Local e Data: [DATA_ATUAL]

_____________________________
[NOME_COMPLETO]
CPF: [CPF]
Passaporte: [PASSAPORTE]

_____________________________
O AGRO NÃO PARA TECNOLOGIA LTDA
CNPJ: XX.XXX.XXX/0001-XX

[ESPAÇO PARA IMAGEM DO PASSAPORTE]$contract_content$,
  true
) ON CONFLICT DO NOTHING;