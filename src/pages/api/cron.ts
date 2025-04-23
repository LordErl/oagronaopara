import { runDailyTasks } from '../../services/scheduler';

// Endpoint para execução programada via cron job
export async function handleCronRequest(req: Request): Promise<Response> {
  // Verificar método
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Verificar autenticação
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== import.meta.env.VITE_CRON_API_KEY) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const result = await runDailyTasks();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erro no endpoint cron:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Para uso com Vite e frameworks como Express
export default handleCronRequest;
