/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Check,
  User,
  Building,
  Truck,
  DollarSign,
  AlertCircle,
  X,
  TrendingUp,
  Award,
  Users
} from 'lucide-react';
import { Cliente, Produto, Pedido, ItemPedido, Perfil } from '../types';

interface VenderFormProps {
  clientes: Cliente[];
  setClientes: React.Dispatch<React.SetStateAction<Cliente[]>>;
  produtos: Produto[];
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>;
  pedidos: Pedido[];
  setPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>;
  itensPedido: ItemPedido[];
  setItensPedido: React.Dispatch<React.SetStateAction<ItemPedido[]>>;
  perfis: Perfil[];
  currentUser: Perfil;
  preselectedVendedorId?: string;
  onSuccess?: () => void;
}

export default function VenderForm({
  clientes,
  setClientes,
  produtos,
  setProdutos,
  pedidos,
  setPedidos,
  itensPedido,
  setItensPedido,
  perfis,
  currentUser,
  preselectedVendedorId,
  onSuccess
}: VenderFormProps) {
  // Setup default seller based on currentUser or preselected value
  const [selectedVendedorId, setSelectedVendedorId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedEntregadorId, setSelectedEntregadorId] = useState('');
  const [orderItems, setOrderItems] = useState<{ produto_id: string; quantidade: number }[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<'Pix' | 'Dinheiro' | 'Cartão' | 'A Combinar'>('A Combinar');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize seller
  useEffect(() => {
    if (preselectedVendedorId) {
      setSelectedVendedorId(preselectedVendedorId);
    } else if (currentUser) {
      // Find matching profile by name or id
      const match = perfis.find(p => p.id === currentUser.id || p.nome === currentUser.nome);
      if (match) {
        setSelectedVendedorId(match.id);
      } else {
        setSelectedVendedorId(currentUser.id || perfis[0]?.id || '');
      }
    }
  }, [preselectedVendedorId, currentUser, perfis]);

  const entregadores = useMemo(() => {
    return perfis.filter(p => p.role === 'entregador');
  }, [perfis]);

  const vendedoresESocios = useMemo(() => {
    // List all users that can perform a sale
    return perfis.filter(p => ['master', 'socio', 'vendedor'].includes(p.role));
  }, [perfis]);

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

  // Update item quantity directly (editable input)
  const handleUpdateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setOrderItems(prev => prev.filter(item => item.produto_id !== productId));
    } else {
      setOrderItems(prev => prev.map(item =>
        item.produto_id === productId ? { ...item, quantidade: qty } : item
      ));
    }
  };

  // Calculate order total
  const orderTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      const p = produtos.find(prod => prod.id === item.produto_id);
      return sum + (p ? p.preco_venda * item.quantidade : 0);
    }, 0);
  }, [orderItems, produtos]);

  // Handle submit order
  const handleRegisterOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedVendedorId) {
      setErrorMsg('Por favor, selecione o vendedor/sócio responsável.');
      return;
    }
    if (!selectedClientId) {
      setErrorMsg('Por favor, selecione o cliente para faturamento.');
      return;
    }
    if (orderItems.length === 0) {
      setErrorMsg('Por favor, adicione pelo menos um tipo de gelo ao pedido.');
      return;
    }

    // Verify stock availability
    let stockError = false;
    orderItems.forEach(oi => {
      const p = produtos.find(prod => prod.id === oi.produto_id);
      if (p && p.estoque_atual < oi.quantidade) {
        setErrorMsg(`Quantidade solicitada de "${p.nome}" (${oi.quantidade} un) excede o estoque atual de fábrica (${p.estoque_atual} un).`);
        stockError = true;
      }
    });
    if (stockError) return;

    const newOrderId = 'ped-' + Date.now();
    const finalVendedorProfile = perfis.find(p => p.id === selectedVendedorId);
    
    const newOrder: Pedido = {
      id: newOrderId,
      cliente_id: selectedClientId,
      vendedor_id: finalVendedorProfile ? finalVendedorProfile.id : selectedVendedorId,
      entregador_id: selectedEntregadorId || (entregadores[0]?.id || 'entregador-carlos'),
      data_pedido: new Date().toISOString(),
      valor_total: orderTotal,
      status: 'Pendente',
      forma_pagamento: formaPagamento,
      pago: formaPagamento !== 'A Combinar'
    };

    // Create item records
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

    // Subtract stock counts
    setProdutos(prev => prev.map(p => {
      const oItem = orderItems.find(oi => oi.produto_id === p.id);
      if (oItem) {
        return { ...p, estoque_atual: Math.max(0, p.estoque_atual - oItem.quantidade) };
      }
      return p;
    }));

    setItensPedido(prev => [...prev, ...newItems]);
    setPedidos(prev => [newOrder, ...prev]);

    setSuccessMsg('Venda registrada com absoluto sucesso!');
    
    // Reset form states
    setSelectedClientId('');
    setSelectedEntregadorId('');
    setOrderItems([]);
    setFormaPagamento('A Combinar');

    // Fire success callback after short delay
    if (onSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top duration-200">
          <Check className="h-5 w-5 shrink-0 text-emerald-400" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form panel */}
        <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm space-y-5">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-sky-400" />
                Lançar Nova Venda / Pedido
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Registre vendas faturadas no sistema de frotas</p>
            </div>
            {preselectedVendedorId && (
              <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-bold">
                Foco: {perfis.find(p => p.id === preselectedVendedorId)?.nome || preselectedVendedorId}
              </span>
            )}
          </div>

          <form onSubmit={handleRegisterOrder} className="space-y-4">
            {/* Responsible Seller Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendedor / Sócio Responsável</label>
              <div className="relative mt-1">
                <select
                  required
                  value={selectedVendedorId}
                  onChange={(e) => setSelectedVendedorId(e.target.value)}
                  className="w-full border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-sky-500/50 cursor-pointer"
                >
                  <option value="">-- Escolha o Vendedor / Sócio --</option>
                  {perfis.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.nome} ({v.role === 'socio' ? 'Sócio' : v.role === 'master' ? 'Master' : 'Vendedor'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Client selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selecione o Cliente</label>
              <select
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-sky-500/50 cursor-pointer"
              >
                <option value="">-- Escolha o Estabelecimento --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome_estabelecimento} ({c.endereco.split('-')[1]?.trim() || c.endereco})
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Driver selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atribuir Entregador (Logística)</label>
              <select
                required
                value={selectedEntregadorId}
                onChange={(e) => setSelectedEntregadorId(e.target.value)}
                className="w-full mt-1 border border-slate-800 bg-[#0F1115] text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-sky-500/50 cursor-pointer"
              >
                <option value="">-- Selecione o Motorista --</option>
                {entregadores.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>

            {/* Added items list */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Itens Selecionados no Pedido</label>
              {orderItems.length > 0 ? (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {orderItems.map(item => {
                    const p = produtos.find(prod => prod.id === item.produto_id)!;
                    if (!p) return null;
                    return (
                      <div key={item.produto_id} className="flex justify-between items-center bg-[#0F1115] border border-slate-800 p-2.5 rounded-xl text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white">{p.nome}</p>
                          <p className="text-[10px] text-slate-500">R$ {p.preco_venda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cada</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.produto_id, item.quantidade - 1)}
                            className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-center flex items-center justify-center cursor-pointer select-none border border-slate-700"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          
                          {/* DIRECT EDITABLE QUANTITY INPUT */}
                          <input
                            type="number"
                            min="0"
                            value={item.quantidade}
                            onChange={(e) => handleUpdateItemQty(item.produto_id, parseInt(e.target.value) || 0)}
                            className="w-12 bg-slate-900 border border-slate-800 rounded-lg py-1 px-1.5 text-xs text-center text-white font-bold font-mono focus:outline-none focus:border-sky-500"
                          />
                          
                          <button
                            type="button"
                            onClick={() => handleAddItemToOrder(item.produto_id)}
                            className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-center flex items-center justify-center cursor-pointer select-none border border-slate-700"
                          >
                            <Plus className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.produto_id, 0)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 cursor-pointer ml-1"
                            title="Remover Item"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-slate-800 border-dashed rounded-xl p-6 text-center text-slate-500 text-xs">
                  Nenhum tipo de gelo selecionado. Clique nos produtos ao lado para adicionar.
                </div>
              )}
            </div>

            {/* Payment options */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Forma de Pagamento (Prevista)</label>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {(['Pix', 'Dinheiro', 'Cartão', 'A Combinar'] as any).map((opt: string) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormaPagamento(opt as any)}
                    className={`py-2 text-center text-[10px] font-bold rounded-lg border cursor-pointer transition ${formaPagamento === opt ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-[#0F1115] text-slate-400 border-slate-800 hover:text-slate-200'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom summary and submit */}
            <div className="bg-[#0F1115] border border-slate-850 text-white p-4 rounded-xl flex justify-between items-center shadow-inner mt-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total do Pedido</p>
                <h4 className="text-base font-black text-white">R$ {orderTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
              </div>
              <button
                type="submit"
                disabled={orderItems.length === 0 || !selectedClientId || !selectedVendedorId}
                className="bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md shadow-sky-500/15 cursor-pointer transition"
              >
                Registrar Venda
              </button>
            </div>
          </form>
        </div>

        {/* Product picker */}
        <div className="bg-elegant-card p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-white text-sm pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>Catálogo de Gelo Disponível</span>
            <span className="text-[10px] text-slate-400 font-normal">Clique para adicionar</span>
          </h3>
          <div className="space-y-3">
            {produtos.map(p => {
              const alreadyAdded = orderItems.find(item => item.produto_id === p.id);
              return (
                <div key={p.id} className="border border-slate-850 p-3.5 rounded-xl flex justify-between items-center hover:border-slate-800 transition-all bg-[#0F1115]">
                  <div>
                    <h4 className="font-bold text-white text-sm">{p.nome}</h4>
                    <p className="text-xs text-sky-400 font-bold mt-0.5">
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
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${alreadyAdded ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-extrabold text-xs' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
                  >
                    {alreadyAdded ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Check className="h-3.5 w-3.5" /> {alreadyAdded.quantidade} un
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
    </div>
  );
}
