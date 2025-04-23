# O Agro Não Para

Plataforma de marketplace agrícola com notícias, cotações e gerenciamento de contratos.

## Funcionalidades

- Sistema de usuários e autenticação
- Revisão e gestão de contratos
- Marketplace de ofertas agrícolas
- Painel administrativo
- Notícias agrícolas com automação via ChatGPT
- Cotações de commodities com análise de mercado automática
- Suporte a múltiplos idiomas

## Configuração do Ambiente de Desenvolvimento

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_OPENAI_API_KEY=sua_chave_api_do_openai
VITE_CRON_API_KEY=chave_secreta_para_cron
```

4. Execute o projeto em modo de desenvolvimento:

```bash
npm run dev
```

## Implantação no Vercel com Domínio Personalizado

### Pré-requisitos

- Conta no Vercel
- Domínio oagronaopara.tec.br registrado e com acesso ao gerenciamento de DNS

### Passos para Implantação

1. **Configurar o projeto no Vercel**:
   - Conecte seu repositório GitHub ao Vercel
   - Importe o projeto

2. **Configurar variáveis de ambiente**:
   - No painel do Vercel, vá para "Settings" > "Environment Variables"
   - Adicione as seguintes variáveis:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_OPENAI_API_KEY`
     - `VITE_CRON_API_KEY`

3. **Configurar o domínio personalizado**:
   - No painel do Vercel, vá para "Domains"
   - Adicione o domínio `oagronaopara.tec.br`
   - Siga as instruções para configurar os registros DNS:
     - Adicione um registro A apontando para os IPs do Vercel
     - Adicione um registro CNAME para o subdomínio www

4. **Verificar a configuração de CRON**:
   - O arquivo `vercel.json` já está configurado para executar tarefas diárias
   - Verifique se o Vercel Cron está habilitado no seu plano

## Recursos Automatizados

### Automação de Notícias

O sistema utiliza a API do ChatGPT para automaticamente:
- Buscar notícias de fontes agrícolas confiáveis
- Processar e resumir o conteúdo
- Traduzir notícias internacionais quando necessário
- Publicar diariamente novas notícias

### Análise de Mercado

O sistema gera automaticamente:
- Análises de tendências de mercado baseadas nas cotações
- Previsões de curto prazo para commodities
- Recomendações para produtores

## Banco de Dados

O projeto utiliza o Supabase como banco de dados. As seguintes tabelas são necessárias:

- `agro_news`: Armazena notícias agrícolas
- `commodity_quotes`: Armazena cotações de commodities
- `quote_analyses`: Armazena análises de mercado geradas

## Manutenção

Para manter o sistema funcionando corretamente:

1. Monitore o uso da API do OpenAI para evitar exceder limites
2. Verifique regularmente os logs de execução do cron job
3. Atualize as fontes de notícias conforme necessário

## Licença

Todos os direitos reservados.
