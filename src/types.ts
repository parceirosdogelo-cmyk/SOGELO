/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'master' | 'socio' | 'vendedor' | 'entregador';

export interface Perfil {
  id: string;
  nome: string;
  telefone: string;
  role: UserRole;
  senha_hash?: string; // Included if we want to simulate verification
  senha?: string;      // Simple plaintext password for demo/newly added users
}

export interface InvestimentoFrota {
  id: string;
  veiculo: string;
  valor: number;
  proprietario: 'Wagner' | 'Mauro';
  data_aquisicao: string;
}

export interface Cliente {
  id: string;
  nome_estabelecimento: string;
  tipo: 'quiosque' | 'bar' | 'depósito' | 'evento';
  endereco: string;
  telefone: string;
  latitude: number;
  longitude: number;
}

export interface Produto {
  id: string;
  nome: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
}

export interface Pedido {
  id: string;
  cliente_id: string;
  vendedor_id: string;
  entregador_id: string;
  data_pedido: string;
  valor_total: number;
  status: 'Pendente' | 'Em Rota' | 'Entregue' | 'Cancelado';
  forma_pagamento: 'Pix' | 'Dinheiro' | 'Cartão' | 'A Combinar';
  pago?: boolean;
}

export interface ItemPedido {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
}

export interface FluxoCaixa {
  id: string;
  tipo: 'entrada' | 'despesa';
  categoria: 'combustível' | 'manutenção' | 'embalagem' | 'energia' | 'pessoal' | 'venda_gelo' | 'outro';
  valor: number;
  data: string;
  descricao: string;
}

