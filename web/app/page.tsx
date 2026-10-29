"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { 
  MessageCircle, Star, Globe, AlertCircle, Copy, 
  LayoutDashboard, Target, ServerCrash, Search, GripVertical, 
  X, MapPin, Phone, Mail, Send, Maximize2, LogOut, Lock, User
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

type Lead = {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  whatsapp: string;
  site: string;
  email?: string;
  nota: number;
  avaliacoes: number;
  diagnostico: string;
  score: number;
  status?: string;
  mensagens?: { whatsapp?: string; instagram?: string; email_assunto?: string; email_corpo?: string; followup?: string; };
  wa_link?: string;
  maps?: string;
};

const COLUNAS = ["novo", "contatado", "reunião", "fechado", "descartado"];

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [erroAuth, setErroAuth] = useState("");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingDados, setLoadingDados] = useState(false);
  const [erroServidor, setErroServidor] = useState(false);
  
  // Estados da Prospecção
  const [nicho, setNicho] = useState("");
  const [cep, setCep] = useState("");
  const [cidade, setCidade] = useState("");
  const [buscando, setBuscando] = useState(false);
  
  // Estado para Pesquisar leads na tela
  const [filtroLead, setFiltroLead] = useState("");
  
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [emailDestino, setEmailDestino] = useState("");
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) carregarLeads();
  }, [session]);

  useEffect(() => {
    if (leadSelecionado) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
  }, [leadSelecionado]);

  // Busca Cidade pelo CEP
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '');
    setCep(valor);
    
    if (valor.length === 8) {
      try {
        const res = await axios.get(`https://viacep.com.br/ws/${valor}/json/`);
        if (res.data && !res.data.erro) {
          setCidade(`${res.data.localidade} - ${res.data.uf}`);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      }
    }
  };

  const abrirFichaCompleta = (lead: Lead) => {
    setLeadSelecionado(lead);
    setEmailDestino(lead.email || "");
  };

  const fazerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroAuth("");
    setLoadingAuth(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailLogin, password: senhaLogin });
    if (error) setErroAuth("Credenciais inválidas. Tente novamente.");
    setLoadingAuth(false);
  };

  const loginComGoogle = async () => {
    setErroAuth("");
    setLoadingAuth(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) { setErroAuth("Erro ao conectar com o Google."); setLoadingAuth(false); }
  };

  const fazerLogout = async () => {
    await supabase.auth.signOut();
    setLeads([]);
  };

  const carregarLeads = async () => {
    setLoadingDados(true);
    try {
      const res = await axios.get("https://prospectai-api-l98h.onrender.com/api/leads");
      setLeads(res.data);
      setErroServidor(false);
    } catch (error) { setErroServidor(true); } 
    finally { setLoadingDados(false); }
  };

  const mudarStatus = async (id: string, novoStatus: string) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: novoStatus } : l));
    try { await axios.put(`https://prospectai-api-l98h.onrender.com/api/leads/${id}/status?status=${novoStatus}`); } 
    catch (error) { console.error("Erro ao guardar status", error); }
  };

  const onDragStart = (e: React.DragEvent, id: string) => e.dataTransfer.setData("leadId", id);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent, coluna: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) mudarStatus(leadId, coluna);
  };

  const iniciarProspeccao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicho || !cidade) return alert("Selecione o nicho e informe o CEP/Cidade!");
    setBuscando(true);
    try {
      await axios.post("https://prospectai-api-l98h.onrender.com/api/prospectar", { nicho, cidade, maximo: 10, top: 10 });
      await carregarLeads();
      setNicho(""); setCidade(""); setCep("");
    } catch (error) { alert("Erro ao buscar. Verifique o terminal do Python."); } 
    finally { setBuscando(false); }
  };

  const dispararEmail = async () => {
    if (!emailDestino.includes("@")) return alert("Por favor, digite um e-mail válido!");
    setEnviandoEmail(true);
    try {
      await axios.post("https://prospectai-api-l98h.onrender.com/api/enviar-email", {
        para: emailDestino,
        assunto: leadSelecionado?.mensagens?.email_assunto,
        corpo: leadSelecionado?.mensagens?.email_corpo
      });
      alert("E-mail enviado com sucesso!");
    } catch (error) { alert("Erro ao enviar e-mail. Verifique o terminal do Python."); } 
    finally { setEnviandoEmail(false); }
  };

  const copiarTexto = (texto: string | undefined) => {
    if (texto) { navigator.clipboard.writeText(texto); alert("Copiado com sucesso!"); }
  };

  // Filtragem local
  const leadsExibidos = leads.filter(l => l.nome.toLowerCase().includes(filtroLead.toLowerCase()));

  if (loadingAuth) return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
      <p className="text-orange-400 font-bold animate-pulse tracking-widest uppercase text-xs">A Validar Segurança...</p>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 selection:bg-orange-500/30 relative overflow-hidden">
      {/* CÓDIGO DA ANIMAÇÃO DA ONDA (CSS + DIVs) */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave-slow { 0% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0, 0) scale(1); } }
        .animate-wave-slow { animation: wave-slow 15s infinite ease-in-out; }
        .animate-wave-fast { animation: wave-slow 10s infinite ease-in-out reverse; }
      `}} />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-600/20 blur-[120px] rounded-full animate-wave-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[100px] rounded-full animate-wave-fast"></div>
      </div>

      <div className="w-full max-w-md bg-[#121212]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8 relative z-10">
          <img src="/logo-prospectAI.png" alt="Logo" className="relative h-20 w-auto drop-shadow-2xl mb-4" />
          <h1 className="text-2xl font-black text-white">Bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">ProspectAI</span></h1>
          <p className="text-slate-400 text-sm mt-1">Faça login para aceder ao seu CRM.</p>
        </div>
        <div className="space-y-6 relative z-10">
          <button onClick={loginComGoogle} type="button" className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-[#121212] px-3 text-slate-500 font-medium uppercase tracking-wider">Ou</span></div>
          </div>
          <form onSubmit={fazerLogin} className="space-y-4">
            {erroAuth && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center font-semibold">{erroAuth}</div>}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative"><User size={18} className="absolute left-4 top-3.5 text-slate-500" /><input type="email" value={emailLogin} onChange={e => setEmailLogin(e.target.value)} required className="w-full bg-black/50 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500" placeholder="seu@email.com" /></div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative"><Lock size={18} className="absolute left-4 top-3.5 text-slate-500" /><input type="password" value={senhaLogin} onChange={e => setSenhaLogin(e.target.value)} required className="w-full bg-black/50 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500" placeholder="••••••••" /></div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center mt-2">Entrar</button>
          </form>
        </div>
      </div>
    </div>
  );

  if (erroServidor) return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="bg-red-500/10 p-6 rounded-full border border-red-500/20"><ServerCrash size={48} className="text-red-500" /></div>
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Conexão Perdida</h1>
        <p className="text-slate-400 max-w-md mx-auto">Certifique-se de que o backend Python está a correr num terminal separado.</p>
      </div>
      <button onClick={carregarLeads} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-colors">Tentar Novamente</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-200 font-sans selection:bg-orange-500/30 overflow-hidden flex flex-col relative">
      
      {/* CÓDIGO DA ANIMAÇÃO DA ONDA GLOBAL */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave-slow { 0% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0, 0) scale(1); } }
        .animate-wave-slow { animation: wave-slow 15s infinite ease-in-out; }
        .animate-wave-fast { animation: wave-slow 10s infinite ease-in-out reverse; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-600/10 blur-[150px] rounded-full animate-wave-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full animate-wave-fast"></div>
      </div>

      <header className="sticky top-0 z-40 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-2xl shadow-black">
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative group cursor-pointer flex items-center justify-center">
            <div className="absolute -inset-2 bg-gradient-to-r from-orange-600 to-amber-500 rounded-full blur-xl opacity-20 group-hover:opacity-50 transition duration-700"></div>
            <img src="/logo-prospectAI.png" alt="ProspectAI Logo" className="relative h-14 w-auto drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="flex flex-col hidden xl:flex">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">Prospect<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">AI</span></h1>
            <p className="text-[11px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-0.5 flex items-center gap-1"><Target size={12} className="text-orange-500"/> Painel de Captação</p>
          </div>
        </div>
        
        {/* BARRA DE PROSPECÇÃO AVANÇADA */}
        <form onSubmit={iniciarProspeccao} className="relative z-10 flex items-center gap-2 bg-[#121212] p-1.5 rounded-2xl border border-white/10 shadow-inner hidden md:flex">
          <select value={nicho} onChange={e => setNicho(e.target.value)} disabled={buscando} className="bg-transparent border-none outline-none text-sm text-white px-4 py-2 w-40 focus:ring-0 disabled:opacity-50 cursor-pointer appearance-none hide-scrollbar">
            <option value="" className="bg-[#121212]">Nicho...</option>
            <option value="Advogados" className="bg-[#121212]">Advogados</option>
            <option value="Clínicas Médicas" className="bg-[#121212]">Clínicas Médicas</option>
            <option value="Odontologia" className="bg-[#121212]">Odontologia</option>
            <option value="Estética e Beleza" className="bg-[#121212]">Estética e Beleza</option>
            <option value="Imobiliárias" className="bg-[#121212]">Imobiliárias</option>
            <option value="Arquitetura" className="bg-[#121212]">Arquitetura</option>
            <option value="Academias" className="bg-[#121212]">Academias</option>
            <option value="Restaurantes" className="bg-[#121212]">Restaurantes</option>
          </select>
          
          <div className="w-px h-6 bg-white/10"></div>
          
          <input type="text" placeholder="CEP" value={cep} onChange={handleCepChange} maxLength={8} disabled={buscando} className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 px-4 py-2 w-24 focus:ring-0 disabled:opacity-50 text-center"/>
          
          <div className="w-px h-6 bg-white/10"></div>
          
          <input type="text" placeholder="Cidade (Auto)" value={cidade} onChange={e => setCidade(e.target.value)} disabled={buscando} className="bg-transparent border-none outline-none text-sm text-orange-400 placeholder-slate-500 px-4 py-2 w-40 focus:ring-0 disabled:opacity-50 font-medium"/>
          
          <button type="submit" disabled={buscando} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-2 px-5 rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20">
            {buscando ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Buscando...</span></> : <><Search size={16} /><span>Prospectar</span></>}
          </button>
        </form>

        <div className="flex items-center gap-4 relative z-10">
          {/* BARRA DE PESQUISA DE LEADS (NOVIDADE) */}
          <div className="relative hidden lg:block">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Pesquisar lead..." 
              value={filtroLead} 
              onChange={e => setFiltroLead(e.target.value)}
              className="bg-black/50 border border-white/10 text-sm text-white rounded-full py-2 pl-9 pr-4 focus:outline-none focus:border-orange-500 w-48 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full shadow-inner">
            <LayoutDashboard size={18} className="text-orange-400" />
            <span className="text-sm font-semibold tracking-wide text-white"><span className="text-orange-400 font-bold">{leadsExibidos.length}</span><span className="hidden md:inline"> leads</span></span>
          </div>
          <button onClick={fazerLogout} title="Sair do Sistema" className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-full transition-colors"><LogOut size={18} /></button>
        </div>
      </header>

      {/* Barra mobile para prospecção */}
      <div className="md:hidden px-4 py-3 bg-[#0A0A0A]/50 border-b border-white/5 relative z-10">
         <form onSubmit={iniciarProspeccao} className="flex flex-col gap-2">
            <select value={nicho} onChange={e => setNicho(e.target.value)} className="bg-[#121212] border border-white/5 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500">
               <option value="">Selecione a Profissão...</option>
               <option value="Advogados">Advogados</option>
               <option value="Clínicas Médicas">Clínicas Médicas</option>
               <option value="Odontologia">Odontologia</option>
            </select>
            <div className="flex gap-2">
              <input type="text" placeholder="CEP" value={cep} onChange={handleCepChange} maxLength={8} className="bg-[#121212] border border-white/5 text-white rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 w-1/3 text-center"/>
              <input type="text" placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} className="bg-[#121212] border border-white/5 text-orange-400 rounded-lg p-3 text-sm focus:outline-none focus:border-orange-500 w-2/3 font-medium"/>
            </div>
            <button type="submit" disabled={buscando} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold p-3 rounded-lg flex justify-center items-center mt-1">Buscar Leads</button>
         </form>
      </div>

      {loadingDados && leads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center relative z-10"><div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div></div>
      ) : (
        <main className="p-6 flex-1 overflow-hidden flex flex-col w-full relative z-10">
          <div className="flex gap-4 overflow-x-auto pb-4 h-full w-full scrollbar-thin scrollbar-thumb-orange-500/20 scrollbar-track-transparent">
            {COLUNAS.map((coluna) => (
              <div key={coluna} onDragOver={onDragOver} onDrop={(e) => onDrop(e, coluna)} className="flex-1 min-w-[260px] flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md shadow-lg shrink-0">
                  <h2 className="font-extrabold text-slate-200 uppercase tracking-widest text-xs flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shadow-lg ${coluna === 'novo' ? 'bg-orange-500' : coluna === 'fechado' ? 'bg-emerald-500' : coluna === 'reunião' ? 'bg-amber-400' : 'bg-slate-500'}`}></div>
                    {coluna}
                  </h2>
                  <span className="bg-black/60 border border-white/10 text-orange-400 px-2.5 py-0.5 rounded-full text-xs font-black shadow-inner">
                    {leadsExibidos.filter((l) => (l.status || "novo") === coluna).length}
                  </span>
                </div>
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-10 scrollbar-none">
                  {leadsExibidos.filter((l) => (l.status || "novo") === coluna).map((lead) => (
                    <div key={lead.id} draggable onDragStart={(e) => onDragStart(e, lead.id)} className="group relative bg-[#121212] border border-white/5 hover:border-orange-500/40 p-4 rounded-xl shadow-xl transition-all duration-300 overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-orange-500/10">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={18} className="text-slate-600 mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          <h3 onClick={() => abrirFichaCompleta(lead)} className="font-bold text-white text-base leading-snug hover:text-orange-400 transition-colors cursor-pointer flex items-center gap-2 group/title">
                            {lead.nome} <Maximize2 size={14} className="text-slate-500 group-hover/title:text-orange-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                          </h3>
                        </div>
                        <span className="shrink-0 bg-gradient-to-br from-orange-500 to-red-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black shadow-lg border border-orange-400/20">{lead.score}</span>
                      </div>
                      <div className="text-xs text-slate-400 space-y-1.5 mb-3 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 pointer-events-none mt-3">
                        {lead.nota && <p className="flex items-center gap-1.5"><Star size={14} className="text-amber-400" /> <span className="text-white font-bold">{lead.nota}</span> ({lead.avaliacoes} avs)</p>}
                        <p className="flex items-start gap-1.5"><AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" /> <span className="line-clamp-2">{lead.diagnostico}</span></p>
                      </div>
                      <button onClick={() => abrirFichaCompleta(lead)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2">Ver Ficha</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

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
                  {leadSelecionado.email && <span className="flex items-center gap-1 text-blue-400 font-semibold"><Mail size={16} className="text-blue-500"/> {leadSelecionado.email}</span>}
                  {leadSelecionado.nota && <span className="flex items-center gap-1"><Star size={16} className="text-amber-400"/> {leadSelecionado.nota} ({leadSelecionado.avaliacoes} avaliações)</span>}
                </div>
              </div>
              <button onClick={() => setLeadSelecionado(null)} className="p-2 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors absolute top-6 right-6"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
              <div className="flex flex-wrap gap-4">
                {leadSelecionado.wa_link && (
                  <a href={leadSelecionado.wa_link} target="_blank" className="flex items-center gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"><MessageCircle size={18} /> Abrir no WhatsApp</a>
                )}
                {leadSelecionado.site && (
                  <a href={leadSelecionado.site} target="_blank" className="flex items-center gap-2 bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all"><Globe size={18} /> Acessar Site</a>
                )}
                {leadSelecionado.maps && (
                  <a href={leadSelecionado.maps} target="_blank" className="flex items-center gap-2 bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all"><MapPin size={18} /> Google Maps</a>
                )}
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
                      <button onClick={() => copiarTexto(leadSelecionado.mensagens?.whatsapp)} className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-lg"><Copy size={14}/> Copiar</button>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{leadSelecionado.mensagens?.whatsapp || "Nenhuma mensagem gerada."}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white flex items-center gap-2"><Send size={18} className="text-pink-500"/> Abordagem Instagram</h4>
                      <button onClick={() => copiarTexto(leadSelecionado.mensagens?.instagram)} className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-lg"><Copy size={14}/> Copiar</button>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{leadSelecionado.mensagens?.instagram || "Nenhuma mensagem gerada."}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-white flex items-center gap-2"><Mail size={18} className="text-blue-400"/> Proposta por E-mail</h4>
                    </div>
                    
                    <div className="flex gap-2 mb-4 bg-black/40 p-2 rounded-xl border border-white/5">
                      <input 
                        type="email" 
                        placeholder="E-mail do Lead..." 
                        value={emailDestino} 
                        onChange={e => setEmailDestino(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-white px-2 focus:ring-0"
                      />
                      <button 
                        onClick={dispararEmail}
                        disabled={enviandoEmail}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                      >
                        {enviandoEmail ? "A Enviar..." : <><Send size={14}/> Enviar Agora</>}
                      </button>
                    </div>

                    <div className="mb-3 pb-3 border-b border-white/10">
                      <span className="text-xs text-slate-500 font-bold block mb-1">Assunto</span>
                      <p className="text-sm text-white font-semibold">{leadSelecionado.mensagens?.email_assunto || "-"}</p>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed flex-1">{leadSelecionado.mensagens?.email_corpo || "Nenhuma mensagem gerada."}</p>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white flex items-center gap-2"><MessageCircle size={18} className="text-slate-400"/> Follow-up (3-5 dias)</h4>
                      <button onClick={() => copiarTexto(leadSelecionado.mensagens?.followup)} className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-lg"><Copy size={14}/> Copiar</button>
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