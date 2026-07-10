-- ========================================================================================
-- RIO DAS OSTRAS - DISTRIBUIDORA DE GELO
-- Banco de Dados Relacional - Esquema SQL de Produção (PostgreSQL / MySQL)
-- ========================================================================================

-- Este arquivo contém a estrutura completa de tabelas necessárias para armazenar
-- todas as informações do aplicativo de Gestão de Gelo de forma persistente,
-- íntegra e relacional.

-- 1. Tabela de Perfis de Usuários (Sócios, Vendedores, Entregadores)
CREATE TABLE IF NOT EXISTS perfis (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('socio', 'vendedor', 'entregador')),
    senha VARCHAR(255) NOT NULL
);

-- 2. Tabela de Frota e Investimentos
CREATE TABLE IF NOT EXISTS investimentos (
    id VARCHAR(50) PRIMARY KEY,
    veiculo VARCHAR(100) NOT NULL,
    placa VARCHAR(15) NOT NULL UNIQUE,
    valor_investido DECIMAL(12, 2) NOT NULL,
    data_aquisicao DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Ativo', 'Manutenção', 'Vendido')),
    observacoes TEXT
);

-- 3. Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id VARCHAR(50) PRIMARY KEY,
    nome_estabelecimento VARCHAR(150) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Bar', 'Restaurante', 'Quiosque', 'Depósito', 'Pessoa Física', 'Outro'))
);

-- 4. Tabela de Catálogo de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    estoque_kg INT NOT NULL DEFAULT 0,
    descricao TEXT
);

-- 5. Tabela de Pedidos / Vendas
CREATE TABLE IF NOT EXISTS pedidos (
    id VARCHAR(50) PRIMARY KEY,
    cliente_id VARCHAR(50) NOT NULL,
    nome_estabelecimento VARCHAR(150) NOT NULL,
    data_pedido DATE NOT NULL,
    valor_total DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pendente', 'Em Rota', 'Entregue', 'Cancelado')),
    data_entrega DATE,
    motorista_id VARCHAR(50),
    endereco VARCHAR(255) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_motorista FOREIGN KEY (motorista_id) REFERENCES perfis(id) ON DELETE SET NULL
);

-- 6. Tabela de Itens do Pedido (Relação N:M entre Pedidos e Produtos)
CREATE TABLE IF NOT EXISTS itens_pedido (
    id VARCHAR(50) PRIMARY KEY,
    pedido_id VARCHAR(50) NOT NULL,
    produto_id VARCHAR(50) NOT NULL,
    nome_produto VARCHAR(100) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_item_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
);

-- 7. Tabela de Fluxo de Caixa (Lançamentos Financeiros)
CREATE TABLE IF NOT EXISTS fluxo_caixa (
    id VARCHAR(50) PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
    categoria VARCHAR(50) NOT NULL, -- 'Venda', 'Combustível', 'Manutenção', 'Salário', 'Outros'
    valor DECIMAL(12, 2) NOT NULL,
    data_registro DATE NOT NULL,
    descricao TEXT,
    pedido_id VARCHAR(50),
    CONSTRAINT fk_caixa_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL
);

-- 8. Tabela de Aportes de Sócios
CREATE TABLE IF NOT EXISTS aportes_socios (
    id VARCHAR(50) PRIMARY KEY,
    socio VARCHAR(50) NOT NULL CHECK (socio IN ('Mauro', 'Wagner', 'Marcos')),
    valor DECIMAL(12, 2) NOT NULL,
    porcentagem DECIMAL(5, 2) NOT NULL,
    data_aporte DATE NOT NULL,
    descricao TEXT
);

-- 9. Tabela de Divisão de Lucros das Quotas dos Sócios
CREATE TABLE IF NOT EXISTS socio_shares (
    socio VARCHAR(50) PRIMARY KEY,
    share_percentage DECIMAL(5, 2) NOT NULL
);

-- ========================================================================================
-- DADOS INICIAIS DE EXEMPLO (SEED DATA)
-- ========================================================================================