// Complete initialization SQL Script for Supabase SQL Editor
export const SUPABASE_SQL_SCRIPT = `-- ==========================================
-- SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS
-- OPERAÇÃO DE DISTRIBUIÇÃO DE GELO - RIO DAS OSTRAS, RJ
-- ==========================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA DE PERFIS (USUÁRIOS)
CREATE TABLE public.perfis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    telefone VARCHAR(20) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL, -- Senha armazenada de forma segura
    role VARCHAR(20) NOT NULL CHECK (role IN ('master', 'socio', 'vendedor', 'entregador')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS em perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- 3. TABELA DE INVESTIMENTOS DA FROTA
CREATE TABLE public.investimentos_frota (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    veiculo TEXT NOT NULL,
    valor NUMERIC(12,2) NOT NULL,
    proprietario VARCHAR(50) NOT NULL CHECK (proprietario IN ('Wagner', 'Mauro')),
    data_aquisicao DATE DEFAULT CURRENT_DATE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS em investimentos_frota
ALTER TABLE public.investimentos_frota ENABLE ROW LEVEL SECURITY;

-- 4. TABELA DE CLIENTES
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_estabelecimento TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('quiosque', 'bar', 'depósito', 'evento')),
    endereco TEXT NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS em clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- 5. TABELA DE PRODUTOS
CREATE TABLE public.produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    preco_custo NUMERIC(10,2) NOT NULL,
    preco_venda NUMERIC(10,2) NOT NULL,
    estoque_atual INTEGER NOT NULL DEFAULT 0 CHECK (estoque_atual >= 0),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS em produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- 6. TABELA DE PEDIDOS
CREATE TABLE public.pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE RESTRICT NOT NULL,
    vendedor_id UUID REFERENCES public.perfis(id) ON DELETE RESTRICT NOT NULL,
    entregador_id UUID REFERENCES public.perfis(id) ON DELETE RESTRICT,
    data_pedido TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    valor_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Rota', 'Entregue', 'Cancelado')),
    forma_pagamento VARCHAR(30) NOT NULL DEFAULT 'A Combinar' CHECK (forma_pagamento IN ('Pix', 'Dinheiro', 'Cartão', 'A Combinar')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS em pedidos
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- 7. TABELA DE ITENS DO PEDIDO
CREATE TABLE public.itens_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
    produto_id UUID REFERENCES public.produtos(id) ON DELETE RESTRICT NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10,2) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS em itens_pedido
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

-- 8. TABELA DE FLUXO DE CAIXA (FINANCEIRO)
CREATE TABLE public.fluxo_caixa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'despesa')),
    categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('combustível', 'manutenção', 'embalagem', 'energia', 'pessoal', 'venda_gelo', 'outro')),
    valor NUMERIC(12,2) NOT NULL,
    data DATE DEFAULT CURRENT_DATE NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS em fluxo_caixa
ALTER TABLE public.fluxo_caixa ENABLE ROW LEVEL SECURITY;


-- ===================================================
-- 9. REGRAS DE RLS E POLÍTICAS DE SEGURANÇA RÍGIDAS
-- ===================================================

-- Função auxiliar para obter a role do usuário logado baseado no auth.uid()
-- (Nota: Em produção, supomos que a tabela 'perfis' se integra com auth.users via chave estrangeira.
-- Para manter este script compatível, usamos a tabela perfis para buscar o perfil de quem está autenticado)

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS VARCHAR AS $$
BEGIN
    -- Busca a role correspondente ao UUID no contexto auth.jwt() do Supabase
    RETURN (SELECT role FROM public.perfis WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --- POLÍTICAS PARA: INVESTIMENTOS DA FROTA ---
-- Apenas master e socio podem ver e manipular
CREATE POLICY invest_select_master_socio ON public.investimentos_frota
    FOR SELECT TO authenticated
    USING (public.get_auth_user_role() IN ('master', 'socio'));

CREATE POLICY invest_all_master_socio ON public.investimentos_frota
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() IN ('master', 'socio'))
    WITH CHECK (public.get_auth_user_role() IN ('master', 'socio'));


-- --- POLÍTICAS PARA: FLUXO DE CAIXA ---
-- Apenas master e socio podem ver e gerenciar registros financeiros
CREATE POLICY caixa_select_master_socio ON public.fluxo_caixa
    FOR SELECT TO authenticated
    USING (public.get_auth_user_role() IN ('master', 'socio'));

CREATE POLICY caixa_all_master_socio ON public.fluxo_caixa
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() IN ('master', 'socio'))
    WITH CHECK (public.get_auth_user_role() IN ('master', 'socio'));


-- --- POLÍTICAS PARA: PRODUTOS ---
-- Todos os funcionários (master, socio, vendedor, entregador) podem ver produtos (vendedores e entregadores para vendas e estoques)
CREATE POLICY produtos_select_all ON public.produtos
    FOR SELECT TO authenticated
    USING (TRUE);

-- Apenas master e socio podem criar, atualizar ou deletar produtos
CREATE POLICY produtos_all_master_socio ON public.produtos
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() IN ('master', 'socio'))
    WITH CHECK (public.get_auth_user_role() IN ('master', 'socio'));


-- --- POLÍTICAS PARA: CLIENTES ---
-- Qualquer funcionário logado pode ver os clientes cadastrados em Rio das Ostras
CREATE POLICY clientes_select_all ON public.clientes
    FOR SELECT TO authenticated
    USING (TRUE);

-- Vendedores, sócios e master podem cadastrar/editar clientes
CREATE POLICY clientes_write_vendedor_socio_master ON public.clientes
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() IN ('master', 'socio', 'vendedor'))
    WITH CHECK (public.get_auth_user_role() IN ('master', 'socio', 'vendedor'));


-- --- POLÍTICAS PARA: PEDIDOS ---
-- Todos os perfis podem ler pedidos (entregadores apenas para verificar rotas/pedidos, vendedores para suas vendas, master/socio para financeiro)
CREATE POLICY pedidos_select_all ON public.pedidos
    FOR SELECT TO authenticated
    USING (TRUE);

-- Vendedores, sócios e master podem criar pedidos
CREATE POLICY pedidos_insert_vendedor_socio_master ON public.pedidos
    FOR INSERT TO authenticated
    WITH CHECK (public.get_auth_user_role() IN ('master', 'socio', 'vendedor'));

-- Entregadores podem atualizar o status dos pedidos
CREATE POLICY pedidos_update_status_entregador ON public.pedidos
    FOR UPDATE TO authenticated
    USING (public.get_auth_user_role() IN ('master', 'socio', 'vendedor', 'entregador'))
    WITH CHECK (public.get_auth_user_role() IN ('master', 'socio', 'vendedor', 'entregador'));


-- --- POLÍTICAS PARA: ITENS DO PEDIDO ---
CREATE POLICY itens_select_all ON public.itens_pedido
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY itens_write_authorized ON public.itens_pedido
    FOR ALL TO authenticated
    USING (public.get_auth_user_role() IN ('master', 'socio', 'vendedor'))
    WITH CHECK (public.get_auth_user_role() IN ('master', 'socio', 'vendedor'));


-- ===================================================
-- 10. INSERÇÃO DO USUÁRIO MASTER INICIAL (WAGNER)
-- ===================================================

-- Senha inicial: '05085' criptografada usando crypt() do pgcrypto para demonstração real
INSERT INTO public.perfis (id, nome, telefone, senha_hash, role)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- UUID Fixo para o Wagner
    'Wagner Teixeira',
    '21975151937',
    crypt('05085', gen_salt('bf')),
    'master'
) ON CONFLICT (telefone) DO NOTHING;

-- Inserindo alguns sócios e colaboradores de exemplo
INSERT INTO public.perfis (nome, telefone, senha_hash, role) VALUES
('Mauro Sócio', '21900001111', crypt('senha123', gen_salt('bf')), 'socio'),
('Marcos Sócio', '21900002222', crypt('senha123', gen_salt('bf')), 'socio'),
('Roberto Vendedor', '22999991111', crypt('vendas123', gen_salt('bf')), 'vendedor'),
('Carlos Entregador', '22999992222', crypt('entrega123', gen_salt('bf')), 'entregador')
ON CONFLICT (telefone) DO NOTHING;

-- Inserindo Frotas
INSERT INTO public.investimentos_frota (veiculo, valor, proprietario, data_aquisicao) VALUES
('Iveco Daily 2014', 150000.00, 'Wagner', '2024-01-15'),
('Iveco Daily 2009', 110000.00, 'Mauro', '2024-02-10'),
('Mercedes-Benz 1113 1989', 75000.00, 'Wagner', '2023-05-20'),
('Chevrolet Blazer 2009', 38000.00, 'Wagner', '2024-03-01'),
('Fiat Fiorino 2009', 32000.00, 'Mauro', '2024-04-12');

-- Inserindo Produtos Iniciais
INSERT INTO public.produtos (nome, preco_custo, preco_venda, estoque_atual) VALUES
('Gelo Cubo 5kg', 3.50, 8.00, 450),
('Gelo Triturado 10kg', 5.00, 12.00, 320),
('Gelo Barra 20kg', 8.00, 22.00, 150);

-- Inserindo Clientes Iniciais em Rio das Ostras
INSERT INTO public.clientes (nome_estabelecimento, tipo, endereco, telefone, latitude, longitude) VALUES
('Quiosque Costazul', 'quiosque', 'Av. Costazul, 450 - Costazul, Rio das Ostras - RJ', '22988880001', -22.527300, -41.931800),
('Depósito do Gugu', 'depósito', 'Rodovia Amaral Peixoto, 2100 - Centro, Rio das Ostras - RJ', '22988880002', -22.522200, -41.942300),
('Bar do Marujo', 'bar', 'Av. Governador Roberto Silveira, 12 - Costazul, Rio das Ostras - RJ', '22988880003', -22.529800, -41.934000),
('Quiosque do Sol', 'quiosque', 'Av. Amaral Peixoto, 1500 - Jardim Mariléa, Rio das Ostras - RJ', '22988880004', -22.513500, -41.956700);

-- Inserindo registros de fluxo de caixa de exemplo
INSERT INTO public.fluxo_caixa (tipo, categoria, valor, data, descricao) VALUES
('despesa', 'combustível', 350.00, CURRENT_DATE - 4, 'Diesel para Iveco 2014 Rota Costazul'),
('despesa', 'energia', 890.00, CURRENT_DATE - 3, 'Energia elétrica fábrica de gelo'),
('despesa', 'embalagem', 450.00, CURRENT_DATE - 2, 'Compra de sacos plásticos de 5kg'),
('entrada', 'venda_gelo', 2400.00, CURRENT_DATE - 2, 'Venda de carga fechada depósito'),
('entrada', 'venda_gelo', 1250.00, CURRENT_DATE - 1, 'Fechamento de faturamento vendedores quiosques'),
('despesa', 'manutenção', 180.00, CURRENT_DATE - 1, 'Troca de óleo Fiorino 2009');
`;

