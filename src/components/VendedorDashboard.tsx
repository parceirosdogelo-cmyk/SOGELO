/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  ShoppingBag,
  Building,
  Navigation,
  Check,
  Smartphone,
  MapPin,
  HelpCircle,
  Truck,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { Cliente, Produto, Pedido, ItemPedido, Perfil } from '../types';
import MapRioOstras from './MapRioOstras';

interface VendedorDashboardProps {
  clientes: Cliente[];
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  produtos: Produto[];
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>;
  pedidos: Pedido[];
  setPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>;
  itensPedido: ItemPedido[];
  setItensPedido: React.Dispatch<React.SetStateAction<ItemPedido[]>>;
  perfis: Perfil[];
}

export default function VendedorDashboard({
  clientes,
  setClientes,
  produtos,
  setProdutos,
  pedidos,
  setPedidos,
  itensPedido,
  setItensPedido,
  perfis,
}: VendedorDashboardProps) {
  const [vendedorTab, setVendedorTab] = useState<'orders' | 'new-order' | 'new-client' | 'routes'>('orders');

  // New Client Form State
  const [clientForm, setClientForm] = useState({
    nome_estabelecimento: '',
    tipo: 'quiosque' as 'quiosque' | 'bar' | 'depósito' | 'evento',
    endereco: '',
    telefone: '',
    latitude: -22.5273,
    longitude: -41.9318
  });

  // New Order Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedEntregadorId, setSelectedEntregadorId] = useState('');
  const [orderItems, setOrderItems] = useState<{ produto_id: string; quantidade: number }[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<'Pix' | 'Dinheiro' | 'Cartão' | 'A Combinar'>('A Combinar');

  // AI Route Optimization
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<{
    sequence: Pedido[];
    routeSummary: string;
    estimatedDistanceKm: number;
    estimatedTimeMinutes: number;
  } | null>(null);

  // List of delivery guys available
  const entregadores = useMemo(() => {
    return perfis.filter(p => p.role === 'entregador');
  }, [perfis]);

  // Handle Client creation
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.nome_estabelecimento || !clientForm.endereco || !clientForm.telefone) return;

    const newCli: Cliente = {
      id: 'cli-' + Date.now(),
      nome_estabelecimento: clientForm.nome_estabelecimento,
      tipo: clientForm.tipo,
      endereco: clientForm.endereco,
      telefone: clientForm.telefone,
      latitude: clientForm.latitude,
      longitude: clientForm.longitude
    };

    setClientes(prev => [...prev, newCli]);
    setClientForm({
      nome_estabelecimento: '',
      tipo: 'quiosque',
      endereco: '',
      telefone: '',
      latitude: -22.5273,
      longitude: -41.9318
    });
    setVendedorTab('orders');
  };

  // Handle item add to order
  const handleAddItemToOrder = (productId: string) => {
    const existing = orderItems.find(item => item.produto_id === productId);
    if (existing) {
      setOrderItems(prev => prev.map(item =>
        item.produto_id === productId ? { ...item, quantidade: item.quantidade + 1 } : item
      ));
    } else {
      setOrderItems(prev => [...prev, { produto_id: productId, quantidade: 1 }]);
    }
  };

  // Update item quantity
  const handleUpdateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setOrderItems(prev => prev.filter(item => item.produto_id !== productId));
    } else {
      setOrderItems(prev => prev.map(item =>
        item.produto_id === productId ? { ...item, quantidade: qty } : item
      ));
    }
  };

  // Calculate prospective order total
  const orderTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      const p = produtos.find(prod => prod.id === item.produto_id);
      return sum + (p ? p.preco_venda * item.quantidade : 0);
    }, 0);
  }, [orderItems, produtos]);

  // Handle submit order
  const handleRegisterOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || orderItems.length === 0) return;

    const newOrderId = 'ped-' + Date.now();
    const newOrder: Pedido = {
      id: newOrderId,
      cliente_id: selectedClientId,
      vendedor_id: 'vendedor-roberto', // Hardcoded for demo login
      entregador_id: selectedEntregadorId || (entregadores[0]?.id || 'entregador-carlos'),
      data_pedido: new Date().toISOString(),
      valor_total: orderTotal,
      status: 'Pendente',
      forma_pagamento: formaPagamento
    };

    // Create item records & update product stock counts
    const newItems: ItemPedido[] = orderItems.map((item, idx) => {
      const p = produtos.find(prod => prod.id === item.produto_id)!;
      return {
        id: `it-new-${Date.now()}-${idx}`,
        pedido_id: newOrderId,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: p.preco_venda
      };
    });

    // Substract stock counts
    setProdutos(prev => prev.map(p => {
      const oItem = orderItems.find(oi => oi.produto_id === p.id);
      if (oItem) {
        return { ...p, estoque_atual: Math.max(0, p.estoque_atual - oItem.quantidade) };
      }
      return p;
    }));

    setItensPedido(prev => [...prev, ...newItems]);
    setPedidos(prev => [newOrder, ...prev]);

    // Reset fields
    setSelectedClientId('');
    setSelectedEntregadorId('');
    setOrderItems([]);
    setFormaPagamento('A Combinar');
    setVendedorTab('orders');
  };

  // Call server to optimize routes using Gemini AI
  const handleOptimizeRoute = async () => {
    setIsOptimizing(true);
    setOptimizedRoute(null);

    // Get active pending orders of the day with client details
    const activeOrders = pedidos
      .filter(p => p.status === 'Pendente' || p.status === 'Em Rota')
      .map(p => {
        const client = clientes.find(c => c.id === p.cliente_id)!;
        return {
          id: p.id,
          nome_estabelecimento: client?.nome_estabelecimento || 'Quiosque',
          endereco: client?.endereco || 'Rio das Ostras',
          status: p.status
        };
      });

    if (activeOrders.length === 0) {
      setIsOptimizing(false);
      alert('Não existem pedidos pendentes para traçar rotas hoje.');
      return;
    }

    try {
      const response = await fetch('/api/optimize-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: activeOrders })
      });
      const data = await response.json();

      // Convert order IDs sequence back to fully hydrated Pedidos
      if (data.success) {
        const orderedPedidos = data.sequence.map((seqOrder: any) => {
          return pedidos.find(p => p.id === seqOrder.id);
        }).filter(Boolean);

        setOptimizedRoute({
          sequence: orderedPedidos,
          routeSummary: data.routeSummary,
          estimatedDistanceKm: data.estimatedDistanceKm,
          estimatedTimeMinutes: data.estimatedTimeMinutes
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Get active route IDs sequence for Map representation
  const activeRouteIds = useMemo(() => {
    if (optimizedRoute) {
      return optimizedRoute.sequence.map(p => p.cliente_id);
    }
    // Fallback: simple pending list
    return pedidos
      .filter(p => p.status === 'Pendente' || p.status === 'Em Rota')
      .map(p => p.cliente_id);
  }, [optimizedRoute, pedidos]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-elegant-card border border-slate-800 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 py-0.5 px-2 rounded-full uppercase tracking-wider">
            Vendas Externas
          </span>
          <h2 className="text-xl font-extrabold mt-1">Terminal do Vendedor</h2>
          <p className="text-slate-400 text-xs mt-0.5">Roberto Silva • Rio das Ostras</p>
        </div>
        <div className="bg-slate-800 border border-slate-700/50 p-3 rounded-2xl">
          <ShoppingBag className="h-6 w-6 text-sky-400" />
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex bg-elegant-surface border border-slate-800 p-1 rounded-xl">
        <button
          onClick={() => setVendedorTab('orders')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition-all ${vendedorTab === 'orders' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Meus Pedidos
        </button>
        <button
          onClick={() => setVendedorTab('new-order')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition-all ${vendedorTab === 'new-order' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Novo Pedido
        </button>
        <button
          onClick={() => setVendedorTab('new-client')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition-all ${vendedorTab === 'new-client' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Novo Cliente
        </button>
        <button
          onClick={() => setVendedorTab('routes')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition-all ${vendedorTab === 'routes' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Rotas (IA)
        </button>
      </div>

      {/* TAB CONTENT: PEDIDOS LIST */}
      {vendedorTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Painel de Pedidos Ativos</h3>
            <button
              onClick={() => setVendedorTab('new-order')}
              className="flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Novo Pedido
            </button>
          </div>

          <div className="space-y-3">
            {pedidos.map(p => {
              const cli = clientes.find(c => c.id === p.cliente_id);
              const driver = perfis.find(prof => prof.id === p.entregador_id);
              
              return (
                <div key={p.id} className="bg-elegant-card p-4 rounded-2xl border border-slate-800 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">ID: {p.id.split('-')[1] || p.id}</span>
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold ${p.status === 'Entregue' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : p.status === 'Em Rota' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
                        {p.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-sky-400" />
                      {cli?.nome_estabelecimento || 'Estabelecimento Excluido'}
                    </h4>
                    <p className="text-[10px] text-slate-400">{cli?.endereco}</p>
                    {driver && (
                      <p className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" /> Entregador: {driver.nome}
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right self-stretch sm:self-center flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800/60">
                    <span className="text-xs text-slate-400 font-medium">Faturado em {p.forma_pagamento}</span>
                    <h4 className="font-extrabold text-white text-sm mt-0.5">
                      R$ {p.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: NEW ORDER */}
      {vendedorTab === 'new-order' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Details Form */}
          <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <ShoppingBag className="h-5 w-5 text-sky-400" />
              Lançar Pedido de Distribuição
            </h3>

            <form onSubmit={handleRegisterOrder} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Selecione o Cliente</label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
                >
                  <option value="">-- Escolha o Estabelecimento --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome_estabelecimento} ({c.endereco.split('-')[1]?.trim() || c.endereco})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Atribuir Entregador (Logística)</label>
                <select
                  required
                  value={selectedEntregadorId}
                  onChange={(e) => setSelectedEntregadorId(e.target.value)}
                  className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
                >
                  <option value="">-- Selecione o Motorista --</option>
                  {entregadores.map(e => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
              </div>

              {/* Added items review */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Itens do Pedido</label>
                {orderItems.length > 0 ? (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {orderItems.map(item => {
                      const p = produtos.find(prod => prod.id === item.produto_id)!;
                      return (
                        <div key={item.produto_id} className="flex justify-between items-center bg-[#0F1115] border border-slate-800 p-2 rounded-lg text-xs">
                          <div>
                            <p className="font-bold text-white">{p.nome}</p>
                            <p className="text-[10px] text-slate-500">R$ {p.preco_venda.toLocaleString('pt-BR')} cada</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQty(item.produto_id, item.quantidade - 1)}
                              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm font-bold text-center cursor-pointer select-none"
                            >
                              -
                            </button>
                            <span className="font-bold w-6 text-center text-white">{item.quantidade}</span>
                            <button
                              type="button"
                              onClick={() => handleAddItemToOrder(item.produto_id)}
                              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm font-bold text-center cursor-pointer select-none"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-slate-800 border-dashed rounded-lg p-6 text-center text-slate-500 text-xs">
                    Nenhum tipo de gelo selecionado. Clique nos produtos ao lado para adicionar.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Forma de Pagamento (Prevista)</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {(['Pix', 'Dinheiro', 'Cartão', 'A Combinar'] as any).map((opt: string) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormaPagamento(opt as any)}
                      className={`py-1.5 text-center text-[10px] font-bold rounded-lg border cursor-pointer transition ${formaPagamento === opt ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-[#0F1115] text-slate-400 border-slate-800 hover:text-slate-200'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#0F1115] border border-slate-800 text-white p-4 rounded-xl flex justify-between items-center shadow-inner">
                <div>
                  <p className="text-[10px] text-slate-500">Total a Pagar</p>
                  <h4 className="text-lg font-black text-white">R$ {orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                </div>
                <button
                  type="submit"
                  disabled={orderItems.length === 0 || !selectedClientId}
                  className="bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm shadow-sky-500/20 cursor-pointer transition"
                >
                  Registrar e Faturar
                </button>
              </div>
            </form>
          </div>

          {/* Product Picker */}
          <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800">Catálogo de Gelo Disponível</h3>
            <div className="space-y-3">
              {produtos.map(p => {
                const alreadyAdded = orderItems.find(item => item.produto_id === p.id);
                return (
                  <div key={p.id} className="border border-slate-850 p-3.5 rounded-xl flex justify-between items-center hover:border-slate-800 transition-all">
                    <div>
                      <h4 className="font-bold text-white text-sm">{p.nome}</h4>
                      <p className="text-xs text-sky-400 font-extrabold mt-0.5">
                        R$ {p.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-[9px] font-semibold mt-1 ${p.estoque_atual < 100 ? 'text-red-400' : 'text-slate-500'}`}>
                        Disponível em Fábrica: {p.estoque_atual} un
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={p.estoque_atual === 0}
                      onClick={() => handleAddItemToOrder(p.id)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${alreadyAdded ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-[#0F1115] hover:bg-slate-800 text-slate-300 border border-slate-850'}`}
                    >
                      {alreadyAdded ? (
                        <div className="flex items-center gap-1 text-xs font-bold">
                          <Check className="h-3 w-3" /> {alreadyAdded.quantidade} un
                        </div>
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: NEW CLIENT */}
      {vendedorTab === 'new-client' && (
        <div className="max-w-md mx-auto bg-elegant-card p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-1.5 pb-2 border-b border-slate-800">
            <Building className="h-5 w-5 text-sky-400" />
            Cadastrar Ponto Comercial (Rio das Ostras)
          </h3>

          <form onSubmit={handleCreateClient} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Nome do Estabelecimento</label>
              <input
                type="text"
                required
                placeholder="Ex: Quiosque Tartaruga"
                value={clientForm.nome_estabelecimento}
                onChange={(e) => setClientForm(prev => ({ ...prev, nome_estabelecimento: e.target.value }))}
                className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
              <select
                value={clientForm.tipo}
                onChange={(e) => setClientForm(prev => ({ ...prev, tipo: e.target.value as any }))}
                className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
              >
                <option value="quiosque">Quiosque de Praia</option>
                <option value="bar">Bar / Restaurante</option>
                <option value="depósito">Depósito de Gelo / Bebidas</option>
                <option value="evento">Evento Local</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Endereço Completo</label>
              <input
                type="text"
                required
                placeholder="Ex: Av. Costazul, 20 - Costazul, Rio das Ostras - RJ"
                value={clientForm.endereco}
                onChange={(e) => setClientForm(prev => ({ ...prev, endereco: e.target.value }))}
                className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Contato (Telefone Comercial)</label>
              <input
                type="text"
                required
                placeholder="Ex: 22988880012"
                value={clientForm.telefone}
                onChange={(e) => setClientForm(prev => ({ ...prev, telefone: e.target.value }))}
                className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={clientForm.latitude}
                  onChange={(e) => setClientForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
                  className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={clientForm.longitude}
                  onChange={(e) => setClientForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
                  className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500/50 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-sky-500 text-white font-semibold text-xs py-2.5 rounded-xl hover:bg-sky-600 transition shadow-md shadow-sky-500/10 cursor-pointer"
            >
              Confirmar Cadastro de Cliente
            </button>
          </form>
        </div>
      )}

      {/* TAB CONTENT: IA ROUTES */}
      {vendedorTab === 'routes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Column */}
          <div className="lg:col-span-2 space-y-4">
            <MapRioOstras
              clientes={clientes}
              activeRouteIds={activeRouteIds}
              vendedorMode={true}
              onOptimizeClick={handleOptimizeRoute}
              isOptimizing={isOptimizing}
            />
          </div>

          {/* AI Instructions & Order Sequence List */}
          <div className="space-y-4">
            {optimizedRoute ? (
              <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Sparkles className="h-5 w-5 text-sky-400 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Rota Otimizada por IA</h3>
                    <p className="text-[9px] text-slate-500">Sequência inteligente gerada pelo Gemini API</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-[#0F1115] border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Distância</span>
                    <h4 className="font-extrabold text-white mt-0.5">{optimizedRoute.estimatedDistanceKm} Km</h4>
                  </div>
                  <div className="bg-[#0F1115] border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Tempo Estimado</span>
                    <h4 className="font-extrabold text-white mt-0.5">{optimizedRoute.estimatedTimeMinutes} min</h4>
                  </div>
                </div>

                <div className="bg-sky-950/40 text-sky-300 p-3.5 rounded-xl font-mono text-[10px] leading-relaxed border border-sky-900/40 shadow-inner">
                  {optimizedRoute.routeSummary}
                </div>

                {/* Ordered delivery stops */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Ordem das Paradas</span>
                  {optimizedRoute.sequence.map((p, idx) => {
                    const cli = clientes.find(c => c.id === p.cliente_id)!;
                    return (
                      <div key={p.id} className="flex items-center gap-2.5 bg-[#0F1115] border border-slate-850 p-2.5 rounded-lg text-xs">
                        <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="flex-1 truncate">
                          <h5 className="font-bold text-white">{cli?.nome_estabelecimento}</h5>
                          <p className="text-[9px] text-slate-500 truncate">{cli?.endereco}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm text-center py-10 flex flex-col items-center justify-center">
                <Navigation className="h-8 w-8 text-sky-400 mb-2 animate-bounce" />
                <h4 className="font-bold text-white text-xs">Pronto para Otimização de Rota</h4>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-relaxed">
                  Clique no botão "Otimizar Rota (IA)" no topo do mapa para calcular o trajeto mais inteligente entre os quiosques e depósitos ativos de Rio das Ostras.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
