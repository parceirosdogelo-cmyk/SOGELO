/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import {
  MOCK_PERFIS,
  MOCK_INVESTIMENTOS,
  MOCK_CLIENTES,
  MOCK_PRODUTOS,
  MOCK_PEDIDOS,
  MOCK_ITENS_PEDIDO,
  MOCK_FLUXO_CAIXA
} from './src/types';

dotenv.config();

const app = express();
app.use(express.json());

const DB_FILE = path.join(process.cwd(), 'db.json');

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading DB file, using fallback defaults', err);
  }

  // Fallback defaults
  const defaultDb = {
    perfis: MOCK_PERFIS,
    investimentos: MOCK_INVESTIMENTOS,
    clientes: MOCK_CLIENTES,
    produtos: MOCK_PRODUTOS,
    pedidos: MOCK_PEDIDOS,
    itensPedido: MOCK_ITENS_PEDIDO,
    fluxoCaixa: MOCK_FLUXO_CAIXA,
    aportes: [
      { id: 'ap-1', socio: 'Mauro', valor: 4000, porcentagem: 10, data: '2026-07-02', descricao: 'Aporte de 10% dos lucros previstos' },
      { id: 'ap-2', socio: 'Wagner', valor: 6000, porcentagem: 15, data: '2026-07-03', descricao: 'Aporte de 15% dos lucros previstos' },
      { id: 'ap-3', socio: 'Marcos', valor: 8000, porcentagem: 20, data: '2026-07-05', descricao: 'Aporte complementar de 20% dos lucros' },
      { id: 'ap-4', socio: 'Mauro', valor: 5000, porcentagem: 12.5, data: '2026-06-15', descricao: 'Aporte mensal de lucros de Junho' },
      { id: 'ap-5', socio: 'Wagner', valor: 4000, porcentagem: 10, data: '2026-06-18', descricao: 'Aporte complementar Junho' }
    ],
    mauroShare: 33.33,
    wagnerShare: 33.33,
    marcosShare: 33.34,
    investimentosCaixa: [
      { id: 'inv-c1', descricao: 'Compra de Câmara Fria Compacta para quiosques', valor: 8500, data: '2026-07-06' },
      { id: 'inv-c2', descricao: 'Aquisição de moldes industriais para gelo em barra', valor: 3200, data: '2026-06-20' }
    ],
    caixaSaldo: 55000,
    simulatedProfitOffset: 120000
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing initial DB file:', err);
  }

  return defaultDb;
}

function writeDb(db: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB file:', err);
    return false;
  }
}

// Data synchronization endpoints
app.get('/api/sync-data', (req, res) => {
  const db = readDb();
  res.json({ success: true, db });
});

app.post('/api/sync-data', (req, res) => {
  const { db } = req.body;
  if (!db) {
    return res.status(400).json({ error: 'Nenhum dado fornecido para sincronização.' });
  }

  const currentDb = readDb();
  const updatedDb = { ...currentDb, ...db };
  
  const success = writeDb(updatedDb);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Erro ao gravar os dados no servidor.' });
  }
});

const PORT = 3000;

