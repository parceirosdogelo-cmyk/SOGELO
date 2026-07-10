/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Building,
  User,
  Truck,
  CheckCircle,
  Clock,
  DollarSign,
  Undo2,
  Trash2,
  Calendar,
  AlertCircle,
  CreditCard,
  Plus
} from 'lucide-react';
import { Pedido, Cliente, Perfil, ItemPedido, Produto } from '../types';

interface SalesHistoryTabsProps {
  pedidos: Pedido[];
  setPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>;
  clientes: Cliente[];
  perfis: Perfil[];
  itensPedido: ItemPedido[];
  produtos: Produto[];
  currentRole: 'master' | 'socio' | 'vendedor' | 'entregador';
}

type TabType = 'entregar' | 'entregue' | 'receber' | 'pagos';

export default function SalesHistoryTabs({
  pedidos,
  setPedidos,
  clientes,
  perfis,
  itensPedido,
  produtos,
  currentRole
}: SalesHistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('entregar');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  // List of available delivery guys
  const entregadores = useMemo(() => {
    return perfis.filter(p => p.role === 'entregador');
  }, [perfis]);

  // Handle order status change
  const handleUpdateStatus = (pedidoId: string, newStatus: 'Pendente' | 'Em Rota' | 'Entregue' | 'Cancelado') => {
    setPedidos(prev => prev.map(p => {
      if (p.id === pedidoId) {
        return {
          ...p,
          status: newStatus,
          // If marked as entregue and the payment is Pix/Dinheiro/Cartao, default pago to true
          pago: newStatus === 'Entregue' ? (p.forma_pagamento !== 'A Combinar' ? true : p.pago) : p.pago
        };
      }
      return p;
    }));
  };

  // Handle order payment status change
  const handleUpdatePayment = (pedidoId: string, isPaid: boolean) => {
    setPedidos(prev => prev.map(p => {
      if (p.id === pedidoId) {
        return { ...p, pago: isPaid };
      }
      return p;
    }));
  };

  // Handle changing the delivery driver
  const handleAssignDriver = (pedidoId: string, driverId: string) => {
    setPedidos(prev => prev.map(p => {
      if (p.id === pedidoId) {
        return { ...p, entregador_id: driverId };
      }
      return p;
    }));
  };

  // Handle deleting an order
  const handleDeleteOrder = (pedidoId: string) => {
    if (window.confirm('Tem certeza que deseja cancelar e excluir este pedido?')) {
      setPedidos(prev => prev.filter(p => p.id !== pedidoId));
    }
  };

  // Filter orders based on active tab
  const tabFilteredPedidos = useMemo(() => {
    switch (activeTab) {
      case 'entregar':
        return pedidos.filter(p => p.status === 'Pendente' || p.status === 'Em Rota');
      case 'entregue':
        return pedidos.filter(p => p.status === 'Entregue');
      case 'receber':
        return pedidos.filter(p => p.pago === false || p.pago === undefined);
      case 'pagos':
        return pedidos.filter(p => p.pago === true);
      default:
        return pedidos;
    }
  }, [pedidos, activeTab]);

  // Apply search and payment method filter
  const processedPedidos = useMemo(() => {
    return tabFilteredPedidos.filter(p => {
      const client = clientes.find(c => c.id === p.cliente_id);
      const seller = perfis.find(prof => prof.id === p.vendedor_id);
      
      const clientName = client?.nome_estabelecimento || '';
      const clientAddress = client?.endereco || '';
      const sellerName = seller?.nome || p.vendedor_id;
      const orderId = p.id;

      const matchesSearch = 
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orderId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPayment = filterPayment === 'all' || p.forma_pagamento === filterPayment;

      return matchesSearch && matchesPayment;
    });
  }, [tabFilteredPedidos, clientes, perfis, searchTerm, filterPayment]);

  // Compute summary stats for the current list view
  const summaryStats = useMemo(() => {
    const totalCount = processedPedidos.length;
    const totalValue = processedPedidos.reduce((sum, p) => sum + p.valor_total, 0);
    return { totalCount, totalValue };
  }, [processedPedidos]);

  return (
    <div className="space-y-4">
      {/* GLOBAL VISIBILITY BADGE */}
      <div className="bg-[#0F1115] border border-slate-800 rounded-xl px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Visibilidade Geral Ativada
          </span>
        </div>
        <p className="text-[10px] text-slate-400">
          Todos os pedidos feitos por todos os vendedores estão visíveis para todos os colaboradores.
        </p>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="grid grid-cols-4 gap-1 bg-elegant-surface border border-slate-800 p-1 rounded-2xl">
        <button
          onClick={() => { setActiveTab('entregar'); setSearchTerm(''); }}
          className={`py-2 px-1 text-center rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center ${
            activeTab === 'entregar'
              ? 'bg-slate-800 text-sky-400 border border-slate-700/60 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4 mb-1" />
          <span className="text-[9px] sm:text-[10px] tracking-tight">Entregar</span>
          <span className="text-[9px] opacity-60 font-mono mt-0.5">
            ({pedidos.filter(p => p.status === 'Pendente' || p.status === 'Em Rota').length})
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('entregue'); setSearchTerm(''); }}
          className={`py-2 px-1 text-center rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center ${
            activeTab === 'entregue'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700/60 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle className="h-4 w-4 mb-1" />
          <span className="text-[9px] sm:text-[10px] tracking-tight">Entregue</span>
          <span className="text-[9px] opacity-60 font-mono mt-0.5">
            ({pedidos.filter(p => p.status === 'Entregue').length})
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('receber'); setSearchTerm(''); }}
          className={`py-2 px-1 text-center rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center ${
            activeTab === 'receber'
              ? 'bg-slate-800 text-amber-400 border border-slate-700/60 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="h-4 w-4 mb-1" />
          <span className="text-[9px] sm:text-[10px] tracking-tight">Receber</span>
          <span className="text-[9px] opacity-60 font-mono mt-0.5">
            ({pedidos.filter(p => p.pago === false || p.pago === undefined).length})
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('pagos'); setSearchTerm(''); }}
          className={`py-2 px-1 text-center rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center ${
            activeTab === 'pagos'
              ? 'bg-slate-800 text-teal-400 border border-slate-700/60 shadow-md font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle className="h-4 w-4 mb-1" />
          <span className="text-[9px] sm:text-[10px] tracking-tight">Pagos</span>
          <span className="text-[9px] opacity-60 font-mono mt-0.5">
            ({pedidos.filter(p => p.pago === true).length})
          </span>
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, endereço, vendedor ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-elegant-surface border border-slate-800 text-slate-200 text-xs rounded-xl focus:border-sky-500/50 focus:outline-none transition-all"
          />
        </div>
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="bg-elegant-surface border border-slate-800 text-slate-300 text-xs rounded-xl p-2 focus:outline-none focus:border-sky-500/50"
        >
          <option value="all">Formas de Pagamento (Todas)</option>
          <option value="Pix">Pix</option>
          <option value="Dinheiro">Dinheiro</option>
          <option value="Cartão">Cartão</option>
          <option value="A Combinar">A Combinar</option>
        </select>
      </div>

      {/* SUMMARY BAR */}
      <div className="bg-[#0F1115] px-4 py-2 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Resultados: <strong className="text-slate-200">{summaryStats.totalCount}</strong> pedido(s)
        </span>
        <span className="text-slate-400">
          Total Filtrado: <strong className="text-emerald-400">R$ {summaryStats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
        </span>
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {processedPedidos.length > 0 ? (
          processedPedidos.map(p => {
            const cli = clientes.find(c => c.id === p.cliente_id);
            const seller = perfis.find(prof => prof.id === p.vendedor_id || prof.nome === p.vendedor_id);
            const driver = perfis.find(prof => prof.id === p.entregador_id);
            
            // Get order items
            const orderItemsDetails = itensPedido.filter(item => item.pedido_id === p.id);

            return (
              <div
                key={p.id}
                className="bg-elegant-card p-4 rounded-2xl border border-slate-800 hover:border-slate-700/60 shadow-sm transition flex flex-col gap-3 relative overflow-hidden"
              >
                {/* Visual side accent matching active tab */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  activeTab === 'entregar' ? 'bg-sky-500' :
                  activeTab === 'entregue' ? 'bg-emerald-500' :
                  activeTab === 'receber' ? 'bg-amber-500' : 'bg-teal-500'
                }`} />

                {/* Top Row: Info Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      ID: {p.id.split('-')[1] || p.id}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md font-medium">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      {new Date(p.data_pedido).toLocaleDateString('pt-BR')} {new Date(p.data_pedido).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">
                      <User className="h-3 w-3" />
                      Vend: {seller ? seller.nome : p.vendedor_id}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase ${
                      p.status === 'Entregue'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : p.status === 'Em Rota'
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                        : p.status === 'Cancelado'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    }`}>
                      {p.status}
                    </span>

                    {/* Payment Badge */}
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider uppercase ${
                      p.pago
                        ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                    }`}>
                      {p.pago ? 'PAGO' : 'Á RECEBER'}
                    </span>
                  </div>
                </div>

                {/* Client and address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-slate-850 pt-2.5">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-slate-400" />
                      {cli?.nome_estabelecimento || 'Cliente não encontrado'}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 pl-5">
                      {cli?.endereco || 'Endereço não disponível'}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center text-[10px] text-slate-400 pl-5 md:pl-0">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                      <span>Forma de Pagamento: <strong className="text-slate-300">{p.forma_pagamento}</strong></span>
                    </div>
                    {driver ? (
                      <div className="flex items-center gap-1.5 mt-1 text-indigo-400">
                        <Truck className="h-3.5 w-3.5" />
                        <span>Entregador: <strong>{driver.nome}</strong></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Nenhum entregador designado</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items in the order */}
                {orderItemsDetails.length > 0 && (
                  <div className="bg-[#0F1115]/60 border border-slate-850 p-2.5 rounded-xl text-[11px] space-y-1 ml-5">
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">Itens do Pedido</p>
                    {orderItemsDetails.map(item => {
                      const prod = produtos.find(pr => pr.id === item.produto_id);
                      return (
                        <div key={item.id} className="flex justify-between items-center text-slate-300">
                          <span>
                            {prod?.nome || 'Gelo'} <strong className="text-slate-400 font-semibold font-mono">x{item.quantidade}</strong>
                          </span>
                          <span className="font-mono text-slate-400">
                            R$ {(item.quantidade * item.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bottom Row: Totals & Interactive actions */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-slate-850 pt-3">
                  {/* Financial representation */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Valor Total:</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      R$ {p.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Quick Status / Payment Action Panel */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Deliver status workflow triggers */}
                    {activeTab === 'entregar' && (
                      <>
                        {p.status === 'Pendente' && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'Em Rota')}
                            className="bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 hover:text-sky-300 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-sky-500/20 transition cursor-pointer flex items-center gap-1"
                          >
                            <Truck className="h-3 w-3" /> Despachar Rota
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(p.id, 'Entregue')}
                          className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-emerald-500/20 transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" /> Confirmar Entrega
                        </button>
                      </>
                    )}

                    {/* Return order delivery stage */}
                    {activeTab === 'entregue' && (
                      <button
                        onClick={() => handleUpdateStatus(p.id, 'Pendente')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-slate-700/60 transition cursor-pointer flex items-center gap-1"
                      >
                        <Undo2 className="h-3 w-3" /> Reverter Entrega
                      </button>
                    )}

                    {/* Receive payments workflow */}
                    {activeTab === 'receber' && (
                      <button
                        onClick={() => handleUpdatePayment(p.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-md transition cursor-pointer flex items-center gap-1"
                      >
                        <DollarSign className="h-3 w-3" /> Confirmar Recebimento
                      </button>
                    )}

                    {/* Paid cancelation/reversal workflow */}
                    {activeTab === 'pagos' && (
                      <button
                        onClick={() => handleUpdatePayment(p.id, false)}
                        className="bg-amber-600/25 hover:bg-amber-600/35 text-amber-400 hover:text-amber-300 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-amber-500/20 transition cursor-pointer flex items-center gap-1"
                      >
                        <Undo2 className="h-3 w-3" /> Reverter Pagamento
                      </button>
                    )}

                    {/* Assigning deliverer selector if user has permissions */}
                    {(currentRole === 'master' || currentRole === 'socio') && (
                      <select
                        value={p.entregador_id || ''}
                        onChange={(e) => handleAssignDriver(p.id, e.target.value)}
                        className="bg-slate-800 border border-slate-700/60 text-slate-300 text-[10px] font-bold p-1 rounded-lg cursor-pointer focus:outline-none focus:border-sky-500/50"
                      >
                        <option value="">Designar Entregador</option>
                        {entregadores.map(drv => (
                          <option key={drv.id} value={drv.id}>🚚 {drv.nome}</option>
                        ))}
                      </select>
                    )}

                    {/* Cancel/Delete action button (Master & Socio only) */}
                    {(currentRole === 'master' || currentRole === 'socio' || currentRole === 'vendedor') && (
                      <button
                        onClick={() => handleDeleteOrder(p.id)}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-1.5 rounded-lg border border-rose-500/20 transition cursor-pointer"
                        title="Cancelar e Excluir Pedido"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-slate-500 bg-[#0F1115]/50 border border-slate-850 rounded-2xl flex flex-col items-center justify-center space-y-2">
            <AlertCircle className="h-8 w-8 text-slate-600" />
            <p className="text-xs">Nenhum pedido correspondente encontrado nesta aba.</p>
          </div>
        )}
      </div>
    </div>
  );
}
