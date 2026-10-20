"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { MessageCircle, Star, Globe, AlertCircle, Copy, LayoutDashboard, Target, ServerCrash, Search, GripVertical } from "lucide-react";

type Lead = {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  whatsapp: string;
  site: string;
  nota: number;
  avaliacoes: number;
  diagnostico: string;
  score: number;
  status?: string;
  mensagens?: {
    whatsapp?: string;
    instagram?: string;
    email_assunto?: string;
    email_corpo?: string;
    followup?: string;
  };
  wa_link?: string;
};

const COLUNAS = ["novo", "contatado", "reunião", "fechado", "descartado"];

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroServidor, setErroServidor] = useState(false);
  
  // Estados para a Busca
  const [nicho, setNicho] = useState("");
  const [cidade, setCidade] = useState("");
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    carregarLeads();
  }, []);

  const carregarLeads = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/leads");
      setLeads(res.data);
      setErroServidor(false);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      setErroServidor(true);
    } finally {
      setLoading(false);
    }
  };

  // ---- FUNÇÕES DE DRAG & DROP E MUDANÇA DE STATUS ----
  const mudarStatus = async (id: string, novoStatus: string) => {
    // 1. Atualização Otimista (Muda na UI instantaneamente)
    setLeads(leads.map(l => l.id === id ? { ...l, status: novoStatus } : l));
    // 2. Guarda no Backend (JSON) em background
    try {
      await axios.put(`http://localhost:8000/api/leads/${id}/status?status=${novoStatus}`);
    } catch (error) {
      console.error("Erro ao guardar status", error);
    }
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("leadId", id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Permite soltar o card
  };

  const onDrop = (e: React.DragEvent, coluna: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) mudarStatus(leadId, coluna);
  };

  // ---- FUNÇÃO DA BARRA DE BUSCA ----
  const iniciarProspeccao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicho || !cidade) return alert("Preencha o nicho e a cidade!");
    
    setBuscando(true);
    try {
      await axios.post("http://localhost:8000/api/prospectar", {
        nicho,
        cidade,
        maximo: 10, // Define quantos quer procurar
        top: 3      // Define quantos a IA vai gerar mensagem
      });
      await carregarLeads(); // Atualiza a tela com os novos leads
      setNicho("");
      setCidade("");
    } catch (error) {
      alert("Erro ao buscar. Veja o terminal do Python.");
      console.error(error);
    } finally {
      setBuscando(false);
    }
  };

  const copiarTexto = (texto: string) => {
    if (texto) {
      navigator.clipboard.writeText(texto);
      alert("Mensagem copiada com sucesso!");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
      <p className="text-orange-400 font-bold animate-pulse tracking-widest uppercase text-sm">A conectar ao motor de IA...</p>
    </div>
  );

  if (erroServidor) return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20">
        <ServerCrash size={48} className="text-red-500" />
      </div>
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Conexão Perdida</h1>
        <p className="text-slate-400 max-w-md mx-auto">O painel não conseguiu comunicar com o servidor Python. Certifique-se de que o backend está a rodar com o comando <code className="bg-white/10 text-orange-400 px-2 py-1 rounded">python -m uvicorn api:app --reload</code>.</p>
      </div>
      <button onClick={() => { setLoading(true); carregarLeads(); }} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-colors">
        Tentar Novamente
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 font-sans selection:bg-orange-500/30 overflow-hidden flex flex-col">
      
      {/* Cabeçalho Premium com Barra de Busca */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex items-center justify-between shadow-2xl shadow-black">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer flex items-center justify-center">
            <div className="absolute -inset-2 bg-gradient-to-r from-orange-600 to-amber-500 rounded-full blur-xl opacity-20 group-hover:opacity-50 transition duration-700"></div>
            <img src="/logo-prospectAI.svg" alt="ProspectAI Logo" className="relative h-14 w-auto drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="flex flex-col hidden md:flex">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
              Prospect<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5 flex items-center gap-1">
              <Target size={12} className="text-orange-500"/> Painel de Captação
            </p>
          </div>
        </div>
        
        {/* Formulário de Busca Integrado */}
        <form onSubmit={iniciarProspeccao} className="flex items-center gap-2 bg-[#121212] p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <input 
            type="text" 
            placeholder="Nicho (ex: Clínicas)" 
            value={nicho} onChange={e => setNicho(e.target.value)}
            disabled={buscando}
            className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 px-4 py-2 w-40 focus:ring-0 disabled:opacity-50"
          />
          <div className="w-px h-6 bg-white/10"></div>
          <input 
            type="text" 
            placeholder="Cidade (ex: SP)" 
            value={cidade} onChange={e => setCidade(e.target.value)}
            disabled={buscando}
            className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 px-4 py-2 w-40 focus:ring-0 disabled:opacity-50"
          />
          <button 
            type="submit" 
            disabled={buscando}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-2 px-5 rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
          >
            {buscando ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> IA Processando...</>
            ) : (
              <><Search size={16} /> Buscar Leads</>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2.5 rounded-full shadow-inner">
          <LayoutDashboard size={18} className="text-orange-400" />
          <span className="text-sm font-semibold tracking-wide text-white"><span className="text-orange-400 font-bold">{leads.length}</span> leads</span>
        </div>
      </header>

      {/* Kanban Board com Drag & Drop */}
      <main className="p-8 flex-1 overflow-hidden flex flex-col">
        <div className="flex gap-6 overflow-x-auto pb-4 h-full snap-x scrollbar-thin scrollbar-thumb-orange-500/20 scrollbar-track-transparent">
          {COLUNAS.map((coluna) => (
            <div 
              key={coluna} 
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, coluna)}
              className="snap-start shrink-0 w-[380px] flex flex-col gap-4 h-full"
            >
              
              <div className="flex items-center justify-between bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-lg shrink-0">
                <h2 className="font-extrabold text-slate-200 uppercase tracking-widest text-xs flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                    coluna === 'novo' ? 'bg-orange-500 shadow-orange-500/50' : 
                    coluna === 'fechado' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                    coluna === 'reunião' ? 'bg-amber-400 shadow-amber-400/50' :
                    'bg-slate-500 shadow-slate-500/50'
                  }`}></div>
                  {coluna}
                </h2>
                <span className="bg-black/60 border border-white/10 text-orange-400 px-3 py-1 rounded-full text-xs font-black shadow-inner">
                  {leads.filter((l) => (l.status || "novo") === coluna).length}
                </span>
              </div>

              {/* Área Soltável (Drop Zone) */}
              <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2 pb-10 scrollbar-none">
                {leads.filter((l) => (l.status || "novo") === coluna).map((lead) => (
                  <div 
                    key={lead.id} 
                    draggable
                    onDragStart={(e) => onDragStart(e, lead.id)}
                    className="group relative bg-[#121212] border border-white/5 hover:border-orange-500/40 p-5 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-orange-500/10"
                  >
                    
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div className="flex items-start gap-2">
                        <GripVertical size={20} className="text-slate-600 mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h3 className="font-bold text-white text-lg leading-snug group-hover:text-orange-400 transition-colors">{lead.nome}</h3>
                      </div>
                      <span className="shrink-0 bg-gradient-to-br from-orange-500 to-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-orange-900/40 border border-orange-400/20">
                        {lead.score}
                      </span>
                    </div>

                    <div className="text-sm text-slate-400 space-y-3 mb-5 bg-white/[0.02] p-4 rounded-xl border border-white/5 pointer-events-none">
                      {lead.nota && (
                        <p className="flex items-center gap-2">
                          <Star size={16} className="text-amber-400 fill-amber-400/20" /> 
                          <span className="text-white font-bold">{lead.nota}</span> 
                          <span className="text-slate-500">({lead.avaliacoes} avs)</span>
                        </p>
                      )}
                      {lead.site && (
                        <p className="flex items-center gap-2">
                          <Globe size={16} className="text-slate-500" /> 
                          <span className="text-orange-400 truncate">Possui Link</span>
                        </p>
                      )}
                      {lead.diagnostico && lead.diagnostico !== "site ok" && (
                        <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 p-3 rounded-lg mt-2">
                          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                          <p className="text-red-300/80 text-xs font-medium leading-relaxed">{lead.diagnostico}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 flex-wrap relative z-10">
                      {lead.whatsapp && lead.wa_link && (
                        <a href={lead.wa_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/20 px-3 py-2 rounded-xl text-xs font-bold transition-all">
                          <MessageCircle size={16} /> Chamar
                        </a>
                      )}
                      <button onClick={() => copiarTexto(lead.mensagens?.whatsapp || "")} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-orange-500/10 hover:text-orange-400 text-slate-300 border border-white/10 px-3 py-2 rounded-xl text-xs font-bold transition-all">
                        <Copy size={16} /> Msg
                      </button>
                    </div>
                    
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}