// Helper to get Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      console.warn('WARNING: GEMINI_API_KEY not found or is default. Simulated responses will be returned.');
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Route Optimization Endpoint
app.post('/api/optimize-route', async (req, res) => {
  const { orders } = req.body;

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return res.status(400).json({ error: 'Nenhum pedido fornecido para otimização.' });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // Return high-quality mock route optimization response if API Key is missing
    const simulatedSequence = [...orders].sort((a, b) => {
      // Basic deterministic sort to simulate route planning (e.g. Center, Costazul, Jardim Marilea)
      const getPriority = (addr: string) => {
        const lower = addr.toLowerCase();
        if (lower.includes('centro')) return 1;
        if (lower.includes('costazul')) return 2;
        if (lower.includes('jardim mariléa') || lower.includes('jardim marilea')) return 3;
        return 4;
      };
      return getPriority(a.endereco || '') - getPriority(b.endereco || '');
    });

    return res.json({
      success: true,
      optimized: true,
      isSimulated: true,
      sequence: simulatedSequence,
      routeSummary: "Otimização Inteligente Ativa (Simulada para Apresentação):\n\nSaindo da base da Fábrica de Gelo (Rio das Ostras),\na rota mais lógica inicia-se no Centro atendendo o Depósito do Gugu,\nsegue em direção ao bairro Costazul para atender o Quiosque Costazul e o Bar do Marujo,\ne encerra no Jardim Mariléa atendendo o Quiosque do Sol.\n\nEssa ordem reduz o percurso em aproximadamente 4.5 km em comparação a uma entrega aleatória, diminuindo o consumo de diesel da frota Iveco.",
      estimatedDistanceKm: 12.8,
      estimatedTimeMinutes: 35
    });
  }

  try {
    const prompt = `Você é o assistente inteligente de rotas da operação de Distribuição de Gelo de Rio das Ostras - RJ.
O veículo (Iveco ou Fiorino) sai da nossa fábrica na zona industrial de Rio das Ostras.
Otimize a sequência de entregas para os seguintes pedidos ativos:
${orders.map((o, idx) => `ID: ${o.id} | Estabelecimento: ${o.nome_estabelecimento} | Endereço: ${o.endereco} | Status: ${o.status}`).join('\n')}

Seu objetivo é classificar a sequência de entrega mais eficiente (saindo da base) minimizando o tráfego e a distância pelas vias de Rio das Ostras (Centro, Costazul, Jardim Mariléa, Recreio, etc.).

Retorne um JSON contendo os seguintes campos exatamente:
{
  "sequenceIds": ["id1", "id2", "id3"], // array ordenado com os IDs dos pedidos na ordem de entrega otimizada
  "routeSummary": "Um resumo amigável em português explicando o trajeto otimizado, bairros percorridos e por que essa sequência economiza combustível.",
  "estimatedDistanceKm": 12.5, // número estimado de quilômetros total
  "estimatedTimeMinutes": 45 // minutos estimados para a rota completa
}

Retorne APENAS o JSON, sem markdown ou caracteres extras de código.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '';
    const result = JSON.parse(text.trim());

    // Map the returned ordered sequenceIds back to the full order objects
    const orderedOrders = result.sequenceIds.map((id: string) => {
      return orders.find(o => o.id === id);
    }).filter(Boolean);

    res.json({
      success: true,
      optimized: true,
      isSimulated: false,
      sequence: orderedOrders.length > 0 ? orderedOrders : orders,
      routeSummary: result.routeSummary,
      estimatedDistanceKm: result.estimatedDistanceKm || 12.0,
      estimatedTimeMinutes: result.estimatedTimeMinutes || 40
    });
  } catch (error: any) {
    console.error('Erro na otimização de rotas via Gemini:', error);
    res.status(500).json({ error: 'Erro ao processar otimização inteligente de rota.', details: error.message });
  }
});

// 3. Demand Forecasting Endpoint
app.post('/api/forecast-demand', async (req, res) => {
  const { history, context } = req.body;
  const ai = getGeminiClient();

  if (!ai) {
    // High-quality mock response
    const temp = context?.temperature || 28;
    const isHighSeason = temp > 28 || context?.isWeekend || context?.isHoliday;
    
    let productionRecommendation = 1500; // kg
    let reason = "Análise de Clima e Sazonalidade de Rio das Ostras (Simulada):\n\n";

    if (isHighSeason) {
      productionRecommendation = 2800;
      reason += `Com temperatura de ${temp}°C e aproximação de fim de semana/feriado, a demanda em Rio das Ostras (especialmente nas praias de Costazul e Centro) sofrerá um aumento de 85%.\nRecomenda-se elevar a produção para 2.800 kg de gelo cubo e triturado e garantir embalagens adicionais em estoque.`;
    } else {
      reason += `Temperatura amena de ${temp}°C em dia de semana mantém a operação estável. Produção sugerida de 1.500 kg é suficiente para atender a carteira regular sem sobrecarregar a capacidade de estocagem fria.`;
    }

    return res.json({
      success: true,
      isSimulated: true,
      recommendedProductionKg: productionRecommendation,
      analysis: reason,
      growthPercentage: isHighSeason ? 85 : 0,
      weatherAlert: temp >= 32 ? "ALERTA DE CALOR EXTREMO: Praias de Rio das Ostras terão lotação máxima!" : null
    });
  }

  try {
    const prompt = `Você é o analista preditivo de inteligência artificial da Distribuição de Gelo Rio das Ostras - RJ.
Ajude Wagner Teixeira (Master) e os sócios Mauro e Marcos a preverem a demanda de produção de gelo para os próximos dias.

Contexto Climático e Calendário Atual:
- Temperatura Prevista: ${context?.temperature}°C
- É Fim de Semana? ${context?.isWeekend ? 'Sim' : 'Não'}
- É Feriado? ${context?.isHoliday ? 'Sim' : 'Não'}

Histórico recente de faturamento/vendas:
${JSON.stringify(history)}

Por favor, faça uma análise da demanda de gelo (cubo, triturado e barra) cruzando a temperatura, época e tráfego de turistas em Rio das Ostras (que atrai milhares de visitantes para as praias de Costazul, Centro, Tartaruga).

Retorne um JSON com os seguintes campos:
{
  "recommendedProductionKg": 2500, // recomendação de quilos totais a produzir para os próximos 3 dias
  "analysis": "Uma análise detalhada em português sobre as condições do tempo, fatores sazonais locais e direcionamento estratégico para a frotas e pessoal.",
  "growthPercentage": 45, // porcentagem esperada de aumento ou redução da demanda (positivo ou negativo)
  "weatherAlert": "Um alerta curto de clima se necessário (ex: Alerta de Calor Intenso), ou null se normal"
}

Retorne APENAS o JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '';
    const result = JSON.parse(text.trim());

    res.json({
      success: true,
      isSimulated: false,
      recommendedProductionKg: result.recommendedProductionKg,
      analysis: result.analysis,
      growthPercentage: result.growthPercentage,
      weatherAlert: result.weatherAlert
    });
  } catch (error: any) {
    console.error('Erro na previsão de demanda via Gemini:', error);
    res.status(500).json({ error: 'Erro ao processar previsão de demanda inteligente.', details: error.message });
  }
});


// 4. Vite middleware for development or Static Assets for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite dev middleware loaded');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static files from dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
