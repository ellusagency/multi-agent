import { useState, useRef, useEffect } from "react";
import "@/App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enviar pedido ao orquestrador
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    const userMessage = {
      tipo: "usuario",
      conteudo: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/orquestrador`, {
        pedido: inputValue
      });

      const agentMessage = {
        tipo: "agente",
        conteudo: response.data,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      
      const errorMessage = {
        tipo: "erro",
        conteudo: {
          message: "Erro ao processar seu pedido. Tente novamente.",
          details: error.response?.data || error.message
        },
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-purple-500/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            🤖 Agente Multitarefas Orquestrador
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Classifico e executo suas tarefas inteligentemente
          </p>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl shadow-2xl border border-purple-500/20 overflow-hidden">
          
          {/* Messages Area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg">Olá! Como posso ajudar?</p>
                  <p className="text-sm mt-2">Digite seu pedido abaixo para começar</p>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index}>
                {msg.tipo === "usuario" && (
                  <div className="flex justify-end" data-testid="user-message">
                    <div className="max-w-[80%] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg">
                      <p className="text-sm">{msg.conteudo}</p>
                    </div>
                  </div>
                )}

                {msg.tipo === "agente" && (
                  <div className="flex justify-start" data-testid="agent-message">
                    <div className="max-w-[85%] space-y-3">
                      {/* Estado Interno Card */}
                      <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-xl p-4 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wide">
                            Estado Interno
                          </h3>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-slate-400 min-w-[80px]">Tipo:</span>
                            <span className="text-white font-medium">{msg.conteudo.estado.tipo}</span>
                          </div>
                          
                          {msg.conteudo.estado.subtipo && (
                            <div className="flex items-start gap-2">
                              <span className="text-slate-400 min-w-[80px]">Subtipo:</span>
                              <span className="text-white font-medium">{msg.conteudo.estado.subtipo}</span>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-2">
                            <span className="text-slate-400 min-w-[80px]">Ação:</span>
                            <span className="text-purple-300 font-mono text-xs">{msg.conteudo.estado.acao}</span>
                          </div>
                        </div>
                      </div>

                      {/* Resultado Card */}
                      <div className="bg-slate-700/50 text-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg border border-slate-600/50">
                        <p className="text-sm font-medium text-green-400 mb-2">
                          {msg.conteudo.resultado.message}
                        </p>
                        
                        {msg.conteudo.resultado.details && (
                          <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                            <p className="text-xs text-slate-400 mb-2">Detalhes:</p>
                            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                              {JSON.stringify(msg.conteudo.resultado.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {msg.tipo === "erro" && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-red-900/50 border border-red-500/30 text-red-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                      <p className="text-sm font-medium">❌ {msg.conteudo.message}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start" data-testid="loading-indicator">
                <div className="bg-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                    <span className="text-sm text-slate-300">Processando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-purple-500/20 bg-slate-800/50 p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite seu pedido aqui..."
                disabled={isLoading}
                data-testid="chat-input"
                className="flex-1 bg-slate-700/50 text-white placeholder-slate-400 rounded-xl px-4 py-3 border border-slate-600/50 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                data-testid="send-button"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/25"
              >
                {isLoading ? "..." : "Enviar"}
              </button>
            </form>
            
            <div className="mt-3 text-xs text-slate-500 text-center">
              Exemplos: "Crie uma campanha publicitária" • "Gere um relatório de vendas" • "Busque dados do endpoint /users"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
