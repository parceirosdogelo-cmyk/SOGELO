/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Truck,
  Users,
  Package,
  FileText,
  Activity,
  Plus,
  Trash2,
  AlertTriangle,
  Flame,
  Thermometer,
  Calendar,
  CloudSun,
  Shield,
  Copy,
  CheckCircle,
  Database,
  Building,
  Pencil,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Perfil,
  InvestimentoFrota,
  Cliente,
  Produto,
  Pedido,
  FluxoCaixa,
  SUPABASE_SQL_SCRIPT,
  normalizePhone
} from '../types';

interface MasterDashboardProps {
  perfis: Perfil[];
  setPerfis: React.Dispatch<React.SetStateAction<Perfil[]>>;
  investimentos: InvestimentoFrota[];
  setInvestimentos: React.Dispatch<React.SetStateAction<InvestimentoFrota[]>>;
  clientes: Cliente[];
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  produtos: Produto[];
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>;
  pedidos: Pedido[];
  fluxoCaixa: FluxoCaixa[];
  setFluxoCaixa: React.Dispatch<React.SetStateAction<FluxoCaixa[]>>;
  isSocio?: boolean; // Sócio has restricted admin control (no user/employee management)
  currentUserName?: string;
}

export default function MasterDashboard({
  perfis,
  setPerfis,
  investimentos,
  setInvestimentos,
  clientes,
  setClientes,
  produtos,
  setProdutos,
  pedidos,
  fluxoCaixa,
  setFluxoCaixa,
  isSocio = false,
  currentUserName = '',
}: MasterDashboardProps) {
  const [activeTab, setActiveTab] = useState<'finance' | 'ai' | 'fleet' | 'products' | 'employees' | 'clients' | 'socios'>('finance');

  // Partners Fund & Contribution types and states
  // We define these types inline or use them in our states
  // Mauro, Wagner and Marcos are our partners
  const [aportes, setAportes] = useState<Array<{
    id: string;
    socio: 'Mauro' | 'Wagner' | 'Marcos';
    valor: number;
    porcentagem: number;
    data: string;
    descricao: string;
  }>>(() => {
    const saved = localStorage.getItem('gelo_aportes_socios');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'ap-1', socio: 'Mauro', valor: 4000, porcentagem: 10, data: '2026-07-02', descricao: 'Aporte de 10% dos lucros previstos' },
      { id: 'ap-2', socio: 'Wagner', valor: 6000, porcentagem: 15, data: '2026-07-03', descricao: 'Aporte de 15% dos lucros previstos' },
      { id: 'ap-3', socio: 'Marcos', valor: 8000, porcentagem: 20, data: '2026-07-05', descricao: 'Aporte complementar de 20% dos lucros' },
      { id: 'ap-4', socio: 'Mauro', valor: 5000, porcentagem: 12.5, data: '2026-06-15', descricao: 'Aporte mensal de lucros de Junho' },
      { id: 'ap-5', socio: 'Wagner', valor: 4000, porcentagem: 10, data: '2026-06-18', descricao: 'Aporte complementar Junho' }
    ];
  });

  const [investimentosCaixa, setInvestimentosCaixa] = useState<Array<{
    id: string;
    descricao: string;
    valor: number;
    data: string;
  }>>(() => {
    const saved = localStorage.getItem('gelo_investimentos_caixa');
    if (saved) return JSON.parse(saved);
    return [
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
    return saved ? parseFloat(saved) : 120000; // Default offset of 120k for demo
  });

  // State sync effects
  React.useEffect(() => {
    localStorage.setItem('gelo_aportes_socios', JSON.stringify(aportes));
  }, [aportes]);

  React.useEffect(() => {
    localStorage.setItem('gelo_investimentos_caixa', JSON.stringify(investimentosCaixa));
  }, [investimentosCaixa]);

  React.useEffect(() => {
    localStorage.setItem('gelo_caixa_aportes_saldo', JSON.stringify(caixaSaldo));
  }, [caixaSaldo]);

  React.useEffect(() => {
    localStorage.setItem('gelo_lucro_simulado_offset', JSON.stringify(simulatedProfitOffset));
  }, [simulatedProfitOffset]);

  // Partners specific form inputs
  const [mauroPercent, setMauroPercent] = useState('10');
  const [wagnerPercent, setWagnerPercent] = useState('10');
  const [marcosPercent, setMarcosPercent] = useState('10');

  const [newFundInvestment, setNewFundInvestment] = useState({
    descricao: '',
    valor: ''
  });

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMonth, setReportMonth] = useState('2026-07');

  // Form states
  const [newTransaction, setNewTransaction] = useState({
    tipo: 'despesa' as 'entrada' | 'despesa',
    categoria: 'combustível' as any,
    valor: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0]
  });

  const [newVehicle, setNewVehicle] = useState({
    veiculo: '',
    valor: '',
    proprietario: 'Wagner' as 'Wagner' | 'Mauro',
    data_aquisicao: new Date().toISOString().split('T')[0]
  });

  const [newProduct, setNewProduct] = useState({
    nome: '',
    preco_custo: '',
    preco_venda: '',
    estoque_atual: ''
  });

  const [newEmployee, setNewEmployee] = useState({
    nome: '',
    telefone: '',
    role: 'vendedor' as 'vendedor' | 'entregador' | 'socio'
  });

  const [newClient, setNewClient] = useState({
    nome_estabelecimento: '',
    tipo: 'quiosque' as 'quiosque' | 'bar' | 'depósito' | 'evento',
    endereco: '',
    telefone: '',
    latitude: -22.5200,
    longitude: -41.9400
  });

  const [editingTransaction, setEditingTransaction] = useState<FluxoCaixa | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<InvestimentoFrota | null>(null);

  // AI Forecast parameters
  const [forecastParams, setForecastParams] = useState({
    temperature: 31,
    isWeekend: true,
    isHoliday: false
  });
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState<any>(null);

  // Copied SQL state
  const [sqlCopied, setSqlCopied] = useState(false);

  // FINANCIAL CALCULATIONS
  const stats = useMemo(() => {
    let entradas = 0;
    let despesas = 0;

    fluxoCaixa.forEach(t => {
      if (t.tipo === 'entrada') entradas += t.valor;
      else despesas += t.valor;
    });

    // Also include completed orders inside total entries
    const completedOrdersValue = pedidos
      .filter(p => p.status === 'Entregue')
      .reduce((sum, p) => sum + p.valor_total, 0);

    const totalRevenue = entradas + completedOrdersValue;
    const netProfit = totalRevenue - despesas;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Total fleet investment
    const totalFleet = investimentos.reduce((sum, i) => sum + i.valor, 0);

    return {
      totalRevenue,
      totalExpenses: despesas,
      netProfit,
      margin,
      totalFleet
    };
  }, [fluxoCaixa, pedidos, investimentos]);

  // Aggregated charts data
  const chartData = useMemo(() => {
    // Group transactions and deliveries by category for Pie Chart
    const categories: Record<string, number> = {};
    fluxoCaixa.forEach(t => {
      if (t.tipo === 'despesa') {
        categories[t.categoria] = (categories[t.categoria] || 0) + t.valor;
      }
    });

    const pieData = Object.entries(categories).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));

    // Group entries/expenses by date for Area Chart
    const dailyMap: Record<string, { date: string; entradas: number; despesas: number }> = {};
    
    // Add base dates
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap[dateStr] = { date: dateStr.split('-').slice(1).join('/'), entradas: 0, despesas: 0 };
    }

    // Populate fluxo_caixa entries
    fluxoCaixa.forEach(t => {
      const dateStr = t.data;
      const chartKey = dateStr;
      if (dailyMap[chartKey]) {
        if (t.tipo === 'entrada') dailyMap[chartKey].entradas += t.valor;
        else dailyMap[chartKey].despesas += t.valor;
      }
    });

    // Populate completed deliveries as entries
    pedidos.forEach(p => {
      if (p.status === 'Entregue') {
        const dateStr = p.data_pedido.split('T')[0];
        if (dailyMap[dateStr]) {
          dailyMap[dateStr].entradas += p.valor_total;
        }
      }
    });

    const areaData = Object.values(dailyMap);

    return { pieData, areaData };
  }, [fluxoCaixa, pedidos]);

  // CATEGORY COLORS FOR PIE CHART
  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

  // AI Demand Forecast submit
  const handleRunForecast = async () => {
    setIsForecasting(true);
    setForecastResult(null);

    // Build historical context to feed Gemini API
    const historySummary = pedidos.map(p => ({
      date: p.data_pedido.split('T')[0],
      total: p.valor_total,
      status: p.status
    }));

    try {
      const response = await fetch('/api/forecast-demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historySummary,
          context: forecastParams
        })
      });
      const data = await response.json();
      setForecastResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsForecasting(false);
    }
  };

  // HANDLERS FOR FORMS
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.valor || isNaN(Number(newTransaction.valor))) return;
    
    const t: FluxoCaixa = {
      id: 'caixa-' + Date.now(),
      tipo: newTransaction.tipo,
      categoria: newTransaction.categoria,
      valor: parseFloat(newTransaction.valor),
      descricao: newTransaction.descricao || `${newTransaction.tipo === 'entrada' ? 'Entrada' : 'Despesa'} avulsa`,
      data: newTransaction.data
    };

    setFluxoCaixa(prev => [t, ...prev]);
    setNewTransaction({
      tipo: 'despesa',
      categoria: 'combustível',
      valor: '',
      descricao: '',
      data: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.veiculo || !newVehicle.valor || isNaN(Number(newVehicle.valor))) return;

    const v: InvestimentoFrota = {
      id: 'inv-' + Date.now(),
      veiculo: newVehicle.veiculo,
      valor: parseFloat(newVehicle.valor),
      proprietario: newVehicle.proprietario,
      data_aquisicao: newVehicle.data_aquisicao
    };

    setInvestimentos(prev => [...prev, v]);
    setNewVehicle({
      veiculo: '',
      valor: '',
      proprietario: 'Wagner',
      data_aquisicao: new Date().toISOString().split('T')[0]
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir este lançamento do fluxo de caixa?')) {
      setFluxoCaixa(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleDeleteVehicle = (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir este veículo da frota?')) {
      setInvestimentos(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleUpdateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    setFluxoCaixa(prev => prev.map(item => item.id === editingTransaction.id ? editingTransaction : item));
    setEditingTransaction(null);
  };

  const handleUpdateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setInvestimentos(prev => prev.map(item => item.id === editingVehicle.id ? editingVehicle : item));
    setEditingVehicle(null);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.nome || !newProduct.preco_custo || !newProduct.preco_venda || !newProduct.estoque_atual) return;

    const p: Produto = {
      id: 'prod-' + Date.now(),
      nome: newProduct.nome,
      preco_custo: parseFloat(newProduct.preco_custo),
      preco_venda: parseFloat(newProduct.preco_venda),
      estoque_atual: parseInt(newProduct.estoque_atual)
    };

    setProdutos(prev => [...prev, p]);
    setNewProduct({ nome: '', preco_custo: '', preco_venda: '', estoque_atual: '' });
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSocio) return; // Sócio cannot manage employees
    if (!newEmployee.nome || !newEmployee.telefone) return;

    const cleanPhone = normalizePhone(newEmployee.telefone);
    if (cleanPhone.length < 4) {
      alert('Por favor, insira um telefone válido.');
      return;
    }

    const exists = perfis.some(p => normalizePhone(p.telefone) === cleanPhone);
    if (exists) {
      alert('Este número de telefone já está cadastrado em outro perfil.');
      return;
    }

    const emp: Perfil = {
      id: 'emp-' + Date.now(),
      nome: newEmployee.nome.trim(),
      telefone: cleanPhone,
      role: newEmployee.role,
      senha: '0101' // Default password for newly added employees
    };

    setPerfis(prev => [...prev, emp]);
    setNewEmployee({ nome: '', telefone: '', role: 'vendedor' });
    alert(`Funcionário ${emp.nome} cadastrado com sucesso!`);
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.nome_estabelecimento || !newClient.endereco || !newClient.telefone) return;

    const cli: Cliente = {
      id: 'cli-' + Date.now(),
      nome_estabelecimento: newClient.nome_estabelecimento,
      tipo: newClient.tipo,
      endereco: newClient.endereco,
      telefone: newClient.telefone,
      latitude: newClient.latitude,
      longitude: newClient.longitude
    };

    setClientes(prev => [...prev, cli]);
    setNewClient({
      nome_estabelecimento: '',
      tipo: 'quiosque',
      endereco: '',
      telefone: '',
      latitude: -22.5200,
      longitude: -41.9400
    });
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION WITH STATS */}
      <div className="bg-elegant-card text-white rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-black/40 border border-slate-800">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <TrendingUp className="h-48 w-48 text-sky-400" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-semibold bg-sky-500/20 text-sky-300 py-1 px-3 rounded-full uppercase tracking-wider">
              {isSocio ? 'Painel de Sócio' : 'Painel Master'}
            </span>
            <h2 className="text-2xl font-bold mt-1 text-white">
              {isSocio ? `Olá Sócio, ${currentUserName || 'Sócio'}` : `Olá, ${currentUserName || 'Wagner Teixeira'}`}
            </h2>
            <p className="text-slate-400 text-xs">Gestão operacional do Parceiros do Gelo em Rio das Ostras - RJ</p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs bg-slate-800/80 border border-slate-700 py-1.5 px-3 rounded-xl flex items-center gap-1.5 font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Supabase RLS Ativo
            </span>
          </div>
        </div>

        {/* Real-time metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-elegant-surface border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400">Faturamento Total (Bruto)</p>
            <h3 className="text-xl font-extrabold text-white mt-1">
              R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Inclui vendas diretas e pedidos concluídos
            </p>
          </div>

          <div className="bg-elegant-surface border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400">Despesas Registradas</p>
            <h3 className="text-xl font-extrabold text-rose-400 mt-1">
              R$ {stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Combustível, manutenção, luz, etc.</p>
          </div>

          <div className="bg-elegant-surface border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400">Lucro Líquido Real</p>
            <h3 className={`text-xl font-extrabold mt-1 ${stats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {stats.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-sky-400 mt-1 font-semibold">
              Margem de {stats.margin.toFixed(1)}%
            </p>
          </div>

          <div className="bg-elegant-surface border border-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400">Capital Social Frota</p>
            <h3 className="text-xl font-extrabold text-sky-300 mt-1">
              R$ {stats.totalFleet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Aporte em veículos (Wagner/Mauro)</p>
          </div>
        </div>
      </div>

      {/* DASHBOARD TABS NAVIGATION */}
      <div className="flex overflow-x-auto gap-1.5 bg-elegant-card border border-slate-800 p-1.5 rounded-2xl scrollbar-none">
        <button
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'finance' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
        >
          <DollarSign className="h-4 w-4 text-emerald-400" />
          Fluxo de Caixa
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'ai' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
        >
          <Activity className="h-4 w-4 text-sky-400" />
          IA Previsão Demanda
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'fleet' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
        >
          <Truck className="h-4 w-4 text-indigo-400" />
          Investimentos Frota
        </button>
        <button
          onClick={() => setActiveTab('socios')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'socios' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
        >
          <Users className="h-4 w-4 text-emerald-400" />
          Socios
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'products' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
        >
          <Package className="h-4 w-4 text-amber-400" />
          Estoque / Produtos
        </button>
        {!isSocio && (
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'employees' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
          >
            <Users className="h-4 w-4 text-teal-400" />
            Funcionários
          </button>
        )}
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${activeTab === 'clients' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-xs' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`}
        >
          <Building className="h-4 w-4 text-rose-400" />
          Clientes
        </button>
      </div>

      {/* TAB CONTENT 1: FINANCE & CASH FLOW */}
      {activeTab === 'finance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cash Flow Over Time (Area Chart) */}
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-xs">
              <h3 className="font-bold text-white text-sm mb-4">Evolução do Fluxo de Caixa (Rio das Ostras)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.areaData}>
                    <defs>
                      <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#14161A', borderColor: '#1E293B', color: '#fff' }} formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                    <Legend />
                    <Area type="monotone" dataKey="entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntradas)" name="Entradas" />
                    <Area type="monotone" dataKey="despesas" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesas)" name="Despesas" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transaction History Ledger */}
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-xs">
              <h3 className="font-bold text-white text-sm mb-4">Histórico de Transações</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                      <th className="pb-3">Descrição</th>
                      <th className="pb-3">Categoria</th>
                      <th className="pb-3">Data</th>
                      <th className="pb-3 text-right">Valor</th>
                      <th className="pb-3 text-right w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                    {fluxoCaixa.map(t => (
                      <tr key={t.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="py-2.5 font-medium text-white">{t.descricao}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-elegant-surface text-slate-300 border border-slate-800 capitalize">
                            {t.categoria}
                          </span>
                        </td>
                        <td className="py-2.5">{t.data.split('-').reverse().join('/')}</td>
                        <td className={`py-2.5 text-right font-bold ${t.tipo === 'entrada' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.tipo === 'entrada' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setEditingTransaction(t)}
                            className="text-sky-400 hover:text-sky-300 transition-all cursor-pointer p-1.5 hover:bg-sky-500/10 rounded inline-flex items-center justify-center"
                            title="Editar lançamento"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="text-rose-500 hover:text-rose-400 transition-all cursor-pointer p-1.5 hover:bg-rose-500/10 rounded inline-flex items-center justify-center"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Forms and Expenses Pie */}
          <div className="space-y-6">
            {/* Expense Categories Chart */}
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-xs">
              <h3 className="font-bold text-white text-sm mb-4">Distribuição de Custos</h3>
              <div className="h-48 w-full flex justify-center items-center">
                {chartData.pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#14161A', borderColor: '#1E293B', color: '#fff' }} formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400">Nenhuma despesa registrada para o gráfico.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-semibold text-slate-300">
                {chartData.pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="truncate">{entry.name}: R$ {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form to Register Transaction */}
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-xs">
              <h3 className="font-bold text-white text-sm mb-3">Registrar Entrada / Saída</h3>
              <form onSubmit={handleAddTransaction} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setNewTransaction(prev => ({ ...prev, tipo: 'entrada', categoria: 'venda_gelo' }))}
                      className={`py-1.5 text-center text-xs font-semibold rounded-lg border cursor-pointer transition ${newTransaction.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-elegant-surface text-slate-400 border-slate-800 hover:text-slate-200'}`}
                    >
                      Receita (Entrada)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTransaction(prev => ({ ...prev, tipo: 'despesa', categoria: 'combustível' }))}
                      className={`py-1.5 text-center text-xs font-semibold rounded-lg border cursor-pointer transition ${newTransaction.tipo === 'despesa' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-elegant-surface text-slate-400 border-slate-800 hover:text-slate-200'}`}
                    >
                      Despesa (Saída)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
                  <select
                    value={newTransaction.categoria}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, categoria: e.target.value as any }))}
                    className="w-full mt-1 border border-slate-800 bg-elegant-surface text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  >
                    {newTransaction.tipo === 'entrada' ? (
                      <>
                        <option value="venda_gelo">Venda de Gelo</option>
                        <option value="outro">Aporte / Outro</option>
                      </>
                    ) : (
                      <>
                        <option value="combustível">Combustível (Iveco/Fiorino)</option>
                        <option value="manutenção">Manutenção Frota</option>
                        <option value="embalagem">Embalagens plásticas</option>
                        <option value="energia">Energia Elétrica (Fábrica)</option>
                        <option value="pessoal">Mão de Obra / Pessoal</option>
                        <option value="outro">Outro</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={newTransaction.valor}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, valor: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-elegant-surface text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Data</label>
                  <input
                    type="date"
                    required
                    value={newTransaction.data}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-elegant-surface text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Combustível Iveco Daily"
                    value={newTransaction.descricao}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-elegant-surface text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-500 text-white font-semibold text-xs py-2 rounded-lg hover:bg-sky-600 transition shadow-md shadow-sky-500/10 cursor-pointer"
                >
                  Confirmar Lançamento
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: AI DEMAND FORECAST */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="space-y-6">
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5 mb-3">
                <CloudSun className="h-5 w-5 text-sky-400" />
                Parâmetros de Previsão (Google AI Studio)
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Configure as condições climáticas e sazonais de Rio das Ostras para rodar a previsão preditiva de demanda de gelo.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Temperatura Prevista</span>
                    <span className="text-sky-400">{forecastParams.temperature}°C</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="42"
                    value={forecastParams.temperature}
                    onChange={(e) => setForecastParams(prev => ({ ...prev, temperature: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-[#0F1115] border border-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                    <span>Inverno (Frio)</span>
                    <span>Verão (Calor)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForecastParams(prev => ({ ...prev, isWeekend: !prev.isWeekend }))}
                    className={`p-3 text-center border rounded-xl flex flex-col items-center gap-1 transition cursor-pointer ${forecastParams.isWeekend ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-elegant-surface border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-semibold">Fim de Semana</span>
                    <span className="text-[9px] opacity-75">{forecastParams.isWeekend ? 'Sim' : 'Não'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForecastParams(prev => ({ ...prev, isHoliday: !prev.isHoliday }))}
                    className={`p-3 text-center border rounded-xl flex flex-col items-center gap-1 transition cursor-pointer ${forecastParams.isHoliday ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-elegant-surface border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    <Flame className="h-4 w-4" />
                    <span className="text-xs font-semibold">Feriado Nacional</span>
                    <span className="text-[9px] opacity-75">{forecastParams.isHoliday ? 'Sim' : 'Não'}</span>
                  </button>
                </div>

                <button
                  onClick={handleRunForecast}
                  disabled={isForecasting}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-sky-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isForecasting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Gerando Previsão por IA...
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4" />
                      Rodar Previsão de Produção
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2">
            {forecastResult ? (
              <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">Previsão Inteligente Gerada</h3>
                    <p className="text-[10px] text-slate-500">Processado via Gemini-3.5-Flash (Google AI Studio)</p>
                  </div>
                  {forecastResult.isSimulated && (
                    <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 py-0.5 px-2 rounded-full border border-amber-500/20">
                      Ambiente de Teste
                    </span>
                  )}
                </div>

                {forecastResult.weatherAlert && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
                    <AlertTriangle className="h-4 w-4 animate-bounce" />
                    {forecastResult.weatherAlert}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0F1115] border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Recomendação de Produção</span>
                    <h4 className="text-2xl font-extrabold text-sky-400 mt-1">
                      {forecastResult.recommendedProductionKg.toLocaleString('pt-BR')} Kg
                    </h4>
                    <p className="text-[9px] text-slate-500">Estimativa necessária para atender Rio das Ostras</p>
                  </div>

                  <div className="bg-[#0F1115] border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Variação de Demanda</span>
                    <h4 className={`text-2xl font-extrabold mt-1 ${forecastResult.growthPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {forecastResult.growthPercentage >= 0 ? '+' : ''}{forecastResult.growthPercentage}%
                    </h4>
                    <p className="text-[9px] text-slate-500">Em relação ao histórico regular</p>
                  </div>
                </div>

                <div className="bg-[#0F1115] text-slate-300 p-4 rounded-xl font-mono text-xs whitespace-pre-line leading-relaxed border border-slate-800 shadow-inner">
                  {forecastResult.analysis}
                </div>
              </div>
            ) : (
              <div className="bg-elegant-card border border-slate-800 border-dashed rounded-2xl p-12 text-center h-full flex flex-col justify-center items-center">
                <CloudSun className="h-12 w-12 text-slate-500 mb-2 animate-pulse" />
                <h4 className="font-semibold text-slate-300 text-sm">Pronto para Análise de Demanda</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Clique no botão para analisar as tendências de temperatura, turismo e vendas passadas em Rio das Ostras de forma a obter o estoque estratégico de gelo ideal.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: FLEET INVESTMENTS */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-white text-sm mb-4">Registro de Frotas (Capital Inicial)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                      <th className="pb-3">Veículo</th>
                      <th className="pb-3">Sócio Proprietário</th>
                      <th className="pb-3">Data Aquisição</th>
                      <th className="pb-3 text-right">Valor Estimado</th>
                      <th className="pb-3 text-right w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                    {investimentos.map(v => (
                      <tr key={v.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="py-3 font-semibold text-white flex items-center gap-2">
                          <Truck className="h-4 w-4 text-sky-400" />
                          {v.veiculo}
                        </td>
                        <td className="py-3 capitalize text-slate-300">Sócio {v.proprietario}</td>
                        <td className="py-3">{v.data_aquisicao.split('-').reverse().join('/')}</td>
                        <td className="py-3 text-right font-bold text-white">
                          R$ {v.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setEditingVehicle(v)}
                            className="text-sky-400 hover:text-sky-300 transition-all cursor-pointer p-1.5 hover:bg-sky-500/10 rounded inline-flex items-center justify-center"
                            title="Editar veículo"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(v.id)}
                            className="text-rose-500 hover:text-rose-400 transition-all cursor-pointer p-1.5 hover:bg-rose-500/10 rounded inline-flex items-center justify-center"
                            title="Excluir veículo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-white text-sm mb-3">Registrar Aporte de Veículo</h3>
              <form onSubmit={handleAddVehicle} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Modelo do Veículo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Iveco Daily 2014"
                    value={newVehicle.veiculo}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, veiculo: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={newVehicle.valor}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, valor: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Sócio Proprietário</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setNewVehicle(prev => ({ ...prev, proprietario: 'Wagner' }))}
                      className={`py-1.5 text-center text-xs font-semibold rounded-lg border cursor-pointer transition ${newVehicle.proprietario === 'Wagner' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-[#0F1115] border-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      Wagner
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewVehicle(prev => ({ ...prev, proprietario: 'Mauro' }))}
                      className={`py-1.5 text-center text-xs font-semibold rounded-lg border cursor-pointer transition ${newVehicle.proprietario === 'Mauro' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-[#0F1115] border-slate-800 text-slate-400 hover:text-slate-200'}`}
                    >
                      Mauro
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Data de Aquisição</label>
                  <input
                    type="date"
                    required
                    value={newVehicle.data_aquisicao}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, data_aquisicao: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-500 text-white font-semibold text-xs py-2 rounded-lg hover:bg-sky-600 transition shadow-md shadow-sky-500/10 cursor-pointer"
                >
                  Registrar Veículo de Frota
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: PRODUCTS & INVENTORY */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-white text-sm mb-4">Gestão de Estoque e Catálogo de Gelo</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                      <th className="pb-3">Produto</th>
                      <th className="pb-3">Preço Custo</th>
                      <th className="pb-3">Preço Venda</th>
                      <th className="pb-3">Margem Unitária</th>
                      <th className="pb-3 text-right">Estoque Atual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                    {produtos.map(p => {
                      const margUnit = p.preco_venda - p.preco_custo;
                      const isLowEstoque = p.estoque_atual < 160;
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/30 transition-all">
                          <td className="py-3 font-semibold text-white flex items-center gap-2">
                            <Package className="h-4 w-4 text-amber-400" />
                            {p.nome}
                          </td>
                          <td className="py-3 text-slate-300">R$ {p.preco_custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 font-semibold text-white">R$ {p.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 text-emerald-400 font-semibold">
                            R$ {margUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({((margUnit / p.preco_venda) * 100).toFixed(0)}%)
                          </td>
                          <td className="py-3 text-right font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded-sm text-[10px] ${isLowEstoque ? 'bg-red-500/15 text-red-400 font-bold border border-red-500/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>
                              {p.estoque_atual} un
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-white text-sm mb-3">Registrar Novo Tipo de Gelo</h3>
              <form onSubmit={handleAddProduct} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Nome / Embalagem</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Gelo Cubo 15kg"
                    value={newProduct.nome}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Custo Unitário</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="3.50"
                      value={newProduct.preco_custo}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, preco_custo: e.target.value }))}
                      className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Preço Venda</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="8.00"
                      value={newProduct.preco_venda}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, preco_venda: e.target.value }))}
                      className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Estoque Inicial (Unidades)</label>
                  <input
                    type="number"
                    required
                    placeholder="200"
                    value={newProduct.estoque_atual}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, estoque_atual: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-500 text-white font-semibold text-xs py-2 rounded-lg hover:bg-sky-600 transition shadow-md shadow-sky-500/10 cursor-pointer"
                >
                  Adicionar Produto
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: EMPLOYEES / USERS (MASTER ONLY) */}
      {activeTab === 'employees' && !isSocio && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-white text-sm mb-4">Gerenciamento de Funcionários e Acessos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                      <th className="pb-3">Nome</th>
                      <th className="pb-3">Telefone (Login)</th>
                      <th className="pb-3">Permissão (Role)</th>
                      <th className="pb-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                    {perfis.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="py-3 font-semibold text-white flex items-center gap-2">
                          <Users className="h-4 w-4 text-sky-400" />
                          {p.nome}
                        </td>
                        <td className="py-3 font-mono text-slate-300">{p.telefone}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-sm text-[10px] font-semibold capitalize ${p.role === 'master' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : p.role === 'socio' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : p.role === 'vendedor' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {p.role}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {p.role !== 'master' ? (
                            <button
                              onClick={() => {
                                if (window.confirm(`Tem certeza de que deseja excluir o funcionário ${p.nome}? Todas as informações serão removidas e o telefone (${p.telefone}) poderá ser cadastrado novamente sem dar erro.`)) {
                                  setPerfis(prev => prev.filter(item => item.id !== p.id));
                                  alert('Funcionário excluído com sucesso do banco de dados!');
                                }
                              }}
                              className="text-rose-500 hover:text-rose-400 cursor-pointer"
                              title="Excluir Funcionário"
                            >
                              <Trash2 className="h-4 w-4 inline-block" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">Inalterável</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-white text-sm mb-3">Registrar Novo Funcionário</h3>
              <form onSubmit={handleAddEmployee} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Ribeiro"
                    value={newEmployee.nome}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Telefone (Apenas números com DDD)</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 22999992222"
                    value={newEmployee.telefone}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Nível de Permissão (Role)</label>
                  <select
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  >
                    <option value="vendedor">Vendedor (Pode criar pedidos e ver mapas)</option>
                    <option value="entregador">Entregador (Entrega e altera status do pedido)</option>
                    <option value="socio">Sócio Proprietário (Mauro/Marcos)</option>
                  </select>
                </div>

                <div className="bg-[#0F1115] p-3 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-normal">
                  <span className="font-bold text-slate-200">Nota de Segurança:</span> A senha inicial padrão para novos colaboradores registrados pelo administrador é a senha simples "senha123". Eles poderão usá-la imediatamente para fazer o login no aplicativo.
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-500 text-white font-semibold text-xs py-2 rounded-lg hover:bg-sky-600 transition shadow-md shadow-sky-500/10 cursor-pointer"
                >
                  Registrar Colaborador
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: CLIENTS */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-white text-sm mb-4">Estabelecimentos Cadastrados</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                      <th className="pb-3">Estabelecimento</th>
                      <th className="pb-3">Tipo</th>
                      <th className="pb-3">Endereço (Rio das Ostras)</th>
                      <th className="pb-3">Telefone</th>
                      <th className="pb-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                    {clientes.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="py-3 font-semibold text-white flex items-center gap-2">
                          <Building className="h-4 w-4 text-sky-400" />
                          {c.nome_estabelecimento}
                        </td>
                        <td className="py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize bg-elegant-surface text-slate-300 border border-slate-800">
                            {c.tipo}
                          </span>
                        </td>
                        <td className="py-3 line-clamp-1 max-w-[200px]" title={c.endereco}>{c.endereco}</td>
                        <td className="py-3 font-mono text-slate-300">{c.telefone}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setClientes(prev => prev.filter(item => item.id !== c.id))}
                            className="text-rose-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 inline-block" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-white text-sm mb-3">Registrar Novo Cliente</h3>
              <form onSubmit={handleAddClient} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Estabelecimento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bar da Praia Costazul"
                    value={newClient.nome_estabelecimento}
                    onChange={(e) => setNewClient(prev => ({ ...prev, nome_estabelecimento: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                  <select
                    value={newClient.tipo}
                    onChange={(e) => setNewClient(prev => ({ ...prev, tipo: e.target.value as any }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  >
                    <option value="quiosque">Quiosque de Praia</option>
                    <option value="bar">Bar / Restaurante</option>
                    <option value="depósito">Depósito de Bebidas</option>
                    <option value="evento">Evento / Festa local</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Endereço Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Av. Costazul, 200 - Costazul"
                    value={newClient.endereco}
                    onChange={(e) => setNewClient(prev => ({ ...prev, endereco: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Contato (Telefone)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 22988880009"
                    value={newClient.telefone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={newClient.latitude}
                      onChange={(e) => setNewClient(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                      className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none font-mono focus:border-sky-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={newClient.longitude}
                      onChange={(e) => setNewClient(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                      className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none font-mono focus:border-sky-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-500 text-white font-semibold text-xs py-2 rounded-lg hover:bg-sky-600 transition shadow-md shadow-sky-500/10 cursor-pointer"
                >
                  Cadastrar Cliente
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 8: SÓCIOS & APORTES */}
      {activeTab === 'socios' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Info Header */}
          <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                Painel de Controle de Sócios - Parceiros do Gelo
              </h3>
              <p className="text-xs text-slate-400">
                Os lucros líquidos gerados pela operação são divididos igualmente em 1/3 para cada um dos três sócios: <strong className="text-slate-200">Mauro</strong>, <strong className="text-slate-200">Wagner</strong> e <strong className="text-slate-200">Marcos</strong>.
              </p>
            </div>
            
            {/* Simulation offset controller */}
            <div className="bg-[#0F1115] border border-slate-850 p-3 rounded-xl space-y-1.5 self-stretch md:self-auto">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Simular Lucro Líquido Adicional (R$)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={simulatedProfitOffset}
                  onChange={(e) => setSimulatedProfitOffset(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="bg-elegant-card border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-white font-semibold focus:outline-none focus:border-sky-500 w-32"
                />
                <button
                  type="button"
                  onClick={() => setSimulatedProfitOffset(120000)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-2 text-[10px] font-semibold transition"
                >
                  Reset (120k)
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic calculations for profits */}
          {(() => {
            const totalProfitToDistribute = stats.netProfit + simulatedProfitOffset;
            const sharePerSocio = totalProfitToDistribute / 3;

            const partners: Array<{ name: 'Mauro' | 'Wagner' | 'Marcos'; color: string; label: string }> = [
              { name: 'Mauro', color: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5', label: 'Investidor Executivo' },
              { name: 'Wagner', color: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5', label: 'Fundador & Master' },
              { name: 'Marcos', color: 'border-amber-500/20 text-amber-400 bg-amber-500/5', label: 'Diretor Comercial' }
            ];

            const getSocioAportesSum = (socioName: 'Mauro' | 'Wagner' | 'Marcos') => {
              return aportes.filter(a => a.socio === socioName).reduce((sum, a) => sum + a.valor, 0);
            };

            const handleAporteClick = (socioName: 'Mauro' | 'Wagner' | 'Marcos', percentageStr: string) => {
              const pct = parseFloat(percentageStr);
              if (isNaN(pct) || pct <= 0 || pct > 100) return;
              
              const calculatedValue = sharePerSocio * (pct / 100);
              const remaining = sharePerSocio - getSocioAportesSum(socioName);
              
              if (calculatedValue > remaining) {
                alert(`O valor calculado para o aporte (R$ ${calculatedValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}) excede o saldo de lucros distribuídos disponível para este sócio (R$ ${remaining.toLocaleString('pt-BR', {minimumFractionDigits: 2})}).`);
                return;
              }

              const newAporte = {
                id: 'ap-' + Date.now() + Math.random().toString(36).substr(2, 4),
                socio: socioName,
                valor: calculatedValue,
                porcentagem: pct,
                data: new Date().toISOString().split('T')[0],
                descricao: `Aporte voluntário de ${pct}% dos lucros distribuídos`
              };

              setAportes(prev => [newAporte, ...prev]);
              setCaixaSaldo(prev => prev + calculatedValue);
            };

            return (
              <>
                {/* Total distributed values info box */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-elegant-card border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Faturamento Operacional</p>
                      <h4 className="text-lg font-black text-white mt-1">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                    </div>
                    <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="bg-elegant-card border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Lucro Líquido Acumulado</p>
                      <h4 className="text-lg font-black text-emerald-400 mt-1">R$ {totalProfitToDistribute.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <DollarSign className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="bg-elegant-card border border-slate-800 p-4.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Parte Igual por Sócio (1/3)</p>
                      <h4 className="text-lg font-black text-sky-400 mt-1">R$ {sharePerSocio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                    </div>
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                {/* Partners List Cards with Aporte Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {partners.map(p => {
                    const contributed = getSocioAportesSum(p.name);
                    const remaining = Math.max(0, sharePerSocio - contributed);
                    const percentInput = p.name === 'Mauro' ? mauroPercent : p.name === 'Wagner' ? wagnerPercent : marcosPercent;
                    const setPercentInput = p.name === 'Mauro' ? setMauroPercent : p.name === 'Wagner' ? setWagnerPercent : setMarcosPercent;

                    return (
                      <div key={p.name} className="bg-elegant-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700/50 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-base font-extrabold text-white">{p.name}</h4>
                              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 mt-1 rounded-full border ${p.color}`}>
                                {p.label}
                              </span>
                            </div>
                            <div className="w-9 h-9 bg-slate-800/80 rounded-full border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-300">
                              {p.name.charAt(0)}
                            </div>
                          </div>

                          <div className="bg-[#0F1115] border border-slate-850 p-3.5 rounded-xl space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Total de Direito (1/3):</span>
                              <span className="font-bold text-slate-200">R$ {sharePerSocio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Lucro Já Aportado:</span>
                              <span className="font-bold text-emerald-400">R$ {contributed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="h-px bg-slate-800/80 my-1"></div>
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-300 font-bold">Saldo Disponível:</span>
                              <span className="font-extrabold text-sky-400">R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Aporte Action Form */}
                        <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Aportar % dos Lucros</label>
                            <div className="flex gap-1.5">
                              {['10', '25', '50', '100'].map(pctOption => (
                                <button
                                  key={pctOption}
                                  type="button"
                                  onClick={() => setPercentInput(pctOption)}
                                  className={`flex-1 py-1 text-center text-[10px] font-bold rounded-lg border cursor-pointer transition ${percentInput === pctOption ? 'bg-sky-500/15 text-sky-400 border-sky-500/35' : 'bg-elegant-surface text-slate-500 border-slate-850 hover:text-slate-300'}`}
                                >
                                  {pctOption}%
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={percentInput}
                                onChange={(e) => setPercentInput(e.target.value)}
                                className="w-full pl-3 pr-8 py-1.5 bg-[#0F1115] border border-slate-800 text-slate-200 text-xs rounded-xl focus:border-sky-500 focus:outline-none font-mono"
                                placeholder="%"
                              />
                              <span className="absolute right-3 top-1.5 text-xs text-slate-500 font-bold">%</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAporteClick(p.name, percentInput)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Aportar
                            </button>
                          </div>
                          
                          <p className="text-[9px] text-slate-500 leading-normal text-center">
                            Calculado: R$ {((sharePerSocio * (parseFloat(percentInput) || 0)) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CAIXA SEPARADO E INVESTIMENTOS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Separate Cash Balance Card */}
                  <div className="lg:col-span-1 bg-elegant-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">Caixa de Aportes dos Sócios</h4>
                          <p className="text-[10px] text-slate-500">Recurso exclusivo dos lucros distribuídos</p>
                        </div>
                      </div>

                      <div className="bg-[#0F1115] border border-slate-850 rounded-2xl p-4.5 text-center my-2">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Saldo em Conta</p>
                        <h2 className="text-2xl font-black text-emerald-400 mt-1">R$ {caixaSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                        <p className="text-[9px] text-slate-500 mt-1.5">Acumulado total de aportes de Mauro, Wagner e Marcos minus investimentos realizados.</p>
                      </div>
                    </div>

                    {/* New Investment Form inside Fund */}
                    <div className="bg-elegant-surface border border-slate-800 p-4 rounded-xl space-y-3">
                      <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-indigo-400" />
                        Gerar Novo Investimento
                      </h5>
                      <p className="text-[10px] text-slate-400">Gere novos investimentos na frota ou fábrica usando os recursos acumulados no Caixa de Aportes.</p>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Descrição do Investimento</label>
                          <input
                            type="text"
                            value={newFundInvestment.descricao}
                            onChange={(e) => setNewFundInvestment(prev => ({ ...prev, descricao: e.target.value }))}
                            className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500"
                            placeholder="Ex: Nova máquina de gelo cubo"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Valor do Investimento (R$)</label>
                          <input
                            type="number"
                            value={newFundInvestment.valor}
                            onChange={(e) => setNewFundInvestment(prev => ({ ...prev, valor: e.target.value }))}
                            className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-sky-500"
                            placeholder="0.00"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseFloat(newFundInvestment.valor);
                            if (!newFundInvestment.descricao || isNaN(val) || val <= 0) {
                              alert('Por favor, informe uma descrição e um valor válido de investimento.');
                              return;
                            }
                            if (val > caixaSaldo) {
                              alert(`Saldo insuficiente! O Caixa de Aportes possui apenas R$ ${caixaSaldo.toLocaleString('pt-BR')} e o investimento custa R$ ${val.toLocaleString('pt-BR')}.`);
                              return;
                            }
                            
                            const newInv = {
                              id: 'inv-c-' + Date.now(),
                              descricao: newFundInvestment.descricao,
                              valor: val,
                              data: new Date().toISOString().split('T')[0]
                            };

                            setInvestimentosCaixa(prev => [newInv, ...prev]);
                            setCaixaSaldo(prev => prev - val);
                            setNewFundInvestment({ descricao: '', valor: '' });
                            alert('Investimento gerado com sucesso com dinheiro dos lucros dos sócios!');
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 rounded-lg transition shadow-md cursor-pointer text-center"
                        >
                          Gerar Investimento
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reports & Monthly Activity List with trigger button */}
                  <div className="lg:col-span-2 bg-elegant-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-sky-400" />
                          <div>
                            <h4 className="font-bold text-white text-sm">Controle Mensal & Relatórios</h4>
                            <p className="text-[10px] text-slate-500">Acompanhamento dos aportes da sociedade</p>
                          </div>
                        </div>

                        {/* MONTH REPORT BUTTON Trigger */}
                        <button
                          onClick={() => setShowReportModal(true)}
                          className="bg-sky-500/10 hover:bg-sky-500/25 text-sky-400 border border-sky-500/20 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Activity className="h-3.5 w-3.5 animate-pulse" />
                          Relatório Mensal
                        </button>
                      </div>

                      {/* Display current month investments ledger overview */}
                      <div className="space-y-3">
                        <h5 className="font-bold text-white text-xs flex items-center gap-1 text-slate-300">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          Investimentos Realizados pelo Fundo
                        </h5>
                        
                        <div className="overflow-y-auto max-h-[120px] rounded-xl border border-slate-850">
                          {investimentosCaixa.length > 0 ? (
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="bg-[#0F1115] border-b border-slate-800/80 text-slate-500 font-bold">
                                  <th className="p-2">Descrição</th>
                                  <th className="p-2">Data</th>
                                  <th className="p-2 text-right">Valor</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850/50 text-slate-300">
                                {investimentosCaixa.map(inv => (
                                  <tr key={inv.id} className="hover:bg-slate-800/25">
                                    <td className="p-2 font-medium text-white">{inv.descricao}</td>
                                    <td className="p-2">{inv.data.split('-').reverse().join('/')}</td>
                                    <td className="p-2 text-right font-bold text-rose-400">- R$ {inv.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-4 text-center text-slate-500 text-xs bg-[#0F1115]/50">
                              Nenhum investimento realizado com fundos dos sócios ainda.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recent aporte timeline */}
                      <div className="space-y-3">
                        <h5 className="font-bold text-white text-xs text-slate-300">Aportes Recentes de Sócios</h5>
                        <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1 scrollbar-none">
                          {aportes.slice(0, 5).map(ap => (
                            <div key={ap.id} className="bg-[#0F1115] border border-slate-850 rounded-xl p-2.5 flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-sky-400">
                                  {ap.socio.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-white">{ap.socio}</p>
                                  <p className="text-[9px] text-slate-400 truncate w-32 md:w-48">{ap.descricao}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-emerald-400">+ R$ {ap.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                <p className="text-[8px] text-slate-500">{ap.data.split('-').reverse().join('/')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MODAL / REPORT BOX: "QUEM INVESTIU NO MÊS" */}
                {showReportModal && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-xl bg-elegant-card border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-black relative animate-in fade-in zoom-in duration-200">
                      
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                        <div>
                          <h4 className="font-extrabold text-white text-base flex items-center gap-1.5">
                            <FileText className="h-5 w-5 text-emerald-400" />
                            Relatório Mensal: Quem Investiu no Mês
                          </h4>
                          <p className="text-xs text-slate-400">Aportes de lucros por período mensal</p>
                        </div>
                        <button
                          onClick={() => setShowReportModal(false)}
                          className="text-slate-400 hover:text-white font-bold text-xs bg-slate-800 px-2.5 py-1 rounded-lg cursor-pointer"
                        >
                          Fechar
                        </button>
                      </div>

                      {/* Month filter form */}
                      <div className="flex items-center gap-3 bg-[#0F1115] p-3 rounded-2xl border border-slate-850 mb-4">
                        <span className="text-xs font-semibold text-slate-400">Selecione o Mês / Ano:</span>
                        <input
                          type="month"
                          value={reportMonth}
                          onChange={(e) => setReportMonth(e.target.value)}
                          className="bg-elegant-card border border-slate-800 rounded-lg py-1 px-3 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      {/* Math calculations for selected month contributions */}
                      {(() => {
                        const mauroMonthSum = aportes.filter(a => a.socio === 'Mauro' && a.data.startsWith(reportMonth)).reduce((sum, a) => sum + a.valor, 0);
                        const wagnerMonthSum = aportes.filter(a => a.socio === 'Wagner' && a.data.startsWith(reportMonth)).reduce((sum, a) => sum + a.valor, 0);
                        const marcosMonthSum = aportes.filter(a => a.socio === 'Marcos' && a.data.startsWith(reportMonth)).reduce((sum, a) => sum + a.valor, 0);
                        const totalMonthAportes = mauroMonthSum + wagnerMonthSum + marcosMonthSum;

                        const monthAportesList = aportes.filter(a => a.data.startsWith(reportMonth));

                        return (
                          <div className="space-y-4">
                            {/* Graphical Comparison */}
                            <div className="space-y-2.5">
                              <h5 className="font-bold text-white text-xs">Comparativo de Aportes em {reportMonth.split('-').reverse().join('/')}</h5>
                              
                              <div className="space-y-3 bg-[#0F1115] p-4 rounded-2xl border border-slate-850">
                                {/* Mauro Bar */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-bold text-slate-300">Mauro</span>
                                    <span className="font-bold text-emerald-400">
                                      R$ {mauroMonthSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                                      <span className="text-[10px] text-slate-500 ml-1">({totalMonthAportes > 0 ? ((mauroMonthSum/totalMonthAportes)*100).toFixed(0) : 0}%)</span>
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${totalMonthAportes > 0 ? (mauroMonthSum / totalMonthAportes) * 100 : 0}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Wagner Bar */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-bold text-slate-300">Wagner</span>
                                    <span className="font-bold text-indigo-400">
                                      R$ {wagnerMonthSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      <span className="text-[10px] text-slate-500 ml-1">({totalMonthAportes > 0 ? ((wagnerMonthSum/totalMonthAportes)*100).toFixed(0) : 0}%)</span>
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${totalMonthAportes > 0 ? (wagnerMonthSum / totalMonthAportes) * 100 : 0}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Marcos Bar */}
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-bold text-slate-300">Marcos</span>
                                    <span className="font-bold text-amber-400">
                                      R$ {marcosMonthSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      <span className="text-[10px] text-slate-500 ml-1">({totalMonthAportes > 0 ? ((marcosMonthSum/totalMonthAportes)*100).toFixed(0) : 0}%)</span>
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${totalMonthAportes > 0 ? (marcosMonthSum / totalMonthAportes) * 100 : 0}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="h-px bg-slate-800 my-1"></div>
                                <div className="flex justify-between text-xs pt-1">
                                  <span className="font-bold text-slate-400">Total do Mês:</span>
                                  <span className="font-black text-white">R$ {totalMonthAportes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            </div>

                            {/* Detailed list of month aportes */}
                            <div className="space-y-2">
                              <h5 className="font-bold text-white text-xs">Detalhamento dos Lançamentos no Período</h5>
                              <div className="max-h-[160px] overflow-y-auto rounded-xl border border-slate-850">
                                {monthAportesList.length > 0 ? (
                                  <table className="w-full text-left border-collapse text-[11px]">
                                    <thead>
                                      <tr className="bg-[#0F1115] border-b border-slate-800/80 text-slate-500 font-bold">
                                        <th className="p-2">Sócio</th>
                                        <th className="p-2">Data</th>
                                        <th className="p-2">Descrição</th>
                                        <th className="p-2 text-right">Valor</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-850/50 text-slate-300">
                                      {monthAportesList.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-800/25">
                                          <td className="p-2 font-bold text-white">{item.socio}</td>
                                          <td className="p-2">{item.data.split('-').reverse().join('/')}</td>
                                          <td className="p-2 text-slate-400">{item.descricao}</td>
                                          <td className="p-2 text-right font-bold text-emerald-400">+ R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="p-4 text-center text-slate-500 text-xs bg-[#0F1115]/50">
                                    Nenhum aporte encontrado neste mês selecionado.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Footer Info button */}
                      <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowReportModal(false)}
                          className="bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer"
                        >
                          Ok, Entendido
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* MODAL: EDIT TRANSACTION */}
      {editingTransaction && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-elegant-card border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setEditingTransaction(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-sky-400" />
              Editar Lançamento
            </h3>

            <form onSubmit={handleUpdateTransaction} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(prev => prev ? ({ ...prev, tipo: 'entrada', categoria: 'venda_gelo' }) : null)}
                    className={`py-1.5 text-center text-xs font-semibold rounded-lg border cursor-pointer transition ${editingTransaction.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-elegant-surface text-slate-400 border-slate-800 hover:text-slate-200'}`}
                  >
                    Receita (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(prev => prev ? ({ ...prev, tipo: 'despesa', categoria: 'combustível' }) : null)}
                    className={`py-1.5 text-center text-xs font-semibold rounded-lg border cursor-pointer transition ${editingTransaction.tipo === 'despesa' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-elegant-surface text-slate-400 border-slate-800 hover:text-slate-200'}`}
                  >
                    Despesa (Saída)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
                <select
                  value={editingTransaction.categoria}
                  onChange={(e) => setEditingTransaction(prev => prev ? ({ ...prev, categoria: e.target.value as any }) : null)}
                  className="w-full mt-1 border border-slate-800 bg-elegant-surface text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
                >
                  {editingTransaction.tipo === 'entrada' ? (
                    <>
                      <option value="venda_gelo">Venda de Gelo</option>
                      <option value="outro">Aporte / Outro</option>
                    </>
                  ) : (
                    <>
                      <option value="combustível">Combustível (Iveco/Fiorino)</option>
                      <option value="manutenção">Manutenção Frota</option>
                      <option value="embalagem">Embalagens plásticas</option>
                      <option value="energia">Energia Elétrica (Fábrica)</option>
                      <option value="pessoal">Mão de Obra / Pessoal</option>
                      <option value="outro">Outro</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingTransaction.valor || ''}
                  onChange={(e) => setEditingTransaction(prev => prev ? ({ ...prev, valor: parseFloat(e.target.value) || 0 }) : null)}
                  className="w-full mt-1 border border-slate-800 bg-elegant-surface text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Data</label>
                <input
                  type="date"
                  required
                  value={editingTransaction.data}
                  onChange={(e) => setEditingTransaction(prev => prev ? ({ ...prev, data: e.target.value }) : null)}
                  className="w-full mt-1 border border-slate-800 bg-elegant-surface text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Descrição</label>
                <input
                  type="text"
                  value={editingTransaction.descricao}
                  onChange={(e) => setEditingTransaction(prev => prev ? ({ ...prev, descricao: e.target.value }) : null)}
                  className="w-full mt-1 border border-slate-800 bg-elegant-surface text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="w-1/2 border border-slate-800 text-slate-400 hover:text-white font-semibold text-xs py-2 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs py-2 rounded-lg transition cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT VEHICLE */}
      {editingVehicle && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="bg-elegant-card border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setEditingVehicle(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-sky-400" />
              Editar Veículo de Frota
            </h3>

            <form onSubmit={handleUpdateVehicle} className="space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Modelo do Veículo</label>
                <input
                  type="text"
                  required
                  value={editingVehicle.veiculo}
                  onChange={(e) => setEditingVehicle(prev => prev ? ({ ...prev, veiculo: e.target.value }) : null)}
                  className="w-full mt-1 border border-slate-800 bg-elegant-surface text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Valor Estimado (R$)</label>
                <input
                  type="number"
                  required
                  value={editingVehicle.valor || ''}
                  onChange={(e) => setEditingVehicle(prev => prev ? ({ ...prev, valor: parseFloat(e.target.value) || 0 }) : null)}
                  className="w-full mt-1 border border-slate-800 bg-elegant-surface text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Sócio Proprietário</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setEditingVehicle(prev => prev ? ({ ...prev, proprietario: 'Wagner' }) : null)}
                    className={`py-1.5 text-center text-xs font-semibold rounded-lg border cursor-pointer transition ${editingVehicle.proprietario === 'Wagner' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-[#0F1115] border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    Wagner
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingVehicle(prev => prev ? ({ ...prev, proprietario: 'Mauro' }) : null)}
                    className={`py-1.5 text-center text-xs font-semibold rounded-lg border cursor-pointer transition ${editingVehicle.proprietario === 'Mauro' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-[#0F1115] border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    Mauro
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Data de Aquisição</label>
                <input
                  type="date"
                  required
                  value={editingVehicle.data_aquisicao}
                  onChange={(e) => setEditingVehicle(prev => prev ? ({ ...prev, data_aquisicao: e.target.value }) : null)}
                  className="w-full mt-1 border border-slate-800 bg-elegant-surface text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="w-1/2 border border-slate-800 text-slate-400 hover:text-white font-semibold text-xs py-2 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs py-2 rounded-lg transition cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
