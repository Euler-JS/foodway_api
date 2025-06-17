require('dotenv').config();
const bcrypt = require('bcrypt');
const { supabase } = require('../config/supabase');

/**
 * Script para configurar o banco de dados inicial
 * Executa as migrações e cria o usuário administrador inicial
 */

async function setupDatabase() {
  console.log('🚀 Iniciando configuração do banco de dados...\n');

  try {
    // 1. Verificar conexão com Supabase
    console.log('📡 Verificando conexão com Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('restaurants')
      .select('*')
      .limit(1);

    if (connectionError) {
      throw new Error(`Erro de conexão: ${connectionError.message}`);
    }
    console.log('✅ Conexão com Supabase estabelecida\n');

    // 2. Verificar se as tabelas de usuários já existem
    console.log('🔍 Verificando estrutura do banco...');
    const { data: usersCheck, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError && usersError.code === '42P01') {
      console.log('⚠️  Tabela de usuários não encontrada. Execute o SQL de criação primeiro.');
      console.log('\nPor favor, execute o seguinte SQL no seu Supabase:');
      console.log('```sql');
      console.log(getDatabaseCreationSQL());
      console.log('```\n');
      return;
    }

    if (usersError) {
      throw new Error(`Erro ao verificar tabelas: ${usersError.message}`);
    }
    console.log('✅ Estrutura do banco verificada\n');

    // 3. Verificar se já existe um super admin
    console.log('👤 Verificando usuários existentes...');
    const { data: existingAdmins, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'super_admin')
      .eq('is_active', true);

    if (adminError) {
      throw new Error(`Erro ao verificar admins: ${adminError.message}`);
    }

    if (existingAdmins && existingAdmins.length > 0) {
      console.log('✅ Super administrador já existe:');
      existingAdmins.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email})`);
      });
      console.log('\n🎉 Banco de dados já configurado!');
      return;
    }

    // 4. Criar super administrador inicial
    console.log('🔑 Criando super administrador inicial...');
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const { data: newAdmin, error: createError } = await supabase
      .from('users')
      .insert([{
        name: 'Super Administrador',
        email: process.env.ADMIN_EMAIL || 'admin@mannasoftware.com',
        password_hash: passwordHash,
        role: 'super_admin',
        restaurant_id: null,
        is_active: true,
        email_verified: true
      }])
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        console.log('ℹ️  Email do administrador já existe no sistema');
      } else {
        throw new Error(`Erro ao criar admin: ${createError.message}`);
      }
    } else {
      console.log('✅ Super administrador criado com sucesso!');
      console.log(`   - Nome: ${newAdmin.name}`);
      console.log(`   - Email: ${newAdmin.email}`);
      console.log(`   - Senha: ${adminPassword}`);
    }

    console.log('\n🎉 Configuração do banco de dados concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Acesse /admin para fazer login');
    console.log('2. Crie restaurantes e usuários para cada restaurante');
    console.log('3. Os usuários de restaurante poderão gerenciar categorias e produtos');

  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
    process.exit(1);
  }
}

function getDatabaseCreationSQL() {
  return `
-- =====================================================
-- SISTEMA DE USUÁRIOS E AUTENTICAÇÃO
-- =====================================================

-- 1. Tabela de Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    
    -- Dados básicos
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Role e permissões
    role VARCHAR(50) NOT NULL DEFAULT 'restaurant_user', 
    -- Valores: 'super_admin', 'restaurant_user'
    
    -- Relacionamento com restaurante (NULL para super_admin)
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    
    -- Dados de criação
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT check_super_admin_no_restaurant 
        CHECK (role != 'super_admin' OR restaurant_id IS NULL),
    CONSTRAINT check_restaurant_user_has_restaurant 
        CHECK (role != 'restaurant_user' OR restaurant_id IS NOT NULL)
);

-- 2. Tabela de Tokens de Autenticação
CREATE TABLE auth_tokens (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    
    -- Relacionamento
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Token data
    token_hash VARCHAR(255) NOT NULL,
    token_type VARCHAR(50) NOT NULL DEFAULT 'access', 
    -- Valores: 'access', 'refresh', 'reset_password', 'verify_email'
    
    -- Controle de validade
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    
    -- Metadados
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

-- 3. Tabela de Log de Atividades
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    
    -- Relacionamentos
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Ação
    action VARCHAR(100) NOT NULL, 
    entity_type VARCHAR(50), 
    entity_id INTEGER,
    
    -- Detalhes da ação
    details JSONB,
    
    -- Metadados
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Usuários
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Tokens
CREATE INDEX idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_token_type ON auth_tokens(token_type);
CREATE INDEX idx_auth_tokens_expires_at ON auth_tokens(expires_at);
CREATE INDEX idx_auth_tokens_is_revoked ON auth_tokens(is_revoked);

-- Activity logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_restaurant_id ON activity_logs(restaurant_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para usuários com informações do restaurante
CREATE VIEW users_with_restaurant AS
SELECT 
    u.id,
    u.uuid,
    u.name,
    u.email,
    u.role,
    u.is_active,
    u.email_verified,
    u.last_login,
    u.created_at,
    u.updated_at,
    r.id as restaurant_id,
    r.name as restaurant_name,
    r.city as restaurant_city,
    creator.name as created_by_name
FROM users u
LEFT JOIN restaurants r ON u.restaurant_id = r.id
LEFT JOIN users creator ON u.created_by = creator.id;

-- View para estatísticas de usuários
CREATE VIEW user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE role = 'super_admin') as super_admins,
    COUNT(*) FILTER (WHERE role = 'restaurant_user') as restaurant_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
    COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
    COUNT(*) FILTER (WHERE last_login > CURRENT_TIMESTAMP - INTERVAL '30 days') as active_last_30_days
FROM users;
`;
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase, getDatabaseCreationSQL };