export const MOCK_PERFIS: Perfil[] = [
  { id: 'master-wagner', nome: 'Wagner Teixeira', telefone: '21975151937', role: 'master' },
  { id: 'socio-mauro', nome: 'Mauro', telefone: '22992360437', role: 'socio', senha: '12345' },
  { id: 'socio-marcos', nome: 'Marcos', telefone: '22996213001', role: 'socio', senha: '12345' },
  { id: 'vendedor-roberto', nome: 'Roberto Silva', telefone: '22999991111', role: 'vendedor', senha: 'vendas123' },
  { id: 'entregador-carlos', nome: 'Carlos Entregador', telefone: '22999992222', role: 'entregador', senha: 'entrega123' }
];

export const MOCK_INVESTIMENTOS: InvestimentoFrota[] = [
  { id: 'inv-1', veiculo: 'Iveco Daily 2014', valor: 150000, proprietario: 'Wagner', data_aquisicao: '2024-01-15' },
  { id: 'inv-2', veiculo: 'Iveco Daily 2009', valor: 110000, proprietario: 'Mauro', data_aquisicao: '2024-02-10' },
  { id: 'inv-3', veiculo: 'Mercedes-Benz 1113 1989', valor: 75000, proprietario: 'Wagner', data_aquisicao: '2023-05-20' },
  { id: 'inv-4', veiculo: 'Chevrolet Blazer 2009', valor: 38000, proprietario: 'Wagner', data_aquisicao: '2024-03-01' },
  { id: 'inv-5', veiculo: 'Fiat Fiorino 2009', valor: 32000, proprietario: 'Mauro', data_aquisicao: '2024-04-12' }
];

