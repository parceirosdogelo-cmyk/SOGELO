/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Truck,
  MapPin,
  Building,
  CheckCircle,
  Smartphone,
  Navigation,
  Clock,
  Coins,
  ShoppingBag
} from 'lucide-react';
import { Cliente, Pedido, Perfil, Produto, ItemPedido } from '../types';
import MapRioOstras from './MapRioOstras';
import VenderForm from './VenderForm';

interface EntregadorDashboardProps {
  pedidos: Pedido[];
  setPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>;
  clientes: Cliente[];
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  produtos: Produto[];
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>;
  itensPedido: ItemPedido[];
  setItensPedido: React.Dispatch<React.SetStateAction<ItemPedido[]>>;
  perfis: Perfil[];
  currentUser: Perfil;
}

export default function EntregadorDashboard({
  pedidos,
  setPedidos,
  clientes,
  setClientes,
  produtos,
  setProdutos,
  itensPedido,
  setItensPedido,
  perfis,
  currentUser,
}: EntregadorDashboardProps) {
  const [entregadorTab, setEntregadorTab] = useState<'deliveries' | 'route' | 'vender'>('deliveries');
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);
  
  // Payment option selector for delivery confirmation
  const [selectedPayment, setSelectedPayment] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix');

  // Logged-in delivery guy id is hardcoded as 'entregador-carlos' for demo simulation
  const driverId = 'entregador-carlos';

  // Filter orders assigned strictly to this delivery guy
  const assignedPedidos = useMemo(() => {
    return pedidos.filter(p => p.entregador_id === driverId);
  }, [pedidos, driverId]);

  // Handle status and payment updates
  const handleUpdateStatus = (pedidoId: string, status: 'Em Rota' | 'Entregue' | 'Cancelado') => {
    setPedidos(prev => prev.map(p => {
      if (p.id === pedidoId) {
        return {
          ...p,
          status,
          forma_pagamento: status === 'Entregue' ? selectedPayment : p.forma_pagamento
        };
      }
      return p;
    }));

    if (status === 'Entregue' || status === 'Cancelado') {
      setSelectedPedidoId(null);
    }
  };

  // Active delivery sequence for map
  const activeRouteIds = useMemo(() => {
    return assignedPedidos
      .filter(p => p.status === 'Pendente' || p.status === 'Em Rota')
      .map(p => p.cliente_id);
  }, [assignedPedidos]);

  // Currently selected order for details card
  const activePedido = useMemo(() => {
    return assignedPedidos.find(p => p.id === selectedPedidoId);
  }, [assignedPedidos, selectedPedidoId]);

  const activeCliente = useMemo(() => {
    if (!activePedido) return null;
    return clientes.find(c => c.id === activePedido.cliente_id);
  }, [activePedido, clientes]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-elegant-card border border-slate-800 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 py-0.5 px-2 rounded-full uppercase tracking-wider">
            Painel Logístico
          </span>
          <h2 className="text-xl font-extrabold mt-1">Terminal do Entregador</h2>
          <p className="text-slate-400 text-xs mt-0.5">Carlos Entregador • Iveco Daily 2014</p>
        </div>
        <div className="bg-slate-800 border border-slate-700/50 p-3 rounded-2xl">
          <Truck className="h-6 w-6 text-amber-400" />
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex bg-elegant-surface border border-slate-800 p-1 rounded-xl">
        <button
          onClick={() => setEntregadorTab('deliveries')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition-all ${entregadorTab === 'deliveries' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Minhas Entregas ({assignedPedidos.filter(p => p.status !== 'Entregue' && p.status !== 'Cancelado').length} pendentes)
        </button>
        <button
          onClick={() => setEntregadorTab('route')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition-all ${entregadorTab === 'route' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Minha Rota Ativa
        </button>
        <button
          onClick={() => setEntregadorTab('vender')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition-all ${entregadorTab === 'vender' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
        >
          🛒 Vender / Novo Pedido
        </button>
      </div>

      {/* TAB CONTENT: DELIVERIES LIST & DETAILS */}
      {entregadorTab === 'deliveries' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Deliveries list column */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-bold text-white text-sm">Entregas do Dia em Rio das Ostras</h3>
            
            {assignedPedidos.length > 0 ? (
              <div className="space-y-3">
                {assignedPedidos.map(p => {
                  const cli = clientes.find(c => c.id === p.cliente_id);
                  const isFinished = p.status === 'Entregue' || p.status === 'Cancelado';

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isFinished && setSelectedPedidoId(p.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${isFinished ? 'bg-[#0F1115]/50 border-slate-900 opacity-40' : selectedPedidoId === p.id ? 'bg-elegant-card border-amber-500 ring-2 ring-amber-500/15 shadow-md' : 'bg-elegant-card border-slate-800 hover:border-slate-700 shadow-xs'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-slate-500 font-semibold">ID: {p.id.split('-')[1] || p.id}</span>
                            <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold ${p.status === 'Entregue' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : p.status === 'Em Rota' ? 'bg-sky-500/15 text-sky-400 border-sky-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
                              {p.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                            <Building className="h-4 w-4 text-amber-400" />
                            {cli?.nome_estabelecimento}
                          </h4>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-500" />
                            {cli?.endereco}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500">Valor a cobrar</p>
                          <h4 className="font-black text-white text-sm">
                            R$ {p.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </h4>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-elegant-card border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
                Nenhum pedido atribuído a você hoje.
              </div>
            )}
          </div>

          {/* Action and details card */}
          <div>
            {activePedido && activeCliente ? (
              <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm">Gerenciar Entrega Ativa</h3>
                  <p className="text-[10px] text-slate-500">Ações logísticas para o estabelecimento</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-white text-xs">{activeCliente.nome_estabelecimento}</h4>
                  <p className="text-xs text-slate-300 leading-normal">{activeCliente.endereco}</p>
                  <p className="text-xs font-mono text-slate-400">Contato: {activeCliente.telefone}</p>
                </div>

                <div className="bg-[#0F1115] border border-slate-850 p-3.5 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase text-[9px]">Valor do Recebimento</span>
                  <span className="font-extrabold text-white text-sm">
                    R$ {activePedido.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Status Transitions */}
                <div className="space-y-3 pt-2">
                  {activePedido.status === 'Pendente' && (
                    <button
                      onClick={() => handleUpdateStatus(activePedido.id, 'Em Rota')}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/10"
                    >
                      <Navigation className="h-4 w-4" />
                      Iniciar Rota de Entrega
                    </button>
                  )}

                  {activePedido.status === 'Em Rota' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                          Forma de Pagamento Recebida
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['Pix', 'Dinheiro', 'Cartão'] as any).map((opt: string) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setSelectedPayment(opt as any)}
                              className={`py-1.5 text-center text-xs font-bold rounded-lg border cursor-pointer transition ${selectedPayment === opt ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-[#0F1115] text-slate-400 border-slate-850 hover:text-slate-200'}`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateStatus(activePedido.id, 'Cancelado')}
                          className="py-2 border border-slate-800 text-slate-400 hover:bg-slate-800/50 font-semibold text-xs rounded-lg transition cursor-pointer"
                        >
                          Recusado / Voltar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(activePedido.id, 'Entregue')}
                          className="py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-emerald-500/10"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Confirmar Entrega
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-elegant-card border border-slate-800 border-dashed rounded-2xl p-6 text-center text-slate-500 text-xs py-12 flex flex-col items-center justify-center">
                <Clock className="h-8 w-8 text-slate-600 mb-1" />
                <p>Nenhum pedido selecionado.</p>
                <p className="text-[10px] mt-0.5">Selecione uma entrega ativa para gerenciar.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ROUTE MAP */}
      {entregadorTab === 'route' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Minhas Paradas e Ordem de Entrega</h3>
            <span className="text-xs text-slate-400 font-semibold">
              Total de {activeRouteIds.length} paradas ativas
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MapRioOstras clientes={clientes} activeRouteIds={activeRouteIds} />
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sequência das Paradas</span>
              {assignedPedidos
                .filter(p => p.status === 'Pendente' || p.status === 'Em Rota')
                .map((p, idx) => {
                  const cli = clientes.find(c => c.id === p.cliente_id)!;
                  return (
                    <div key={p.id} className="flex items-center gap-2.5 bg-[#0F1115] p-3 rounded-xl border border-slate-850 shadow-xs">
                      <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex-1 truncate text-xs">
                        <h4 className="font-bold text-white">{cli?.nome_estabelecimento}</h4>
                        <p className="text-[9px] text-slate-500 truncate">{cli?.endereco}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-sky-400">{p.status}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: VENDER */}
      {entregadorTab === 'vender' && (
        <div className="animate-in fade-in duration-200">
          <VenderForm
            clientes={clientes}
            setClientes={setClientes}
            produtos={produtos}
            setProdutos={setProdutos}
            pedidos={pedidos}
            setPedidos={setPedidos}
            itensPedido={itensPedido}
            setItensPedido={setItensPedido}
            perfis={perfis}
            currentUser={currentUser}
            onSuccess={() => {
              setEntregadorTab('deliveries');
            }}
          />
        </div>
      )}
    </div>
  );
}
