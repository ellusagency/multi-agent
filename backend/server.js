const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = 8001;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGINS || '*',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==========================================
// CLASSIFICADOR DE PEDIDOS
// ==========================================
const palavrasChave = {
  criativo_texto: ['criar', 'gerar', 'escrever', 'campanha', 'slogan', 'anúncio', 'publicidade', 'texto', 'post'],
  criativo_documento: ['relatório', 'documento', 'whitepaper', 'análise', 'estudo', 'pesquisa'],
  criativo_imagem: ['imagem', 'foto', 'ilustração', 'desenho', 'arte', 'visual', 'banner'],
  dados_externos: ['buscar', 'api', 'dados', 'endpoint', 'consultar', 'busque', 'obter', 'pegar']
};

function classificarPedido(pedido) {
  const pedidoLower = pedido.toLowerCase();
  
  // Palavras que indicam pergunta informacional
  const palavrasPergunta = ['qual', 'quais', 'quando', 'como', 'por que', 'porque', 'onde', 'quem', 'o que'];
  const ehPergunta = palavrasPergunta.some(palavra => pedidoLower.startsWith(palavra));
  
  // Se é uma pergunta E não tem palavra explícita de API, é informacional
  if (ehPergunta && !pedidoLower.includes('api') && !pedidoLower.includes('endpoint')) {
    return { tipo: 'informacional', subtipo: null };
  }
  
  // Verifica dados externos (com palavras explícitas)
  if (palavrasChave.dados_externos.some(palavra => pedidoLower.includes(palavra))) {
    return { tipo: 'dados_externos', subtipo: null };
  }
  
  // Verifica criativo - imagem
  if (palavrasChave.criativo_imagem.some(palavra => pedidoLower.includes(palavra))) {
    return { tipo: 'criativo', subtipo: 'imagem' };
  }
  
  // Verifica criativo - documento
  if (palavrasChave.criativo_documento.some(palavra => pedidoLower.includes(palavra))) {
    return { tipo: 'criativo', subtipo: 'documento' };
  }
  
  // Verifica criativo - texto
  if (palavrasChave.criativo_texto.some(palavra => pedidoLower.includes(palavra))) {
    return { tipo: 'criativo', subtipo: 'texto' };
  }
  
  // Padrão: informacional
  return { tipo: 'informacional', subtipo: null };
}

// ==========================================
// FUNÇÕES MOCK (PREPARADAS PARA INTEGRAÇÃO)
// ==========================================

/**
 * Gera texto criativo
 * TODO: Integrar com OpenAI GPT-4, Claude, Gemini, etc.
 * Exemplo: const response = await openai.chat.completions.create({...})
 */
async function generateText(prompt) {
  // Simulação de delay de API
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    mock: true,
    message: `[MOCK] Chamada para API de geração de texto realizada com sucesso!`,
    details: {
      prompt: prompt,
      provider: 'Aguardando integração (OpenAI/Claude/Gemini)',
      // Aqui virá a resposta real da API
      resultado_exemplo: `Campanha publicitária criativa para: ${prompt.substring(0, 50)}...`
    }
  };
}

/**
 * Gera documento estruturado
 * TODO: Integrar com APIs de documentos ou templates
 */
async function generateDocument(prompt) {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    mock: true,
    message: `[MOCK] Gerando documento estruturado via API...`,
    details: {
      prompt: prompt,
      format: 'PDF/DOCX',
      provider: 'Aguardando integração',
      // Aqui virá o link do documento gerado
      documento_exemplo: 'Relatório completo com introdução, desenvolvimento e conclusão'
    }
  };
}

/**
 * Gera imagem
 * TODO: Integrar com DALL-E, Stable Diffusion, Midjourney, etc.
 * Exemplo: const response = await openai.images.generate({...})
 */
async function generateImage(description) {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    mock: true,
    message: `[MOCK] Gerando imagem via API de IA...`,
    details: {
      description: description,
      provider: 'Aguardando integração (DALL-E/Stable Diffusion)',
      // Aqui virá a URL da imagem gerada
      image_url_exemplo: 'https://example.com/generated-image.png'
    }
  };
}

/**
 * Busca dados de API externa
 * TODO: Integrar com APIs reais usando axios ou fetch
 * Exemplo: const response = await axios.get(endpoint, { headers: {...} })
 */
async function fetchDataFromAPI(endpoint) {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    mock: true,
    message: `[MOCK] Consultando dados do endpoint: ${endpoint}`,
    details: {
      endpoint: endpoint,
      method: 'GET',
      // Aqui virão os dados reais da API
      dados_exemplo: {
        status: 'success',
        data: 'Dados retornados da API'
      }
    }
  };
}

/**
 * Responde perguntas informacionais
 * Pode ser expandido com base de conhecimento ou LLM
 */
function responderInformacional(pergunta) {
  return {
    mock: false,
    message: `Resposta informacional para: "${pergunta}"`,
    details: {
      resposta: 'Esta é uma resposta direta baseada em conhecimento. Para respostas mais complexas, integre com um LLM.'
    }
  };
}

// ==========================================
// ROTAS DA API
// ==========================================

// Rota de teste
app.get('/api/', (req, res) => {
  res.json({ message: 'Agente Orquestrador - API funcionando!' });
});

// Rota principal do orquestrador
app.post('/api/orquestrador', async (req, res) => {
  try {
    const { pedido } = req.body;
    
    if (!pedido) {
      return res.status(400).json({
        error: 'Campo "pedido" é obrigatório'
      });
    }
    
    // 1. Classificar o pedido
    const classificacao = classificarPedido(pedido);
    
    // 2. Executar ação apropriada
    let resultado;
    let acao;
    
    if (classificacao.tipo === 'dados_externos') {
      acao = 'fetch_data_from_api';
      // Extrai endpoint do pedido (simplificado)
      const endpointMatch = pedido.match(/\/[\w\/]+/) || ['/default'];
      resultado = await fetchDataFromAPI(endpointMatch[0]);
      
    } else if (classificacao.tipo === 'criativo') {
      if (classificacao.subtipo === 'texto') {
        acao = 'generate_text';
        resultado = await generateText(pedido);
        
      } else if (classificacao.subtipo === 'documento') {
        acao = 'generate_document';
        resultado = await generateDocument(pedido);
        
      } else if (classificacao.subtipo === 'imagem') {
        acao = 'generate_image';
        resultado = await generateImage(pedido);
      }
      
    } else {
      // Informacional
      acao = 'responder_direto';
      resultado = responderInformacional(pedido);
    }
    
    // 3. Construir estado
    const estado = {
      tipo: classificacao.tipo,
      subtipo: classificacao.subtipo,
      acao: acao,
      detalhes: {
        pedido_original: pedido,
        timestamp: new Date().toISOString()
      }
    };
    
    // 4. Retornar resposta no formato especificado
    res.json({
      estado: estado,
      resultado: resultado
    });
    
  } catch (error) {
    console.error('Erro no orquestrador:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Endpoint principal: http://localhost:${PORT}/api/orquestrador`);
});

module.exports = app;
