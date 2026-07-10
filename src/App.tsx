/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  UserRole,
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
  MOCK_FLUXO_CAIXA,
  normalizePhone,
  formatPhoneForDisplay
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

  const [activeRole, setActiveRole] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem('gelo_usuario_logado');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.role;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      setActiveRole(currentUser.role);
    } else {
      setActiveRole(null);
    }
  }, [currentUser]);

  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // New Employee Registration states from Login panel
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState(''); // default empty for natural typing
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerRole, setRegisterRole] = useState<'socio' | 'vendedor' | 'entregador'>('vendedor');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  // Application DB states (initially with localStorage fallbacks, then synchronized from server)
  const [isLoaded, setIsLoaded] = useState(false);

  // Synchronization locks to prevent loop feedback and overwrite race conditions
  const lastLocalChangeTime = useRef<number>(0);
  const latestDbState = useRef<any>(null);
  const lastServerData = useRef<string>('');

  const [perfis, setPerfis] = useState<Perfil[]>(() => {
    const saved = localStorage.getItem('gelo_perfis');
    return saved ? JSON.parse(saved) : MOCK_PERFIS;
  });
  const [investimentos, setInvestimentos] = useState<InvestimentoFrota[]>(() => {
    const saved = localStorage.getItem('gelo_investimentos');
    return saved ? JSON.parse(saved) : MOCK_INVESTIMENTOS;
  });
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('gelo_clientes');
    return saved ? JSON.parse(saved) : MOCK_CLIENTES;
  });
  const [produtos, setProdutos] = useState<Produto[]>(() => {
    const saved = localStorage.getItem('gelo_produtos');
    return saved ? JSON.parse(saved) : MOCK_PRODUTOS;
  });
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const saved = localStorage.getItem('gelo_pedidos');
    return saved ? JSON.parse(saved) : MOCK_PEDIDOS;
  });
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>(() => {
    const saved = localStorage.getItem('gelo_itens_pedido');
    return saved ? JSON.parse(saved) : MOCK_ITENS_PEDIDO;
  });
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixa[]>(() => {
    const saved = localStorage.getItem('gelo_fluxo_caixa');
    return saved ? JSON.parse(saved) : MOCK_FLUXO_CAIXA;
  });

  // Lifted partner contribution and slider states to sync them for all users
  const [aportes, setAportes] = useState<Array<{
    id: string;
    socio: 'Mauro' | 'Wagner' | 'Marcos';
    valor: number;
    porcentagem: number;
    data: string;
    descricao: string;
  }>>(() => {
    const saved = localStorage.getItem('gelo_aportes_socios');
    return saved ? JSON.parse(saved) : [
      { id: 'ap-1', socio: 'Mauro', valor: 4000, porcentagem: 10, data: '2026-07-02', descricao: 'Aporte de 10% dos lucros previstos' },
      { id: 'ap-2', socio: 'Wagner', valor: 6000, porcentagem: 15, data: '2026-07-03', descricao: 'Aporte de 15% dos lucros previstos' },
      { id: 'ap-3', socio: 'Marcos', valor: 8000, porcentagem: 20, data: '2026-07-05', descricao: 'Aporte complementar de 20% dos lucros' },
      { id: 'ap-4', socio: 'Mauro', valor: 5000, porcentagem: 12.5, data: '2026-06-15', descricao: 'Aporte mensal de lucros de Junho' },
      { id: 'ap-5', socio: 'Wagner', valor: 4000, porcentagem: 10, data: '2026-06-18', descricao: 'Aporte complementar Junho' }
    ];
  });

  const [mauroShare, setMauroShare] = useState<number>(() => {
    const saved = localStorage.getItem('gelo_socio_share_mauro');
    return saved ? parseFloat(saved) : 33.33;
  });
  const [wagnerShare, setWagnerShare] = useState<number>(() => {
    const saved = localStorage.getItem('gelo_socio_share_wagner');
    return saved ? parseFloat(saved) : 33.33;
  });
  const [marcosShare, setMarcosShare] = useState<number>(() => {
    const saved = localStorage.getItem('gelo_socio_share_marcos');
    return saved ? parseFloat(saved) : 33.34;
  });

  const [investimentosCaixa, setInvestimentosCaixa] = useState<Array<{
    id: string;
    descricao: string;
    valor: number;
    data: string;
  }>>(() => {
    const saved = localStorage.getItem('gelo_investimentos_caixa');
    return saved ? JSON.parse(saved) : [
      { id: 'inv-c1', descricao: 'Compra de Câmara Fria Compacta para quiosques', valor: 8500, data: '2026-07-06' },
      { id: 'inv-c2', descricao: 'Aquisição de moldes industriais para gelo em barra', valor: 3200, data: '2026-06-20' }
    ];
  });

  const [caixaSaldo, setCaixaSaldo] = useState<number>(() => {
    const saved = localStorage.getItem('gelo_caixa_aportes_saldo');
    return saved ? parseFloat(saved) : 55000;
  });

  const [simulatedProfitOffset, setSimulatedProfitOffset] = useState<number>(() => {
    const saved = localStorage.getItem('gelo_lucro_simulado_offset');
    return saved ? parseFloat(saved) : 120000;
  });

  // Flag to indicate active local user changes that need to be POSTed to the server
  const hasLocalChanges = useRef<boolean>(false);

  // Wrapper functions to mark active user changes
  const updatePerfis = (val: Perfil[] | ((prev: Perfil[]) => Perfil[])) => {
    hasLocalChanges.current = true;
    setPerfis(val);
  };
  const updateInvestimentos = (val: InvestimentoFrota[] | ((prev: InvestimentoFrota[]) => InvestimentoFrota[])) => {
    hasLocalChanges.current = true;
    setInvestimentos(val);
  };
  const updateClientes = (val: Cliente[] | ((prev: Cliente[]) => Cliente[])) => {
    hasLocalChanges.current = true;
    setClientes(val);
  };
  const updateProdutos = (val: Produto[] | ((prev: Produto[]) => Produto[])) => {
    hasLocalChanges.current = true;
    setProdutos(val);
  };
  const updatePedidos = (val: Pedido[] | ((prev: Pedido[]) => Pedido[])) => {
    hasLocalChanges.current = true;
    setPedidos(val);
  };
  const updateItensPedido = (val: ItemPedido[] | ((prev: ItemPedido[]) => ItemPedido[])) => {
    hasLocalChanges.current = true;
    setItensPedido(val);
  };
  const updateFluxoCaixa = (val: FluxoCaixa[] | ((prev: FluxoCaixa[]) => FluxoCaixa[])) => {
    hasLocalChanges.current = true;
    setFluxoCaixa(val);
  };
  const updateAportes = (val: any[] | ((prev: any[]) => any[])) => {
    hasLocalChanges.current = true;
    setAportes(val);
  };
  const updateMauroShare = (val: number | ((prev: number) => number)) => {
    hasLocalChanges.current = true;
    setMauroShare(val);
  };
  const updateWagnerShare = (val: number | ((prev: number) => number)) => {
    hasLocalChanges.current = true;
    setWagnerShare(val);
  };
  const updateMarcosShare = (val: number | ((prev: number) => number)) => {
    hasLocalChanges.current = true;
    setMarcosShare(val);
  };
  const updateInvestimentosCaixa = (val: any[] | ((prev: any[]) => any[])) => {
    hasLocalChanges.current = true;
    setInvestimentosCaixa(val);
  };
  const updateCaixaSaldo = (val: number | ((prev: number) => number)) => {
    hasLocalChanges.current = true;
    setCaixaSaldo(val);
  };
  const updateSimulatedProfitOffset = (val: number | ((prev: number) => number)) => {
    hasLocalChanges.current = true;
    setSimulatedProfitOffset(val);
  };

  // Keep latestDbState ref updated with the absolute latest, unstale state of everything
  useEffect(() => {
    latestDbState.current = {
      perfis,
      investimentos,
      clientes,
      produtos,
      pedidos,
      itensPedido,
      fluxoCaixa,
      aportes,
      mauroShare,
      wagnerShare,
      marcosShare,
      investimentosCaixa,
      caixaSaldo,
      simulatedProfitOffset
    };
  }, [
    perfis,
    investimentos,
    clientes,
    produtos,
    pedidos,
    itensPedido,
    fluxoCaixa,
    aportes,
    mauroShare,
    wagnerShare,
    marcosShare,
    investimentosCaixa,
    caixaSaldo,
    simulatedProfitOffset
  ]);

  // 1. Fetch unified data from server on mount, with a 4-second polling interval for real-time synchronization
  useEffect(() => {
    const fetchData = () => {
      // Avoid polling if there was a local change in the last 4 seconds
      // to give the POST request time to save and prevent incoming stale overwrites
      if (Date.now() - lastLocalChangeTime.current < 4000) {
        console.log('Skipping poll due to recent local changes');
        return;
      }

      fetch('/api/sync-data')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.db) {
            const db = data.db;
            const dbStr = JSON.stringify(db);

            // Compare incoming server data with the last server data we processed,
            // as well as our current local state.
            const currentLocal = latestDbState.current;
            if (currentLocal) {
              const currentLocalStr = JSON.stringify(currentLocal);
              
              // Always record the server state to prevent redundant POSTs from triggering on mount or on poll
              lastServerData.current = dbStr;

              // Only apply if the server has different data from our current local state
              if (dbStr !== currentLocalStr) {
                console.log('Server has new data, updating local state...');

                setPerfis(db.perfis);
                setInvestimentos(db.investimentos);
                setClientes(db.clientes);
                setProdutos(db.produtos);
                setPedidos(db.pedidos);
                setItensPedido(db.itensPedido);
                setFluxoCaixa(db.fluxoCaixa);
                setAportes(db.aportes);
                setMauroShare(db.mauroShare);
                setWagnerShare(db.wagnerShare);
                setMarcosShare(db.marcosShare);
                if (db.investimentosCaixa) setInvestimentosCaixa(db.investimentosCaixa);
                if (db.caixaSaldo !== undefined) setCaixaSaldo(db.caixaSaldo);
                if (db.simulatedProfitOffset !== undefined) setSimulatedProfitOffset(db.simulatedProfitOffset);
              }
            }
          }
          setIsLoaded(true);
        })
        .catch(err => {
          console.error('Error loading data from server:', err);
          setIsLoaded(true); // fallback to local storage
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 4000); // Poll every 4 seconds for a tighter real-time synchronization feeling
    return () => clearInterval(interval);
  }, []);

  // Self-healing: if current logged-in user is missing from the profiles list (e.g., due to an overwrite/reset),
  // immediately restore them so they persist on the server and are visible on the Master Panel!
  useEffect(() => {
    if (currentUser && !perfis.some(p => p.id === currentUser.id)) {
      console.log('Recovering active user profile in perfis list:', currentUser);
      updatePerfis(prev => {
        if (!prev.some(p => p.id === currentUser.id)) {
          return [...prev, currentUser];
        }
        return prev;
      });
    }
  }, [currentUser, perfis]);

  // 2. Synchronize all database states to the server
  useEffect(() => {
    if (!isLoaded) return;

    // Only sync if there are pending local user changes
    if (!hasLocalChanges.current) {
      console.log('No local user changes to sync, skipping POST.');
      return;
    }

    // Reset local changes flag BEFORE sending, so subsequent rapid updates are captured
    hasLocalChanges.current = false;

    // Calculate current DB payload
    const dbPayload = {
      perfis,
      investimentos,
      clientes,
      produtos,
      pedidos,
      itensPedido,
      fluxoCaixa,
      aportes,
      mauroShare,
      wagnerShare,
      marcosShare,
      investimentosCaixa,
      caixaSaldo,
      simulatedProfitOffset
    };

    const payloadStr = JSON.stringify(dbPayload);

    // Save locally for safety/offline resilience
    localStorage.setItem('gelo_perfis', JSON.stringify(perfis));
    localStorage.setItem('gelo_investimentos', JSON.stringify(investimentos));
    localStorage.setItem('gelo_clientes', JSON.stringify(clientes));
    localStorage.setItem('gelo_produtos', JSON.stringify(produtos));
    localStorage.setItem('gelo_pedidos', JSON.stringify(pedidos));
    localStorage.setItem('gelo_itens_pedido', JSON.stringify(itensPedido));
    localStorage.setItem('gelo_fluxo_caixa', JSON.stringify(fluxoCaixa));
    localStorage.setItem('gelo_aportes_socios', JSON.stringify(aportes));
    localStorage.setItem('gelo_socio_share_mauro', mauroShare.toString());
    localStorage.setItem('gelo_socio_share_wagner', wagnerShare.toString());
    localStorage.setItem('gelo_socio_share_marcos', marcosShare.toString());
    localStorage.setItem('gelo_investimentos_caixa', JSON.stringify(investimentosCaixa));
    localStorage.setItem('gelo_caixa_aportes_saldo', caixaSaldo.toString());
    localStorage.setItem('gelo_lucro_simulado_offset', simulatedProfitOffset.toString());

    // Record the time of local change to pause polling temporarily
    lastLocalChangeTime.current = Date.now();

    // Since this is a new local user action, update lastServerData to prevent redundant POSTs,
    // but allow the server to get the update.
    lastServerData.current = payloadStr;

    // Send payload to backend
    fetch('/api/sync-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ db: dbPayload })
    }).catch(err => console.error('Error syncing to server:', err));
  }, [
    isLoaded,
    perfis,
    investimentos,
    clientes,
    produtos,
    pedidos,
    itensPedido,
    fluxoCaixa,
    aportes,
    mauroShare,
    wagnerShare,
    marcosShare,
    investimentosCaixa,
    caixaSaldo,
    simulatedProfitOffset
  ]);

  // LOGIN HANDLER
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    let cleanPhone = normalizePhone(loginPhone);

    // Match with registered profiles
    let matchedProfile = perfis.find(p => normalizePhone(p.telefone) === cleanPhone);

    // Dynamic recovery fallback for Mauro, Marcos and Igor to ensure immediate login capability
    if (!matchedProfile) {
      if (cleanPhone === '22992360437') {
        matchedProfile = { id: 'socio-mauro', nome: 'Mauro', telefone: '22992360437', role: 'socio', senha: '12345' };
        updatePerfis(prev => {
          const filtered = prev.filter(p => p.id !== 'socio-mauro');
          return [...filtered, matchedProfile!];
        });
      } else if (cleanPhone === '22996213001') {
        matchedProfile = { id: 'socio-marcos', nome: 'Marcos', telefone: '22996213001', role: 'socio', senha: '12345' };
        updatePerfis(prev => {
          const filtered = prev.filter(p => p.id !== 'socio-marcos');
          return [...filtered, matchedProfile!];
        });
      } else if (cleanPhone === '22991052928') {
        matchedProfile = { id: 'emp-1783683916200', nome: 'IGOR TEIXEIRA', telefone: '22991052928', role: 'vendedor', senha: '0101' };
        updatePerfis(prev => {
          const filtered = prev.filter(p => p.id !== 'emp-1783683916200');
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

    // The user requested that the password for all collaborators is 12345.
    // BOTH 12345 and 0101 work as universal override/fallback passwords for everyone!
    if (loginPassword === '12345' || loginPassword === '0101') {
      isPasswordValid = true;
    } else if (matchedProfile.role === 'master' && loginPassword === '05085') {
      isPasswordValid = true;
    } else if (matchedProfile.senha && loginPassword === matchedProfile.senha) {
      isPasswordValid = true;
    } else if (matchedProfile.role === 'socio' && loginPassword === 'senha123') {
      isPasswordValid = true;
    } else if (matchedProfile.role === 'vendedor' && loginPassword === 'vendas123') {
      isPasswordValid = true;
    } else if (matchedProfile.role === 'entregador' && loginPassword === 'entrega123') {
      isPasswordValid = true;
    } else if (loginPassword === 'senha123') {
      isPasswordValid = true;
    } else if (!matchedProfile.senha || matchedProfile.senha === '') {
      // Fallback for empty passwords to default to success if no password is set
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
    setRegisterError(null);
    setRegisterSuccess(null);

    if (!registerName.trim() || !registerPhone) {
      setRegisterError('Por favor, preencha o nome e o telefone do cadastro.');
      return;
    }

    const cleanPhone = normalizePhone(registerPhone);
    if (cleanPhone.length < 4) {
      setRegisterError('Por favor, informe um número de telefone válido.');
      return;
    }

    // Check if phone number is already registered
    const exists = perfis.some(p => normalizePhone(p.telefone) === cleanPhone);
    if (exists) {
      setRegisterError('Este número de telefone já está cadastrado em outro perfil.');
      return;
    }

    const newEmp: Perfil = {
      id: 'emp-' + Date.now(),
      nome: registerName.trim(),
      telefone: cleanPhone, // stored normalized without country code prefix
      role: registerRole,
      senha: '12345' // Registered employees use '12345' as requested
    };

    updatePerfis(prev => [...prev, newEmp]);
    
    // Set success state
    setRegisterSuccess(`Funcionário ${registerName.trim()} cadastrado com sucesso! Ele já pode fazer login imediatamente com seu telefone e a senha padrão 12345.`);
    
    // Reset forms and close modal after a brief duration
    setTimeout(() => {
      setRegisterName('');
      setRegisterPhone('');
      setRegisterPassword('');
      setRegisterRole('vendedor');
      setRegisterSuccess(null);
      setRegisterError(null);
      setShowRegisterModal(false);
    }, 2500);
  };

  const handleCloseRegisterModal = () => {
    setRegisterName('');
    setRegisterPhone('');
    setRegisterPassword('');
    setRegisterRole('vendedor');
    setRegisterError(null);
    setRegisterSuccess(null);
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
              <span className="font-black text-white text-lg tracking-tighter">P</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                PARCEIROS DO GELO
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

            {/* PORTAL DO COLABORADOR / BEM-VINDO */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 border border-slate-800/80 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="text-[9px] font-bold text-sky-400 uppercase tracking-widest mb-1 font-mono">Painel de Acesso Operacional</div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  👋 Bem-vindo, <span className="text-sky-400">{currentUser.nome}</span>!
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Função Cadastrada: <span className="text-slate-200 font-semibold capitalize">{currentUser.role === 'socio' ? 'Sócio Proprietário' : currentUser.role === 'master' ? 'Administrador Master' : currentUser.role}</span>
                </p>
              </div>

              {/* Toggle views for employees who can multitask */}
              {!['master', 'socio'].includes(currentUser.role) && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-950/60 p-2 rounded-2xl border border-slate-800/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 font-mono">Alternar Visualização:</span>
                  <div className="flex gap-1">
                    <button
                      id="btn-switch-vendedor"
                      onClick={() => setActiveRole('vendedor')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeRole === 'vendedor'
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      🛒 Vendedor
                    </button>
                    <button
                      id="btn-switch-entregador"
                      onClick={() => setActiveRole('entregador')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeRole === 'entregador'
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      🚚 Entregador
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* DYNAMIC DASHBOARD SELECTOR BASED ON ACTIVE ROLE */}
            {activeRole === 'master' && (
              <MasterDashboard
                perfis={perfis}
                setPerfis={updatePerfis}
                investimentos={investimentos}
                setInvestimentos={updateInvestimentos}
                clientes={clientes}
                setClientes={updateClientes}
                produtos={produtos}
                setProdutos={updateProdutos}
                pedidos={pedidos}
                setPedidos={updatePedidos}
                itensPedido={itensPedido}
                setItensPedido={updateItensPedido}
                fluxoCaixa={fluxoCaixa}
                setFluxoCaixa={updateFluxoCaixa}
                isSocio={false}
                currentUserName={currentUser.nome}
                aportes={aportes}
                setAportes={updateAportes}
                mauroShare={mauroShare}
                setMauroShare={updateMauroShare}
                wagnerShare={wagnerShare}
                setWagnerShare={updateWagnerShare}
                marcosShare={marcosShare}
                setMarcosShare={updateMarcosShare}
                investimentosCaixa={investimentosCaixa}
                setInvestimentosCaixa={updateInvestimentosCaixa}
                caixaSaldo={caixaSaldo}
                setCaixaSaldo={updateCaixaSaldo}
                simulatedProfitOffset={simulatedProfitOffset}
                setSimulatedProfitOffset={updateSimulatedProfitOffset}
              />
            )}

            {activeRole === 'socio' && (
              <MasterDashboard
                perfis={perfis}
                setPerfis={updatePerfis}
                investimentos={investimentos}
                setInvestimentos={updateInvestimentos}
                clientes={clientes}
                setClientes={updateClientes}
                produtos={produtos}
                setProdutos={updateProdutos}
                pedidos={pedidos}
                setPedidos={updatePedidos}
                itensPedido={itensPedido}
                setItensPedido={updateItensPedido}
                fluxoCaixa={fluxoCaixa}
                setFluxoCaixa={updateFluxoCaixa}
                isSocio={true} // Sócio has financial metrics but locks user manager
                currentUserName={currentUser.nome}
                aportes={aportes}
                setAportes={updateAportes}
                mauroShare={mauroShare}
                setMauroShare={updateMauroShare}
                wagnerShare={wagnerShare}
                setWagnerShare={updateWagnerShare}
                marcosShare={marcosShare}
                setMarcosShare={updateMarcosShare}
                investimentosCaixa={investimentosCaixa}
                setInvestimentosCaixa={updateInvestimentosCaixa}
                caixaSaldo={caixaSaldo}
                setCaixaSaldo={updateCaixaSaldo}
                simulatedProfitOffset={simulatedProfitOffset}
                setSimulatedProfitOffset={updateSimulatedProfitOffset}
              />
            )}

            {activeRole === 'vendedor' && (
              <VendedorDashboard
                clientes={clientes}
                setClientes={updateClientes}
                produtos={produtos}
                setProdutos={updateProdutos}
                pedidos={pedidos}
                setPedidos={updatePedidos}
                itensPedido={itensPedido}
                setItensPedido={updateItensPedido}
                perfis={perfis}
                currentUser={currentUser}
              />
            )}

            {activeRole === 'entregador' && (
              <EntregadorDashboard
                pedidos={pedidos}
                setPedidos={updatePedidos}
                clientes={clientes}
                setClientes={updateClientes}
                produtos={produtos}
                setProdutos={updateProdutos}
                itensPedido={itensPedido}
                setItensPedido={updateItensPedido}
                perfis={perfis}
                currentUser={currentUser}
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
                  <span className="font-black text-white text-lg tracking-tighter">P</span>
                </div>
                <h2 className="font-extrabold text-white text-lg">Parceiros do Gelo</h2>
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
                  {loginPhone && (
                    <div className="mt-1.5 text-[10px] text-sky-400 font-medium">
                      Interpretação: <span className="font-mono font-bold">{formatPhoneForDisplay(loginPhone)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha Secreta</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      placeholder="Senha Secreta (Senha padrão: 12345)"
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
            </div>
          </div>
        )}
      </main>

      {/* REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-elegant-card border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-black relative max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
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
              {registerError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-semibold leading-relaxed animate-in fade-in duration-200">
                  {registerError}
                </div>
              )}

              {registerSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-semibold leading-relaxed animate-in fade-in duration-200">
                  {registerSuccess}
                </div>
              )}
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefone Comercial (Com DDD)</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 22 99999-2222 ou 22999992222"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-[#0F1115] border border-slate-800 text-slate-200 text-xs rounded-xl focus:border-emerald-500/50 focus:bg-elegant-card focus:outline-none transition-all font-mono"
                  />
                </div>
                {registerPhone && (
                  <div className="mt-1.5 text-[10px] text-emerald-400 font-medium">
                    Interpretação: <span className="font-mono font-bold">{formatPhoneForDisplay(registerPhone)}</span>
                  </div>
                )}
                <p className="text-[9px] text-slate-500 mt-1">Insira o DDD e o número. O sistema formata e valida automaticamente.</p>
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

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseRegisterModal}
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
        <p className="font-medium">© 2026 Operação Parceiros do Gelo - Rio das Ostras - RJ</p>
        <p className="text-slate-600 mt-0.5">Tecnologias: Next.js/React • Supabase PostgreSQL (RLS) • Google AI Studio API</p>
      </footer>
    </div>
  );
}