export const MOCK_CLIENTES: Cliente[] = [
  { id: 'cli-1', nome_estabelecimento: 'Quiosque Costazul', tipo: 'quiosque', endereco: 'Av. Costazul, 450 - Costazul, Rio das Ostras - RJ', telefone: '22988880001', latitude: -22.5273, longitude: -41.9318 },
  { id: 'cli-2', nome_estabelecimento: 'Depósito do Gugu', tipo: 'depósito', endereco: 'Rodovia Amaral Peixoto, 2100 - Centro, Rio das Ostras - RJ', telefone: '22988880002', latitude: -22.5222, longitude: -41.9423 },
  { id: 'cli-3', nome_estabelecimento: 'Bar do Marujo', tipo: 'bar', endereco: 'Av. Governador Roberto Silveira, 12 - Costazul, Rio das Ostras - RJ', telefone: '22988880003', latitude: -22.5298, longitude: -41.9340 },
  { id: 'cli-4', nome_estabelecimento: 'Quiosque do Sol', tipo: 'quiosque', endereco: 'Av. Amaral Peixoto, 1500 - Jardim Mariléa, Rio das Ostras - RJ', telefone: '22988880004', latitude: -22.5135, longitude: -41.9567 },
  { id: 'cli-5', nome_estabelecimento: 'Pizzaria Jardim Mariléa', tipo: 'bar', endereco: 'Rua Jane Maria Martins Figueira, 10 - Jardim Mariléa, Rio das Ostras - RJ', telefone: '22988880005', latitude: -22.5115, longitude: -41.9540 }
];

export const MOCK_PRODUTOS: Produto[] = [
  { id: 'prod-1', nome: 'Gelo Cubo 5kg', preco_custo: 3.50, preco_venda: 8.00, estoque_atual: 450 },
  { id: 'prod-2', nome: 'Gelo Triturado 10kg', preco_custo: 5.00, preco_venda: 12.00, estoque_atual: 320 },
  { id: 'prod-3', nome: 'Gelo Barra 20kg', preco_custo: 8.00, preco_venda: 22.00, estoque_atual: 150 }
];