-- Inserir Perfis Padrões
INSERT INTO perfis (id, nome, telefone, role, senha) VALUES
('socio-mauro', 'Mauro', '22992360437', 'socio', '12345'),
('socio-wagner', 'Wagner Teixeira', '22999999999', 'socio', 'master123'),
('socio-marcos', 'Marcos', '22988888888', 'socio', '12345'),
('entregador-igor', 'Igor', '22977777777', 'entregador', '12345')
ON CONFLICT (id) DO NOTHING;

-- Inserir Divisão de Lucros Inicial
INSERT INTO socio_shares (socio, share_percentage) VALUES
('Mauro', 33.33),
('Wagner', 33.33),
('Marcos', 33.34)
ON CONFLICT (socio) DO NOTHING;

-- Inserir Frota Ativa
INSERT INTO investimentos (id, veiculo, placa, valor_investido, data_aquisicao, status, observacoes) VALUES
('inv-1', 'Iveco Daily 35-150 Baú Frigorífico', 'KXX-4J21', 185000.00, '2025-02-15', 'Ativo', 'Equipado com compressor de refrigeração Thermoking, ideal para rotas longas de atacado.'),
('inv-2', 'Fiorino Endurance 1.4 Refrigerada', 'LPT-9B32', 82000.00, '2025-05-10', 'Ativo', 'Isolamento de poliuretano de alta densidade para entregas ágeis de varejo.'),
('inv-3', 'Câmara Fria Industrial de Estocagem', 'CAM-001', 45000.00, '2025-03-01', 'Ativo', 'Capacidade para estocar até 12 toneladas de gelo ensacado a -18°C.')
ON CONFLICT (id) DO NOTHING;

-- Inserir Clientes Iniciais em Rio das Ostras
INSERT INTO clientes (id, nome_estabelecimento, telefone, endereco, bairro, tipo) VALUES
('cl-1', 'Quiosque do Sol', '22999112233', 'Av. Costazul, 450', 'Costazul', 'Quiosque'),
('cl-2', 'Bar do Marujo', '22999445566', 'Rua Búzios, 12', 'Costazul', 'Bar'),
('cl-3', 'Depósito do Gugu', '22999778899', 'Rua Bento Costa, 102', 'Centro', 'Depósito'),
('cl-4', 'Restaurante Sabor das Ondas', '22998112233', 'Av. Roberto Silveira, 222', 'Jardim Mariléa', 'Restaurante')
ON CONFLICT (id) DO NOTHING;

-- Inserir Catálogo de Gelo
INSERT INTO produtos (id, nome, preco_unitario, estoque_kg, descricao) VALUES
('prod-1', 'Gelo Cubo (Pacote 5kg)', 8.50, 1200, 'Gelo em cubo de água filtrada cristalina, alta durabilidade.'),
('prod-2', 'Gelo Cubo (Pacote 10kg)', 15.00, 850, 'Pacote econômico para comércios, bares e restaurantes.'),
('prod-3', 'Gelo Triturado (Pacote 10kg)', 12.00, 600, 'Gelo ideal para conservação de pescados e cocktails rápidos.'),
('prod-4', 'Gelo em Barra (Unidade 20kg)', 18.00, 300, 'Barra inteira para resfriamento de longa duração.')
ON CONFLICT (id) DO NOTHING;

-- Inserir Aportes de Exemplo
INSERT INTO aportes_socios (id, socio, valor, porcentagem, data_aporte, descricao) VALUES
('ap-1', 'Mauro', 4000.00, 10.00, '2026-07-02', 'Aporte de 10% dos lucros previstos'),
('ap-2', 'Wagner', 6000.00, 15.00, '2026-07-03', 'Aporte de 15% dos lucros previstos'),
('ap-3', 'Marcos', 8000.00, 20.00, '2026-07-05', 'Aporte complementar de 20% dos lucros'),
('ap-4', 'Mauro', 5000.00, 12.50, '2026-06-15', 'Aporte mensal de lucros de Junho'),
('ap-5', 'Wagner', 4000.00, 10.00, '2026-06-18', 'Aporte complementar Junho')
ON CONFLICT (id) DO NOTHING;
