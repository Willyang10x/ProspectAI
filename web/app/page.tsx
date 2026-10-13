"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { MessageCircle, Star, Globe, AlertCircle, Copy, ArrowRight, LayoutDashboard, Target } from "lucide-react";

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

  useEffect(() => {
    carregarLeads();
  }, []);

  const carregarLeads = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/leads");
      setLeads(res.data);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const mudarStatus = (id: string, novoStatus: string) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: novoStatus } : l));
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
      <p className="text-orange-400 font-bold animate-pulse tracking-widest uppercase text-sm">A iniciar ProspectAI...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 font-sans selection:bg-orange-500/30">
      
      {/* Cabeçalho Premium com a sua Marca */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex items-center justify-between shadow-2xl shadow-black">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer flex items-center justify-center">
            {/* Efeito de brilho Laranja (Glow) atrás da logo para destacar */}
            <div className="absolute -inset-2 bg-gradient-to-r from-orange-600 to-amber-500 rounded-full blur-xl opacity-20 group-hover:opacity-50 transition duration-700"></div>
            <img src="/logo-prospectAI.svg" alt="ProspectAI Logo" className="relative h-14 w-auto drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
              Prospect<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5 flex items-center gap-1">
              <Target size={12} className="text-orange-500"/> Painel de Captação
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2.5 rounded-full shadow-inner hover:bg-white/10 transition-colors">
          <LayoutDashboard size={18} className="text-orange-400" />
          <span className="text-sm font-semibold tracking-wide text-white"><span className="text-orange-400 font-bold">{leads.length}</span> leads na base</span>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="p-8">
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-thin scrollbar-thumb-orange-500/20 scrollbar-track-transparent hover:scrollbar-thumb-orange-500/40 transition-colors">
          {COLUNAS.map((coluna) => (
            <div key={coluna} className="snap-start shrink-0 w-[380px] flex flex-col gap-5">
              
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-lg">
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

              {/* Cartões dos Leads */}
              <div className="flex flex-col gap-4 min-h-[200px]">
                {leads.filter((l) => (l.status || "novo") === coluna).map((lead) => (
                  <div key={lead.id} className="group relative bg-[#121212] border border-white/5 hover:border-orange-500/40 p-6 rounded-2xl shadow-xl hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                    
                    {/* Efeito de gradiente no topo do cartão ao passar o rato */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="flex justify-between items-start mb-5 gap-4">
                      <h3 className="font-bold text-white text-lg leading-snug group-hover:text-orange-400 transition-colors">{lead.nome}</h3>
                      <span className="shrink-0 bg-gradient-to-br from-orange-500 to-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-orange-900/40 border border-orange-400/20">
                        {lead.score}
                      </span>
                    </div>

                    <div className="text-sm text-slate-400 space-y-3 mb-6 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      {lead.nota && (
                        <p className="flex items-center gap-2">
                          <Star size={16} className="text-amber-400 fill-amber-400/20" /> 
                          <span className="text-white font-bold">{lead.nota}</span> 
                          <span className="text-slate-500">({lead.avaliacoes} avaliações)</span>
                        </p>
                      )}
                      {lead.site && (
                        <p className="flex items-center gap-2">
                          <Globe size={16} className="text-slate-500" /> 
                          <a href={lead.site} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 hover:underline truncate transition-colors">Acessar Site</a>
                        </p>
                      )}
                      <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 p-3 rounded-lg mt-2">
                        <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                        <p className="text-red-300/80 text-xs font-medium leading-relaxed">{lead.diagnostico}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 flex-wrap mb-5">
                      {lead.whatsapp && lead.wa_link && (
                        <a href={lead.wa_link} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300">
                          <MessageCircle size={16} /> WhatsApp
                        </a>
                      )}
                      <button onClick={() => copiarTexto(lead.mensagens?.whatsapp || "")} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-orange-500/10 hover:text-orange-400 text-slate-300 border border-white/10 hover:border-orange-500/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300">
                        <Copy size={16} /> Copiar
                      </button>
                    </div>

                    <div className="relative mt-2">
                      <select 
                        value={lead.status || "novo"} 
                        onChange={(e) => mudarStatus(lead.id, e.target.value)}
                        className="w-full appearance-none bg-black/50 border border-white/10 text-slate-300 text-sm font-semibold rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent block p-3.5 outline-none transition-all cursor-pointer hover:bg-black hover:border-white/20"
                      >
                        {COLUNAS.map(c => <option key={c} value={c} className="bg-[#121212] text-white">Mover para: {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                      <ArrowRight size={16} className="absolute right-4 top-3.5 text-slate-500 pointer-events-none" />
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