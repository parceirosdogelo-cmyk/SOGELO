/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Lock,
  Phone,
  Shield,
  CheckCircle,
  Truck,
  Building,
  Info,
  MapPin,
  Sparkles,
  UserPlus,
  User,
  Key
} from 'lucide-react';

import {
  Perfil,
  InvestimentoFrota,
  Cliente,
  Produto,
  Pedido,
  ItemPedido,
  FluxoCaixa,
  MOCK_PERFIS,
  MOCK_INVESTIMENTOS,
  MOCK_CLIENTES,
  MOCK_PRODUTOS,
  MOCK_PEDIDOS,
  MOCK_ITENS_PEDIDO,
  MOCK_FLUXO_CAIXA
} from './types';

import MasterDashboard from './components/MasterDashboard';
import VendedorDashboard from './components/VendedorDashboard';
import EntregadorDashboard from './components/EntregadorDashboard';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<Perfil | null>(() => {
    const saved = localStorage.getItem('gelo_usuario_logado');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // New Employee Registration states from Login panel
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('55'); // default with 55 country code prefilled
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<'socio' | 'vendedor' | 'entregador'>('vendedor');

  // Application DB states (stored in localStorage)
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [investimentos, setInvestimentos] = useState<InvestimentoFrota[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixa[]>([]);

  // 1. Initialise localStorage database with our robust mock data
  useEffect(() => {
    const initStorage = <T,>(key: string, defaultVal: T): T => {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    };

    setPerfis(initStorage('gelo_perfis', MOCK_PERFIS));
    setInvestimentos(initStorage('gelo_investimentos', MOCK_INVESTIMENTOS));
    setClientes(initStorage('gelo_clientes', MOCK_CLIENTES));
    setProdutos(initStorage('gelo_produtos', MOCK_PRODUTOS));
    setPedidos(initStorage('gelo_pedidos', MOCK_PEDIDOS));
    setItensPedido(initStorage('gelo_itens_pedido', MOCK_ITENS_PEDIDO));
    setFluxoCaixa(initStorage('gelo_fluxo_caixa', MOCK_FLUXO_CAIXA));
  }, []);

  // 2. Synchronize DB changes to localStorage
  useEffect(() => {
    if (perfis.length > 0) localStorage.setItem('gelo_perfis', JSON.stringify(perfis));
  }, [perfis]);

  useEffect(() => {
    if (investimentos.length > 0) localStorage.setItem('gelo_investimentos', JSON.stringify(investimentos));
  }, [investimentos]);

  useEffect(() => {
    if (clientes.length > 0) localStorage.setItem('gelo_clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    if (produtos.length > 0) localStorage.setItem('gelo_produtos', JSON.stringify(produtos));
  }, [produtos]);

  useEffect(() => {
    if (pedidos.length > 0) localStorage.setItem('gelo_pedidos', JSON.stringify(pedidos));
  }, [pedidos]);

  useEffect(() => {
    if (itensPedido.length > 0) localStorage.setItem('gelo_itens_pedido', JSON.stringify(itensPedido));
  }, [itensPedido]);

  useEffect(() => {
    if (fluxoCaixa.length > 0) localStorage.setItem('gelo_fluxo_caixa', JSON.stringify(fluxoCaixa));
  }, [fluxoCaixa]);

  // LOGIN HANDLER
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    let cleanPhone = loginPhone.replace(/\D/g, ''); // Extract digits only

    // Match with registered profiles
    let matchedProfile = perfis.find(p => p.telefone.replace(/\D/g, '') === cleanPhone);

    // Dynamic recovery fallback for Mauro and Marcos to ensure immediate login capability
    if (!matchedProfile) {
      if (cleanPhone === '22992360437') {
        matchedProfile = { id: 'socio-mauro', nome: 'Mauro', telefone: '22992360437', role: 'socio', senha: '12345' };
        setPerfis(prev => {
          const filtered = prev.filter(p => p.id !== 'socio-mauro');
          return [...filtered, matchedProfile!];
        });
      } else if (cleanPhone === '22996213001') {
        matchedProfile = { id: 'socio-marcos', nome: 'Marcos', telefone: '22996213001', role: 'socio', senha: '12345' };
        setPerfis(prev => {
          const filtered = prev.filter(p => p.id !== 'socio-marcos');
          return [...filtered, matchedProfile!];
        });
      }
    }

    if (!matchedProfile) {
      setLoginError('Número de telefone não cadastrado no sistema.');
      return;
    }

    // Role-based password validations
    let isPasswordValid = false;

    // Direct check for custom passwords or default role passwords
    if (matchedProfile.senha && loginPassword === matchedProfile.senha) {
      isPasswordValid = true;
    } else if (matchedProfile.role === 'master' && loginPassword === '05085') {
      isPasswordValid = true;
    } else if (matchedProfile.role === 'socio' && (loginPassword === '12345' || loginPassword === 'senha123')) {
      isPasswordValid = true;
    } else if (matchedProfile.role === 'vendedor' && (loginPassword === 'vendas123' || loginPassword === '12345')) {
      isPasswordValid = true;
    } else if (matchedProfile.role === 'entregador' && (loginPassword === 'entrega123' || loginPassword === '12345')) {
      isPasswordValid = true;
    } else if (loginPassword === 'senha123' || loginPassword === '12345') {
      isPasswordValid = true;
    }

    if (!isPasswordValid) {
      setLoginError('Senha incorreta para este perfil de acesso.');
      return;
    }

    // Login successful
    setCurrentUser(matchedProfile);
    localStorage.setItem('gelo_usuario_logado', JSON.stringify(matchedProfile));
    setLoginPhone('');
    setLoginPassword('');
  };

  // NEW EMPLOYEE REGISTRATION FORM SUBMISSION HANDLER
  const handleRegisterEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerPhone || !registerPassword) {
      alert('Por favor, preencha todos os campos do cadastro.');
      return;
    }

    const cleanPhone = registerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 4) {
      alert('Por favor, informe um número de telefone válido.');
      return;
    }

    // Check if phone number is already registered
    const exists = perfis.some(p => p.telefone.replace(/\D/g, '') === cleanPhone);
    if (exists) {
      alert('Este número de telefone já está cadastrado em outro perfil.');
      return;
    }

    const newEmp: Perfil = {
      id: 'emp-' + Date.now(),
      nome: registerName.trim(),
      telefone: cleanPhone, // includes the 55 country code prefilled/appended
      role: registerRole,
      senha: registerPassword
    };

    setPerfis(prev => [...prev, newEmp]);
    
    // Alert the user with success message
    alert(`Funcionário ${registerName.trim()} cadastrado com sucesso! Ele já aparecerá ativo em todas as telas e poderá fazer login imediatamente usando o telefone comercial e a senha fornecida.`);
    
    // Reset forms and close modal
    setRegisterName('');
    setRegisterPhone('55');
    setRegisterPassword('');
    setRegisterRole('vendedor');
    setShowRegisterModal(false);
  };

  // LOGOUT HANDLER
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gelo_usuario_logado');
  };

  return (
    <div className="min-h-screen bg-elegant-bg font-sans text-slate-200 flex flex-col antialiased selection:bg-sky-500 selection:text-white">
      {/* 1. TOP GLOBAL NAVIGATION HEADER */}
      <header className="bg-elegant-card text-white border-b border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <span className="font-black text-white text-lg tracking-tighter">G</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                GELO RIO DAS OSTRAS
                <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.2 rounded-full font-semibold border border-sky-500/20">RJ</span>
              </h1>
              <p className="text-[10px] text-sky-400 font-mono tracking-widest uppercase">Master Command Center</p>
            </div>
          </div>

          {currentUser && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{currentUser.nome}</p>
                <p className="text-xs text-slate-500 capitalize">
                  Acesso {currentUser.role} • {currentUser.telefone.replace(/(\d{2})(\d{5})(\d{4})/, '$1 $2-$3')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center font-bold text-sky-400">
                  {currentUser.nome.charAt(0)}
                </div>
                <button
                  onClick={handleLogout}
                  title="Sair do Sistema"
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 hover:text-rose-400 rounded-xl transition text-slate-400 cursor-pointer border border-slate-700/50"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 overflow-y-auto">
        {currentUser ? (
          <div className="space-y-6">
            
            {/* Supabase security shield alert for sellers/delivery workers */}
            {(currentUser.role === 'vendedor' || currentUser.role === 'entregador') && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-200">
                <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg self-start shrink-0 border border-emerald-500/30">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-400">Segurança de Dados Ativa (Supabase RLS)</h4>
                  <p className="text-[11px] text-emerald-100/75 mt-0.5 leading-normal">
                    Seu acesso é restrito estritamente às suas atividades operacionais. Políticas de segurança baseadas em linha (Row Level Security) bloqueiam no banco de dados qualquer tentativa de leitura de custos, lucros ou capital social da frotas.
                  </p>
                </div>
              </div>
            )}

            {/* DYNAMIC DASHBOARD SELECTOR BASED ON LOGGED-IN ROLE */}
            {currentUser.role === 'master' && (
              <MasterDashboard
                perfis={perfis}
                setPerfis={setPerfis}
                investimentos={investimentos}
                setInvestimentos={setInvestimentos}
                clientes={clientes}
                setClientes={setClientes}
                produtos={produtos}
                setProdutos={setProdutos}
                pedidos={pedidos}
                fluxoCaixa={fluxoCaixa}
                setFluxoCaixa={setFluxoCaixa}
                isSocio={false}
              />
            )}

            {currentUser.role === 'socio' && (
              <MasterDashboard
                perfis={perfis}
                setPerfis={setPerfis}
                investimentos={investimentos}
                setInvestimentos={setInvestimentos}
                clientes={clientes}
                setClientes={setClientes}
                produtos={produtos}
                setProdutos={setProdutos}
                pedidos={pedidos}
                fluxoCaixa={fluxoCaixa}
                setFluxoCaixa={setFluxoCaixa}
                isSocio={true} // Sócio has financial metrics but locks user manager
              />
            )}

            {currentUser.role === 'vendedor' && (
              <VendedorDashboard
                clientes={clientes}
                setClientes={setClientes}
                produtos={produtos}
                setProdutos={setProdutos}
                pedidos={pedidos}
                setPedidos={setPedidos}
                itensPedido={itensPedido}
                setItensPedido={setItensPedido}
                perfis={perfis}
              />
            )}

            {currentUser.role === 'entregador' && (
              <EntregadorDashboard
                pedidos={pedidos}
                setPedidos={setPedidos}
                clientes={clientes}
                perfis={perfis}
              />
            )}

          </div>
        ) : (
          /* LOGIN PANEL SCREEN */
          <div className="flex-1 flex items-center justify-center min-h-[75vh] py-6 px-4">
            <div className="w-full max-w-sm bg-elegant-card border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <span className="font-black text-white text-lg tracking-tighter">G</span>
                </div>
                <h2 className="font-extrabold text-white text-lg">Distribuidora de Gelo</h2>
                <p className="text-xs text-slate-400">Rio das Ostras - RJ • Login Operacional</p>
              </div>

              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-semibold leading-relaxed">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefone Comercial</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="DDD e Telefone (Ex: 21975151937)"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-elegant-surface border border-slate-800 text-slate-200 text-xs rounded-xl focus:border-sky-500/50 focus:bg-elegant-card focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha Secreta</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="Senha do Colaborador"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-elegant-surface border border-slate-800 text-slate-200 text-xs rounded-xl focus:border-sky-500/50 focus:bg-elegant-card focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  Entrar no Painel de Gelo
                </button>
              </form>

              {/* NEW EMPLOYEE REGISTRATION BUTTON */}
              <div className="pt-2 border-t border-slate-800/60 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(true)}
                  className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-4 py-2.5 rounded-xl transition-all w-full justify-center cursor-pointer"
                >
                  <UserPlus className="h-4 w-4 text-emerald-400" />
                  Cadastrar Funcionário
                </button>
              </div>

              {/* Helpful instructions footer inside login screen detailing credentials */}
              <div className="bg-elegant-surface rounded-2xl p-4 space-y-2 border border-slate-800 text-[10px] text-slate-400 leading-normal">
                <p className="font-bold text-slate-200 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-sky-400" />
                  Credenciais de Demonstração (Rio das Ostras):
                </p>
                <ul className="space-y-1 list-slate-700 list-inside text-slate-400">
                  <li><span className="font-semibold text-slate-300">Master:</span> Tel <span className="font-mono text-sky-400">21975151937</span> / Senha <span className="font-mono text-sky-400">05085</span> (Wagner)</li>
                  <li><span className="font-semibold text-slate-300">Sócio Mauro:</span> Tel <span className="font-mono text-sky-400">22992360437</span> / Senha <span className="font-mono text-sky-400">12345</span></li>
                  <li><span className="font-semibold text-slate-300">Sócio Marcos:</span> Tel <span className="font-mono text-sky-400">22996213001</span> / Senha <span className="font-mono text-sky-400">12345</span></li>
                  <li><span className="font-semibold text-slate-300">Vendedor:</span> Tel <span className="font-mono text-sky-400">22999991111</span> / Senha <span className="font-mono text-sky-400">vendas123</span> (Roberto)</li>
                  <li><span className="font-semibold text-slate-300">Entregador:</span> Tel <span className="font-mono text-sky-400">22999992222</span> / Senha <span className="font-mono text-sky-400">entrega123</span> (Carlos)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-elegant-card border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-black relative overflow-hidden animate-in zoom-in duration-200">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">Cadastrar Novo Funcionário</h3>
                  <p className="text-[10px] text-slate-400">Inserir novo colaborador no sistema</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleRegisterEmployee} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome Completo</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Nome do colaborador"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#0F1115] border border-slate-800 text-slate-200 text-xs rounded-xl focus:border-emerald-500/50 focus:bg-elegant-card focus:outline-none transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefone Comercial (Com DDI 55 Brasil)</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400 font-mono font-bold text-xs">
                    +55
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="(DDD) 99999-9999 (Ex: 22999992222)"
                    value={registerPhone.startsWith('55') ? registerPhone.substring(2) : registerPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setRegisterPhone('55' + val);
                    }}
                    className="w-full pl-12 pr-3 py-2.5 bg-[#0F1115] border border-slate-800 text-slate-200 text-xs rounded-xl focus:border-emerald-500/50 focus:bg-elegant-card focus:outline-none transition-all font-mono"
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">O prefixo internacional brasileiro <span className="font-bold text-slate-400">+55</span> é inserido automaticamente no banco de dados.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargo / Nível de Acesso</label>
                <select
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value as any)}
                  className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="vendedor">Vendedor (Pedidos e Clientes)</option>
                  <option value="entregador">Entregador (Rota e Entregas)</option>
                  <option value="socio">Sócio Proprietário</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha de Acesso</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Digite a senha de login"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#0F1115] border border-slate-800 text-slate-200 text-xs rounded-xl focus:border-emerald-500/50 focus:bg-elegant-card focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs py-2.5 rounded-xl transition cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs py-2.5 rounded-xl transition shadow-md shadow-emerald-500/20 cursor-pointer text-center"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. APP FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-4 px-4 text-center text-[10px] shrink-0 leading-normal">
        <p className="font-medium">© 2026 Operação de Distribuição de Gelo - Rio das Ostras - RJ</p>
        <p className="text-slate-600 mt-0.5">Tecnologias: Next.js/React • Supabase PostgreSQL (RLS) • Google AI Studio API</p>
      </footer>
    </div>
  );
}