export const MOCK_PEDIDOS: Pedido[] = [
  { id: 'ped-1', cliente_id: 'cli-1', vendedor_id: 'vendedor-roberto', entregador_id: 'entregador-carlos', data_pedido: '2026-07-08T10:00:00Z', valor_total: 160.00, status: 'Entregue', forma_pagamento: 'Pix', pago: true },
  { id: 'ped-2', cliente_id: 'cli-2', vendedor_id: 'vendedor-roberto', entregador_id: 'entregador-carlos', data_pedido: '2026-07-08T11:30:00Z', valor_total: 600.00, status: 'Entregue', forma_pagamento: 'Dinheiro', pago: true },
  { id: 'ped-3', cliente_id: 'cli-3', vendedor_id: 'vendedor-roberto', entregador_id: 'entregador-carlos', data_pedido: '2026-07-09T08:00:00Z', valor_total: 240.00, status: 'Pendente', forma_pagamento: 'Pix', pago: false },
  { id: 'ped-4', cliente_id: 'cli-4', vendedor_id: 'vendedor-roberto', entregador_id: 'entregador-carlos', data_pedido: '2026-07-09T08:30:00Z', valor_total: 400.00, status: 'Pendente', forma_pagamento: 'A Combinar', pago: false }
];

export const MOCK_ITENS_PEDIDO: ItemPedido[] = [
  { id: 'it-1', pedido_id: 'ped-1', produto_id: 'prod-1', quantidade: 20, preco_unitario: 8.00 }, // 160.00
  { id: 'it-2', pedido_id: 'ped-2', produto_id: 'prod-2', quantidade: 50, preco_unitario: 12.00 }, // 600.00
  { id: 'it-3', pedido_id: 'ped-3', produto_id: 'prod-1', quantidade: 30, preco_unitario: 8.00 }, // 240.00
  { id: 'it-4', pedido_id: 'ped-4', produto_id: 'prod-2', quantidade: 25, preco_unitario: 12.00 }, // 300.00
  { id: 'it-5', pedido_id: 'ped-4', produto_id: 'prod-1', quantidade: 10, preco_unitario: 10.00 }  // 100.00
];

export const MOCK_FLUXO_CAIXA: FluxoCaixa[] = [
  { id: 'caixa-1', tipo: 'despesa', categoria: 'combustível', valor: 350.00, data: '2026-07-05', descricao: 'Diesel S10 para Iveco Daily 2014 - Rota Costazul' },
  { id: 'caixa-2', tipo: 'despesa', categoria: 'energia', valor: 1250.00, data: '2026-07-06', descricao: 'Energia Elétrica Enel - Fábrica de Gelo Rio das Ostras' },
  { id: 'caixa-3', tipo: 'despesa', categoria: 'embalagem', valor: 450.00, data: '2026-07-07', descricao: 'Bobinas de sacos plásticos para gelo cubo 5kg' },
  { id: 'caixa-4', tipo: 'entrada', categoria: 'venda_gelo', valor: 2400.00, data: '2026-07-07', descricao: 'Venda de carga fechada depósito Centro' },
  { id: 'caixa-5', tipo: 'entrada', categoria: 'venda_gelo', valor: 1250.00, data: '2026-07-08', descricao: 'Faturamento de frotas vendedores quiosques praia' },
  { id: 'caixa-6', tipo: 'despesa', categoria: 'manutenção', valor: 180.00, data: '2026-07-08', descricao: 'Manutenção de correia e troca de óleo Fiorino' },
  { id: 'caixa-7', tipo: 'despesa', categoria: 'pessoal', valor: 1800.00, data: '2026-07-08', descricao: 'Adiantamento quinzenal faturistas e entregadores' }
];

export const normalizePhone = (phone: string): string => {
  let clean = phone.replace(/\D/g, '');
  // Remove leading zeros
  while (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  // Remove country code 55 if present in 12 or 13 digit numbers
  if (clean.length >= 12 && clean.startsWith('55')) {
    clean = clean.substring(2);
  }
  // Remove any leading zero again just in case (e.g. 022...)
  while (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  return clean;
};

export const formatPhoneForDisplay = (phone: string): string => {
  const clean = normalizePhone(phone);
  if (clean.length === 0) return '';
  if (clean.length <= 2) {
    return `(${clean}`;
  }
  if (clean.length <= 6) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
  }
  if (clean.length <= 10) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
  }
  return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7, 11)}`;
};
