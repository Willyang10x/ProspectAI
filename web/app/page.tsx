"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { 
  MessageCircle, Star, Globe, AlertCircle, Copy, 
  LayoutDashboard, Target, ServerCrash, Search, GripVertical, 
  X, MapPin, Phone, Mail, Send, Maximize2 
} from "lucide-react";

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
  
  const [nicho, setNicho] = useState("");
  const [cidade, setCidade] = useState("");
  const [buscando, setBuscando] = useState(false);

  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);

  useEffect(() => {
    carregarLeads();
  }, []);

  useEffect(() => {
    if (leadSelecionado) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
  }, [leadSelecionado]);

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

  const mudarStatus = async (id: string, novoStatus: string) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: novoStatus } : l));
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
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, coluna: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) mudarStatus(leadId, coluna);
  };

  const iniciarProspeccao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicho || !cidade) return alert("Preencha o nicho e a cidade!");
    
    setBuscando(true);
    try {
      await axios.post("http://localhost:8000/api/prospectar", {
        nicho, cidade, maximo: 10, top: 3 
      });
      await carregarLeads();
      setNicho("");
      setCidade("");
    } catch (error) {
      alert("Erro ao buscar. Veja o terminal do Python.");
      console.error(error);
    } finally {
      setBuscando(false);
    }
  };

  const copiarTexto = (texto: string | undefined) => {
    if (texto) {
      navigator.clipboard.writeText(texto);
      alert("Copiado com sucesso!");
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
      
      {/* CABEÇALHO */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-2xl shadow-black">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer flex items-center justify-center">
            <div className="absolute -inset-2 bg-gradient-to-r from-orange-600 to-amber-500 rounded-full blur-xl opacity-20 group-hover:opacity-50 transition duration-700"></div>
            <img src="/logo-prospectAI.svg" alt="ProspectAI Logo" className="relative h-14 w-auto drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="flex flex-col hidden lg:flex">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
              Prospect<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5 flex items-center gap-1">
              <Target size={12} className="text-orange-500"/> Painel de Captação
            </p>
          </div>
        </div>
        
        <form onSubmit={iniciarProspeccao} className="flex items-center gap-2 bg-[#121212] p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <input type="text" placeholder="Nicho (ex: Clínicas)" value={nicho} onChange={e => setNicho(e.target.value)} disabled={buscando} className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 px-4 py-2 w-32 md:w-40 focus:ring-0 disabled:opacity-50"/>
          <div className="w-px h-6 bg-white/10"></div>
          <input type="text" placeholder="Cidade (ex: SP)" value={cidade} onChange={e => setCidade(e.target.value)} disabled={buscando} className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 px-4 py-2 w-32 md:w-40 focus:ring-0 disabled:opacity-50"/>
          <button type="submit" disabled={buscando} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-2 px-4 md:px-5 rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20">
            {buscando ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span className="hidden md:inline">Buscando...</span></> : <><Search size={16} /><span className="hidden md:inline">Prospectar</span></>}
          </button>
        </form>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full shadow-inner">
          <LayoutDashboard size={18} className="text-orange-400" />
          <span className="text-sm font-semibold tracking-wide text-white"><span className="text-orange-400 font-bold">{leads.length}</span><span className="hidden md:inline"> leads</span></span>
        </div>
      </header>

      {/* KANBAN BOARD - AGORA COM FLEX-1 PARA CABER NA TELA */}
      <main className="p-6 flex-1 overflow-hidden flex flex-col w-full">
        <div className="flex gap-4 overflow-x-auto pb-4 h-full w-full scrollbar-thin scrollbar-thumb-orange-500/20 scrollbar-track-transparent">
          {COLUNAS.map((coluna) => (
            <div key={coluna} onDragOver={onDragOver} onDrop={(e) => onDrop(e, coluna)} className="flex-1 min-w-[260px] flex flex-col gap-4 h-full">
              
              {/* CABEÇALHO DA COLUNA */}
              <div className="flex items-center justify-between bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md shadow-lg shrink-0">
                <h2 className="font-extrabold text-slate-200 uppercase tracking-widest text-xs flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shadow-lg ${coluna === 'novo' ? 'bg-orange-500' : coluna === 'fechado' ? 'bg-emerald-500' : coluna === 'reunião' ? 'bg-amber-400' : 'bg-slate-500'}`}></div>
                  {coluna}
                </h2>
                <span className="bg-black/60 border border-white/10 text-orange-400 px-2.5 py-0.5 rounded-full text-xs font-black shadow-inner">
                  {leads.filter((l) => (l.status || "novo") === coluna).length}
                </span>
              </div>

              {/* ÁREA DOS CARTÕES */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-10 scrollbar-none">
                {leads.filter((l) => (l.status || "novo") === coluna).map((lead) => (
                  <div key={lead.id} draggable onDragStart={(e) => onDragStart(e, lead.id)} className="group relative bg-[#121212] border border-white/5 hover:border-orange-500/40 p-4 rounded-xl shadow-xl transition-all duration-300 overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-orange-500/10">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex items-start gap-1.5">
                        <GripVertical size={18} className="text-slate-600 mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        <h3 
                          onClick={() => setLeadSelecionado(lead)}
                          className="font-bold text-white text-base leading-snug hover:text-orange-400 transition-colors cursor-pointer flex items-center gap-2 group/title"
                        >
                          {lead.nome}
                          <Maximize2 size={14} className="text-slate-500 group-hover/title:text-orange-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                        </h3>
                      </div>
                      <span className="shrink-0 bg-gradient-to-br from-orange-500 to-red-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black shadow-lg border border-orange-400/20">{lead.score}</span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1.5 mb-3 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 pointer-events-none mt-3">
                      {lead.nota && <p className="flex items-center gap-1.5"><Star size={14} className="text-amber-400" /> <span className="text-white font-bold">{lead.nota}</span> ({lead.avaliacoes} avs)</p>}
                      <p className="flex items-start gap-1.5"><AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" /> <span className="line-clamp-2">{lead.diagnostico}</span></p>
                    </div>

                    <button onClick={() => setLeadSelecionado(lead)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2">
                      Ver Ficha
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL FLUTUANTE (OVERLAY) */}
      {leadSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setLeadSelecionado(null)}></div>
          
          <div className="relative bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-start justify-between p-6 border-b border-white/10 bg-[#121212]">
              <div className="pr-10">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black text-white">{leadSelecionado.nome}</h2>
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">{leadSelecionado.score} pts</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={16} className="text-slate-500"/> {leadSelecionado.endereco}</span>
                  <span className="flex items-center gap-1"><Phone size={16} className="text-slate-500"/> {leadSelecionado.telefone || "Sem telefone"}</span>
                  {leadSelecionado.nota && <span className="flex items-center gap-1"><Star size={16} className="text-amber-400"/> {leadSelecionado.nota} ({leadSelecionado.avaliacoes} avaliações)</span>}
                </div>
              </div>
              <button onClick={() => setLeadSelecionado(null)} className="p-2 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors absolute top-6 right-6">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
              <div className="flex flex-wrap gap-4">
                {leadSelecionado.wa_link && (
                  <a href={leadSelecionado.wa_link} target="_blank" className="flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/20 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                    <MessageCircle size={18} /> Abrir no WhatsApp
                  </a>
                )}
                {leadSelecionado.site && (
                  <a href={leadSelecionado.site} target="_blank" className="flex items-center gap-2 bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                    <Globe size={18} /> Acessar Site
                  </a>
                )}
                <a href={leadSelecionado.maps} target="_blank" className="flex items-center gap-2 bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all">
                  <MapPin size={18} /> Google Maps
                </a>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-red-400 font-bold text-sm mb-1">Diagnóstico da IA</h4>
                  <p className="text-red-300/80 text-sm leading-relaxed">{leadSelecionado.diagnostico}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white flex items-center gap-2"><MessageCircle size={18} className="text-green-500"/> Abordagem WhatsApp</h4>
                      <button onClick={() => copiarTexto(leadSelecionado.mensagens?.whatsapp)} className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-lg">
                        <Copy size={14}/> Copiar
                      </button>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{leadSelecionado.mensagens?.whatsapp || "Nenhuma mensagem gerada."}</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white flex items-center gap-2"><Send size={18} className="text-pink-500"/> Abordagem Instagram</h4>
                      <button onClick={() => copiarTexto(leadSelecionado.mensagens?.instagram)} className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-lg">
                        <Copy size={14}/> Copiar
                      </button>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{leadSelecionado.mensagens?.instagram || "Nenhuma mensagem gerada."}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white flex items-center gap-2"><Mail size={18} className="text-blue-400"/> Proposta por E-mail</h4>
                      <button onClick={() => copiarTexto(leadSelecionado.mensagens?.email_corpo)} className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-lg">
                        <Copy size={14}/> Copiar Corpo
                      </button>
                    </div>
                    <div className="mb-3 pb-3 border-b border-white/10">
                      <span className="text-xs text-slate-500 font-bold block mb-1">Assunto</span>
                      <p className="text-sm text-white font-semibold">{leadSelecionado.mensagens?.email_assunto || "-"}</p>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{leadSelecionado.mensagens?.email_corpo || "Nenhuma mensagem gerada."}</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white flex items-center gap-2"><MessageCircle size={18} className="text-slate-400"/> Follow-up (3-5 dias)</h4>
                      <button onClick={() => copiarTexto(leadSelecionado.mensagens?.followup)} className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-lg">
                        <Copy size={14}/> Copiar
                      </button>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{leadSelecionado.mensagens?.followup || "Nenhuma mensagem gerada."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}