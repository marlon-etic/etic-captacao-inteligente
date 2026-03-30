// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      api_error_logs: {
        Row: {
          api_name: string
          created_at: string | null
          endpoint: string | null
          error_message: string
          id: string
          payload: Json | null
        }
        Insert: {
          api_name: string
          created_at?: string | null
          endpoint?: string | null
          error_message: string
          id?: string
          payload?: Json | null
        }
        Update: {
          api_name?: string
          created_at?: string | null
          endpoint?: string | null
          error_message?: string
          id?: string
          payload?: Json | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          acao: string
          created_at: string | null
          dados_antigos: Json | null
          dados_novos: Json | null
          id: string
          registro_id: string
          tabela: string
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string | null
          dados_antigos?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id: string
          tabela: string
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string | null
          dados_antigos?: Json | null
          dados_novos?: Json | null
          id?: string
          registro_id?: string
          tabela?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_locacao: {
        Row: {
          bairros: string[] | null
          banheiros: number | null
          cliente_nome: string | null
          created_at: string | null
          dormitorios: number | null
          email: string | null
          grupo_id: string | null
          id: string
          is_prioritaria: boolean | null
          localizacoes: string[] | null
          nivel_urgencia: string | null
          nome_cliente: string | null
          observacoes: string | null
          orcamento_max: number | null
          quartos: number | null
          renda_mensal_estimada: number | null
          sdr_id: string | null
          status_demanda: string | null
          telefone: string | null
          tenant_score: number | null
          tipo_demanda: string | null
          updated_at: string | null
          urgencia: string | null
          vagas: number | null
          vagas_estacionamento: number | null
          valor_maximo: number | null
          valor_minimo: number | null
        }
        Insert: {
          bairros?: string[] | null
          banheiros?: number | null
          cliente_nome?: string | null
          created_at?: string | null
          dormitorios?: number | null
          email?: string | null
          grupo_id?: string | null
          id?: string
          is_prioritaria?: boolean | null
          localizacoes?: string[] | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          observacoes?: string | null
          orcamento_max?: number | null
          quartos?: number | null
          renda_mensal_estimada?: number | null
          sdr_id?: string | null
          status_demanda?: string | null
          telefone?: string | null
          tenant_score?: number | null
          tipo_demanda?: string | null
          updated_at?: string | null
          urgencia?: string | null
          vagas?: number | null
          vagas_estacionamento?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Update: {
          bairros?: string[] | null
          banheiros?: number | null
          cliente_nome?: string | null
          created_at?: string | null
          dormitorios?: number | null
          email?: string | null
          grupo_id?: string | null
          id?: string
          is_prioritaria?: boolean | null
          localizacoes?: string[] | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          observacoes?: string | null
          orcamento_max?: number | null
          quartos?: number | null
          renda_mensal_estimada?: number | null
          sdr_id?: string | null
          status_demanda?: string | null
          telefone?: string | null
          tenant_score?: number | null
          tipo_demanda?: string | null
          updated_at?: string | null
          urgencia?: string | null
          vagas?: number | null
          vagas_estacionamento?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demandas_locacao_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_demandas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_locacao_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_demandas_locacao_sdr"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_vendas: {
        Row: {
          bairros: string[] | null
          banheiros: number | null
          cliente_nome: string | null
          corretor_id: string | null
          created_at: string | null
          dormitorios: number | null
          email: string | null
          grupo_id: string | null
          id: string
          is_prioritaria: boolean | null
          localizacoes: string[] | null
          necessidades_especificas: string | null
          nivel_urgencia: string | null
          nome_cliente: string | null
          orcamento_max: number | null
          quartos: number | null
          status_demanda: string | null
          telefone: string | null
          tipo_imovel: string | null
          updated_at: string | null
          urgencia: string | null
          vagas: number | null
          vagas_estacionamento: number | null
          valor_maximo: number | null
          valor_minimo: number | null
        }
        Insert: {
          bairros?: string[] | null
          banheiros?: number | null
          cliente_nome?: string | null
          corretor_id?: string | null
          created_at?: string | null
          dormitorios?: number | null
          email?: string | null
          grupo_id?: string | null
          id?: string
          is_prioritaria?: boolean | null
          localizacoes?: string[] | null
          necessidades_especificas?: string | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          orcamento_max?: number | null
          quartos?: number | null
          status_demanda?: string | null
          telefone?: string | null
          tipo_imovel?: string | null
          updated_at?: string | null
          urgencia?: string | null
          vagas?: number | null
          vagas_estacionamento?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Update: {
          bairros?: string[] | null
          banheiros?: number | null
          cliente_nome?: string | null
          corretor_id?: string | null
          created_at?: string | null
          dormitorios?: number | null
          email?: string | null
          grupo_id?: string | null
          id?: string
          is_prioritaria?: boolean | null
          localizacoes?: string[] | null
          necessidades_especificas?: string | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          orcamento_max?: number | null
          quartos?: number | null
          status_demanda?: string | null
          telefone?: string | null
          tipo_imovel?: string | null
          updated_at?: string | null
          urgencia?: string | null
          vagas?: number | null
          vagas_estacionamento?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demandas_vendas_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_vendas_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_demandas"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_demandas: {
        Row: {
          bairro: string
          count_demandas: number | null
          created_at: string | null
          dormitorios: number | null
          id: string
          num_quartos: number | null
          num_vagas: number | null
          preco_maximo_group: number | null
          preco_minimo_group: number | null
          status: string | null
          tier: string | null
          tipo: string | null
          tipologia: string | null
          total_demandas_ativas: number | null
          updated_at: string | null
          vagas: number | null
          valor_aluguel: number | null
        }
        Insert: {
          bairro: string
          count_demandas?: number | null
          created_at?: string | null
          dormitorios?: number | null
          id?: string
          num_quartos?: number | null
          num_vagas?: number | null
          preco_maximo_group?: number | null
          preco_minimo_group?: number | null
          status?: string | null
          tier?: string | null
          tipo?: string | null
          tipologia?: string | null
          total_demandas_ativas?: number | null
          updated_at?: string | null
          vagas?: number | null
          valor_aluguel?: number | null
        }
        Update: {
          bairro?: string
          count_demandas?: number | null
          created_at?: string | null
          dormitorios?: number | null
          id?: string
          num_quartos?: number | null
          num_vagas?: number | null
          preco_maximo_group?: number | null
          preco_minimo_group?: number | null
          status?: string | null
          tier?: string | null
          tipo?: string | null
          tipologia?: string | null
          total_demandas_ativas?: number | null
          updated_at?: string | null
          vagas?: number | null
          valor_aluguel?: number | null
        }
        Relationships: []
      }
      imoveis_captados: {
        Row: {
          captador_id: string | null
          codigo_imovel: string | null
          comissao_percentual: number | null
          created_at: string | null
          data_fechamento: string | null
          data_visita: string | null
          demanda_locacao_id: string | null
          demanda_venda_id: string | null
          dormitorios: number | null
          endereco: string | null
          etapa_funil: string | null
          fotos: string[] | null
          id: string
          landlord_id: string | null
          localizacao_texto: string | null
          observacoes: string | null
          preco: number | null
          status_captacao: string | null
          tipo: string | null
          updated_at: string | null
          user_captador_id: string | null
          vagas: number | null
          valor: number | null
        }
        Insert: {
          captador_id?: string | null
          codigo_imovel?: string | null
          comissao_percentual?: number | null
          created_at?: string | null
          data_fechamento?: string | null
          data_visita?: string | null
          demanda_locacao_id?: string | null
          demanda_venda_id?: string | null
          dormitorios?: number | null
          endereco?: string | null
          etapa_funil?: string | null
          fotos?: string[] | null
          id?: string
          landlord_id?: string | null
          localizacao_texto?: string | null
          observacoes?: string | null
          preco?: number | null
          status_captacao?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_captador_id?: string | null
          vagas?: number | null
          valor?: number | null
        }
        Update: {
          captador_id?: string | null
          codigo_imovel?: string | null
          comissao_percentual?: number | null
          created_at?: string | null
          data_fechamento?: string | null
          data_visita?: string | null
          demanda_locacao_id?: string | null
          demanda_venda_id?: string | null
          dormitorios?: number | null
          endereco?: string | null
          etapa_funil?: string | null
          fotos?: string[] | null
          id?: string
          landlord_id?: string | null
          localizacao_texto?: string | null
          observacoes?: string | null
          preco?: number | null
          status_captacao?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_captador_id?: string | null
          vagas?: number | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_imoveis_captador"
            columns: ["user_captador_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_captados_demanda_locacao_id_fkey"
            columns: ["demanda_locacao_id"]
            isOneToOne: false
            referencedRelation: "demandas_locacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_captados_demanda_venda_id_fkey"
            columns: ["demanda_venda_id"]
            isOneToOne: false
            referencedRelation: "demandas_vendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_captados_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "landlord_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_captados_user_captador_id_fkey"
            columns: ["user_captador_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      landlord_profiles: {
        Row: {
          codigo_locador: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          property_codes: Json | null
          total_imoveis: number | null
          total_revenue: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          codigo_locador?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          property_codes?: Json | null
          total_imoveis?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          codigo_locador?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          property_codes?: Json | null
          total_imoveis?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          created_at: string | null
          dados_relacionados: Json | null
          id: string
          lido: boolean | null
          mensagem: string
          prioridade:
            | Database["public"]["Enums"]["notificacao_prioridade"]
            | null
          tipo: Database["public"]["Enums"]["notificacao_tipo"]
          titulo: string
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          dados_relacionados?: Json | null
          id?: string
          lido?: boolean | null
          mensagem: string
          prioridade?:
            | Database["public"]["Enums"]["notificacao_prioridade"]
            | null
          tipo: Database["public"]["Enums"]["notificacao_tipo"]
          titulo: string
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          dados_relacionados?: Json | null
          id?: string
          lido?: boolean | null
          mensagem?: string
          prioridade?:
            | Database["public"]["Enums"]["notificacao_prioridade"]
            | null
          tipo?: Database["public"]["Enums"]["notificacao_tipo"]
          titulo?: string
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pontuacao_captador: {
        Row: {
          captador_id: string
          created_at: string | null
          demanda_locacao_id: string | null
          demanda_venda_id: string | null
          id: string
          pontos: number
          tipo_pontuacao: string
        }
        Insert: {
          captador_id: string
          created_at?: string | null
          demanda_locacao_id?: string | null
          demanda_venda_id?: string | null
          id?: string
          pontos: number
          tipo_pontuacao: string
        }
        Update: {
          captador_id?: string
          created_at?: string | null
          demanda_locacao_id?: string | null
          demanda_venda_id?: string | null
          id?: string
          pontos?: number
          tipo_pontuacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontuacao_captador_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontuacao_captador_demanda_locacao_id_fkey"
            columns: ["demanda_locacao_id"]
            isOneToOne: false
            referencedRelation: "demandas_locacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontuacao_captador_demanda_venda_id_fkey"
            columns: ["demanda_venda_id"]
            isOneToOne: false
            referencedRelation: "demandas_vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      prazos_captacao: {
        Row: {
          captador_id: string | null
          data_criacao: string | null
          demanda_locacao_id: string | null
          demanda_venda_id: string | null
          id: string
          prazo_resposta: string
          prorrogacoes_usadas: number | null
          status: string | null
        }
        Insert: {
          captador_id?: string | null
          data_criacao?: string | null
          demanda_locacao_id?: string | null
          demanda_venda_id?: string | null
          id?: string
          prazo_resposta: string
          prorrogacoes_usadas?: number | null
          status?: string | null
        }
        Update: {
          captador_id?: string | null
          data_criacao?: string | null
          demanda_locacao_id?: string | null
          demanda_venda_id?: string | null
          id?: string
          prazo_resposta?: string
          prorrogacoes_usadas?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prazos_captacao_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prazos_captacao_demanda_locacao_id_fkey"
            columns: ["demanda_locacao_id"]
            isOneToOne: false
            referencedRelation: "demandas_locacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prazos_captacao_demanda_venda_id_fkey"
            columns: ["demanda_venda_id"]
            isOneToOne: false
            referencedRelation: "demandas_vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      property_performance: {
        Row: {
          average_tenant_score: number | null
          created_at: string | null
          maintenance_costs: number | null
          months_occupied: number | null
          net_revenue: number | null
          property_id: string
          total_revenue: number | null
          updated_at: string | null
          vacancy_rate: number | null
        }
        Insert: {
          average_tenant_score?: number | null
          created_at?: string | null
          maintenance_costs?: number | null
          months_occupied?: number | null
          net_revenue?: number | null
          property_id: string
          total_revenue?: number | null
          updated_at?: string | null
          vacancy_rate?: number | null
        }
        Update: {
          average_tenant_score?: number | null
          created_at?: string | null
          maintenance_costs?: number | null
          months_occupied?: number | null
          net_revenue?: number | null
          property_id?: string
          total_revenue?: number | null
          updated_at?: string | null
          vacancy_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_performance_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "imoveis_captados"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_logs: {
        Row: {
          channel_name: string | null
          error_message: string | null
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          channel_name?: string | null
          error_message?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          channel_name?: string | null
          error_message?: string | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      respostas_captador: {
        Row: {
          captador_id: string
          created_at: string | null
          demanda_locacao_id: string | null
          demanda_venda_id: string | null
          id: string
          motivo: string | null
          observacao: string | null
          resposta: string
          updated_at: string | null
        }
        Insert: {
          captador_id: string
          created_at?: string | null
          demanda_locacao_id?: string | null
          demanda_venda_id?: string | null
          id?: string
          motivo?: string | null
          observacao?: string | null
          resposta: string
          updated_at?: string | null
        }
        Update: {
          captador_id?: string
          created_at?: string | null
          demanda_locacao_id?: string | null
          demanda_venda_id?: string | null
          id?: string
          motivo?: string | null
          observacao?: string | null
          resposta?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respostas_captador_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_captador_demanda_locacao_id_fkey"
            columns: ["demanda_locacao_id"]
            isOneToOne: false
            referencedRelation: "demandas_locacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_captador_demanda_venda_id_fkey"
            columns: ["demanda_venda_id"]
            isOneToOne: false
            referencedRelation: "demandas_vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_proposals: {
        Row: {
          created_at: string | null
          employment_status: string | null
          id: string
          message: string | null
          monthly_income: number | null
          property_id: string
          proposed_move_date: string | null
          response_date: string | null
          response_message: string | null
          status: string | null
          tenant_email: string
          tenant_id: string | null
          tenant_name: string
          tenant_phone: string
          tenant_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employment_status?: string | null
          id?: string
          message?: string | null
          monthly_income?: number | null
          property_id: string
          proposed_move_date?: string | null
          response_date?: string | null
          response_message?: string | null
          status?: string | null
          tenant_email: string
          tenant_id?: string | null
          tenant_name: string
          tenant_phone: string
          tenant_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employment_status?: string | null
          id?: string
          message?: string | null
          monthly_income?: number | null
          property_id?: string
          proposed_move_date?: string | null
          response_date?: string | null
          response_message?: string | null
          status?: string | null
          tenant_email?: string
          tenant_id?: string | null
          tenant_name?: string
          tenant_phone?: string
          tenant_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_proposals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "imoveis_captados"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bairros_trabalho: string[] | null
          created_at: string | null
          email: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bairros_trabalho?: string[] | null
          created_at?: string | null
          email: string
          id: string
          nome: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bairros_trabalho?: string[] | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vistasoft_cache: {
        Row: {
          created_at: string | null
          data: Json
          expires_at: string
          key: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          expires_at: string
          key: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          expires_at?: string
          key?: string
        }
        Relationships: []
      }
      webhook_queue: {
        Row: {
          created_at: string | null
          entity_id: string | null
          event_type: string
          id: string
          last_error: string | null
          max_retries: number | null
          payload: Json
          processed_at: string | null
          retry_count: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          event_type: string
          id?: string
          last_error?: string | null
          max_retries?: number | null
          payload: Json
          processed_at?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          event_type?: string
          id?: string
          last_error?: string | null
          max_retries?: number | null
          payload?: Json
          processed_at?: string | null
          retry_count?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_dashboard_summary: {
        Row: {
          captadores_ativos: number | null
          demandas_abertas: number | null
          id: number | null
          imoveis_ativos: number | null
          last_updated: string | null
          total_pontos: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      atualizar_prazos_vencidos: { Args: never; Returns: undefined }
      fn_auto_fix_test_users: { Args: never; Returns: Json }
      fn_calcular_tenant_score: {
        Args: { p_renda_mensal: number; p_valor_aluguel: number }
        Returns: number
      }
      fn_clean_expired_cache: { Args: never; Returns: undefined }
      fn_diagnose_and_fix_auth: {
        Args: {
          p_email: string
          p_name: string
          p_password: string
          p_role: string
        }
        Returns: Json
      }
      fn_diagnose_oauth_setup: { Args: never; Returns: Json }
      fn_hard_reset_imoveis: { Args: never; Returns: undefined }
      fn_logar_falhas_api: {
        Args: {
          p_api: string
          p_endpoint: string
          p_message: string
          p_payload?: Json
        }
        Returns: undefined
      }
      fn_processar_webhook_queue: {
        Args: never
        Returns: {
          event_type: string
          id: string
          payload: Json
          status: string
        }[]
      }
      fn_reset_database: { Args: { p_delete_before?: string }; Returns: Json }
      log_realtime_error: {
        Args: {
          p_channel_name: string
          p_error_message: string
          p_user_id?: string
        }
        Returns: undefined
      }
      refresh_admin_dashboard_summary: { Args: never; Returns: undefined }
    }
    Enums: {
      notificacao_prioridade: "alta" | "normal" | "baixa"
      notificacao_tipo:
        | "nova_demanda"
        | "novo_imovel"
        | "imovel_capturado"
        | "status_atualizado"
      user_role: "admin" | "sdr" | "corretor" | "captador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      notificacao_prioridade: ["alta", "normal", "baixa"],
      notificacao_tipo: [
        "nova_demanda",
        "novo_imovel",
        "imovel_capturado",
        "status_atualizado",
      ],
      user_role: ["admin", "sdr", "corretor", "captador"],
    },
  },
} as const


// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: api_error_logs
//   id: uuid (not null, default: gen_random_uuid())
//   api_name: text (not null)
//   endpoint: text (nullable)
//   error_message: text (not null)
//   payload: jsonb (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: audit_log
//   id: uuid (not null, default: gen_random_uuid())
//   usuario_id: uuid (nullable)
//   acao: character varying (not null)
//   tabela: character varying (not null)
//   registro_id: uuid (not null)
//   dados_antigos: jsonb (nullable)
//   dados_novos: jsonb (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: demandas_locacao
//   id: uuid (not null, default: gen_random_uuid())
//   cliente_nome: character varying (nullable)
//   localizacoes: _text (nullable, default: '{}'::text[])
//   orcamento_max: numeric (nullable, default: 0)
//   quartos: integer (nullable, default: 0)
//   banheiros: integer (nullable, default: 0)
//   vagas: integer (nullable, default: 0)
//   urgencia: character varying (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   sdr_id: uuid (nullable)
//   nome_cliente: character varying (nullable)
//   telefone: character varying (nullable)
//   email: character varying (nullable)
//   bairros: _text (nullable, default: '{}'::text[])
//   valor_minimo: numeric (nullable, default: 0)
//   valor_maximo: numeric (nullable, default: 0)
//   dormitorios: integer (nullable)
//   vagas_estacionamento: integer (nullable)
//   nivel_urgencia: character varying (nullable)
//   status_demanda: character varying (nullable)
//   observacoes: text (nullable)
//   tipo_demanda: character varying (nullable, default: 'Aluguel'::character varying)
//   is_prioritaria: boolean (nullable, default: false)
//   grupo_id: uuid (nullable)
//   renda_mensal_estimada: numeric (nullable, default: 0)
//   tenant_score: integer (nullable, default: 0)
// Table: demandas_vendas
//   id: uuid (not null, default: gen_random_uuid())
//   cliente_nome: character varying (nullable)
//   localizacoes: _text (nullable, default: '{}'::text[])
//   orcamento_max: numeric (nullable, default: 0)
//   quartos: integer (nullable, default: 0)
//   banheiros: integer (nullable, default: 0)
//   vagas: integer (nullable, default: 0)
//   urgencia: character varying (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   corretor_id: uuid (nullable)
//   tipo_imovel: character varying (nullable)
//   nome_cliente: character varying (nullable)
//   telefone: character varying (nullable)
//   email: character varying (nullable)
//   bairros: _text (nullable, default: '{}'::text[])
//   valor_minimo: numeric (nullable, default: 0)
//   valor_maximo: numeric (nullable, default: 0)
//   dormitorios: integer (nullable)
//   vagas_estacionamento: integer (nullable)
//   nivel_urgencia: character varying (nullable)
//   status_demanda: character varying (nullable)
//   necessidades_especificas: text (nullable)
//   is_prioritaria: boolean (nullable, default: false)
//   grupo_id: uuid (nullable)
// Table: grupos_demandas
//   id: uuid (not null, default: gen_random_uuid())
//   bairro: text (not null)
//   tipologia: text (nullable, default: 'Padrão'::text)
//   valor_aluguel: numeric (nullable, default: 0)
//   num_quartos: integer (nullable, default: 0)
//   num_vagas: integer (nullable, default: 0)
//   count_demandas: integer (nullable, default: 1)
//   tier: text (nullable)
//   preco_minimo_group: numeric (nullable, default: 0)
//   preco_maximo_group: numeric (nullable, default: 0)
//   dormitorios: integer (nullable, default: 0)
//   vagas: integer (nullable, default: 0)
//   tipo: character varying (nullable, default: 'locacao'::character varying)
//   total_demandas_ativas: integer (nullable, default: 0)
//   status: character varying (nullable, default: 'ativo'::character varying)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: imoveis_captados
//   id: uuid (not null, default: gen_random_uuid())
//   captador_id: uuid (nullable)
//   endereco: text (nullable)
//   valor: numeric (nullable)
//   demanda_locacao_id: uuid (nullable)
//   demanda_venda_id: uuid (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   user_captador_id: uuid (nullable)
//   codigo_imovel: character varying (nullable)
//   localizacao_texto: text (nullable)
//   preco: numeric (nullable)
//   fotos: _text (nullable, default: '{}'::text[])
//   comissao_percentual: numeric (nullable)
//   status_captacao: character varying (nullable)
//   etapa_funil: character varying (nullable, default: 'capturado'::character varying)
//   data_visita: timestamp with time zone (nullable)
//   data_fechamento: timestamp with time zone (nullable)
//   dormitorios: integer (nullable)
//   vagas: integer (nullable)
//   observacoes: text (nullable)
//   landlord_id: uuid (nullable)
//   tipo: text (nullable, default: 'Ambos'::text)
// Table: landlord_profiles
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   name: text (not null)
//   email: text (not null)
//   phone: text (nullable)
//   codigo_locador: text (nullable)
//   property_codes: jsonb (nullable, default: '[]'::jsonb)
//   total_imoveis: integer (nullable, default: 0)
//   total_revenue: numeric (nullable, default: 0)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: notificacoes
//   id: uuid (not null, default: gen_random_uuid())
//   usuario_id: uuid (not null)
//   tipo: notificacao_tipo (not null)
//   titulo: text (not null)
//   mensagem: text (not null)
//   dados_relacionados: jsonb (nullable)
//   lido: boolean (nullable, default: false)
//   prioridade: notificacao_prioridade (nullable, default: 'normal'::notificacao_prioridade)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: pontuacao_captador
//   id: uuid (not null, default: gen_random_uuid())
//   captador_id: uuid (not null)
//   demanda_locacao_id: uuid (nullable)
//   demanda_venda_id: uuid (nullable)
//   tipo_pontuacao: text (not null)
//   pontos: integer (not null)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: prazos_captacao
//   id: uuid (not null, default: gen_random_uuid())
//   demanda_locacao_id: uuid (nullable)
//   demanda_venda_id: uuid (nullable)
//   captador_id: uuid (nullable)
//   data_criacao: timestamp with time zone (nullable, default: now())
//   prazo_resposta: timestamp with time zone (not null)
//   prorrogacoes_usadas: integer (nullable, default: 0)
//   status: character varying (nullable, default: 'ativo'::character varying)
// Table: property_performance
//   property_id: uuid (not null)
//   total_revenue: numeric (nullable, default: 0)
//   months_occupied: integer (nullable, default: 0)
//   vacancy_rate: numeric (nullable, default: 0)
//   average_tenant_score: integer (nullable, default: 0)
//   maintenance_costs: numeric (nullable, default: 0)
//   net_revenue: numeric (nullable, default: 0)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: realtime_logs
//   id: uuid (not null, default: gen_random_uuid())
//   channel_name: text (nullable)
//   error_message: text (nullable)
//   user_id: uuid (nullable)
//   timestamp: timestamp with time zone (nullable, default: now())
// Table: respostas_captador
//   id: uuid (not null, default: gen_random_uuid())
//   demanda_locacao_id: uuid (nullable)
//   demanda_venda_id: uuid (nullable)
//   captador_id: uuid (not null)
//   resposta: character varying (not null)
//   motivo: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   observacao: text (nullable)
// Table: tenant_proposals
//   id: uuid (not null, default: gen_random_uuid())
//   property_id: uuid (not null)
//   tenant_id: uuid (nullable)
//   tenant_name: text (not null)
//   tenant_email: text (not null)
//   tenant_phone: text (not null)
//   tenant_score: integer (nullable, default: 0)
//   monthly_income: numeric (nullable, default: 0)
//   employment_status: text (nullable)
//   proposed_move_date: date (nullable)
//   message: text (nullable)
//   status: text (nullable, default: 'pending'::text)
//   response_date: timestamp with time zone (nullable)
//   response_message: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: users
//   id: uuid (not null)
//   email: character varying (not null)
//   nome: character varying (not null)
//   role: user_role (not null, default: 'captador'::user_role)
//   bairros_trabalho: _text (nullable, default: '{}'::text[])
//   status: character varying (nullable, default: 'ativo'::character varying)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: vistasoft_cache
//   key: text (not null)
//   data: jsonb (not null)
//   expires_at: timestamp with time zone (not null)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: webhook_queue
//   id: uuid (not null, default: gen_random_uuid())
//   event_type: text (not null)
//   entity_id: uuid (nullable)
//   payload: jsonb (not null)
//   status: text (nullable, default: 'pending'::text)
//   retry_count: integer (nullable, default: 0)
//   max_retries: integer (nullable, default: 3)
//   last_error: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   processed_at: timestamp with time zone (nullable)

// --- CONSTRAINTS ---
// Table: api_error_logs
//   PRIMARY KEY api_error_logs_pkey: PRIMARY KEY (id)
// Table: audit_log
//   PRIMARY KEY audit_log_pkey: PRIMARY KEY (id)
//   FOREIGN KEY audit_log_usuario_id_fkey: FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
// Table: demandas_locacao
//   CHECK check_valor_min_max_locacao: CHECK ((valor_maximo >= valor_minimo))
//   CHECK chk_demandas_locacao_renda: CHECK ((renda_mensal_estimada >= (0)::numeric))
//   CHECK demandas_locacao_dormitorios_check: CHECK (((dormitorios >= 0) AND (dormitorios <= 10)))
//   CHECK demandas_locacao_email_check: CHECK (((email IS NULL) OR ((email)::text = ''::text) OR ((email)::text ~~ '%@%'::text)))
//   FOREIGN KEY demandas_locacao_grupo_id_fkey: FOREIGN KEY (grupo_id) REFERENCES grupos_demandas(id) ON DELETE SET NULL
//   CHECK demandas_locacao_nivel_urgencia_check: CHECK (((nivel_urgencia)::text = ANY ((ARRAY['Baixa'::character varying, 'Média'::character varying, 'Alta'::character varying, 'Urgente'::character varying, 'Até 15 dias'::character varying, 'Até 30 dias'::character varying, 'Até 90 dias ou +'::character varying])::text[])))
//   PRIMARY KEY demandas_locacao_pkey: PRIMARY KEY (id)
//   FOREIGN KEY demandas_locacao_sdr_id_fkey: FOREIGN KEY (sdr_id) REFERENCES users(id) ON DELETE SET NULL
//   CHECK demandas_locacao_status_demanda_check: CHECK (((status_demanda)::text = ANY ((ARRAY['aberta'::character varying, 'atendida'::character varying, 'impossivel'::character varying, 'sem_resposta_24h'::character varying, 'ganho'::character varying])::text[])))
//   CHECK demandas_locacao_telefone_check: CHECK (((telefone IS NULL) OR (((telefone)::text ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}'::text) AND (length((telefone)::text) = 15))))
//   CHECK demandas_locacao_vagas_estacionamento_check: CHECK (((vagas_estacionamento >= 0) AND (vagas_estacionamento <= 10)))
//   FOREIGN KEY fk_demandas_locacao_sdr: FOREIGN KEY (sdr_id) REFERENCES users(id) ON DELETE SET NULL
// Table: demandas_vendas
//   CHECK check_valor_min_max_vendas: CHECK ((valor_maximo >= valor_minimo))
//   FOREIGN KEY demandas_vendas_corretor_id_fkey: FOREIGN KEY (corretor_id) REFERENCES users(id) ON DELETE SET NULL
//   CHECK demandas_vendas_dormitorios_check: CHECK (((dormitorios >= 0) AND (dormitorios <= 10)))
//   CHECK demandas_vendas_email_check: CHECK (((email)::text ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+
::text))
//   FOREIGN KEY demandas_vendas_grupo_id_fkey: FOREIGN KEY (grupo_id) REFERENCES grupos_demandas(id) ON DELETE SET NULL
//   CHECK demandas_vendas_nivel_urgencia_check: CHECK (((nivel_urgencia)::text = ANY ((ARRAY['Baixa'::character varying, 'Média'::character varying, 'Alta'::character varying, 'Urgente'::character varying, 'Até 15 dias'::character varying, 'Até 30 dias'::character varying, 'Até 90 dias ou +'::character varying])::text[])))
//   PRIMARY KEY demandas_vendas_pkey: PRIMARY KEY (id)
//   CHECK demandas_vendas_status_demanda_check: CHECK (((status_demanda)::text = ANY ((ARRAY['aberta'::character varying, 'atendida'::character varying, 'impossivel'::character varying, 'sem_resposta_24h'::character varying, 'ganho'::character varying])::text[])))
//   CHECK demandas_vendas_telefone_check: CHECK (((telefone)::text ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}
::text))
//   CHECK demandas_vendas_tipo_imovel_check: CHECK (((tipo_imovel)::text = ANY ((ARRAY['Casa'::character varying, 'Apartamento'::character varying, 'Terreno'::character varying])::text[])))
//   CHECK demandas_vendas_vagas_estacionamento_check: CHECK (((vagas_estacionamento >= 0) AND (vagas_estacionamento <= 10)))
// Table: grupos_demandas
//   PRIMARY KEY grupos_demandas_pkey: PRIMARY KEY (id)
// Table: imoveis_captados
//   FOREIGN KEY fk_imoveis_captador: FOREIGN KEY (user_captador_id) REFERENCES users(id) ON DELETE SET NULL
//   UNIQUE imoveis_captados_codigo_imovel_key: UNIQUE (codigo_imovel)
//   CHECK imoveis_captados_comissao_percentual_check: CHECK (((comissao_percentual >= (0)::numeric) AND (comissao_percentual <= (100)::numeric)))
//   FOREIGN KEY imoveis_captados_demanda_locacao_id_fkey: FOREIGN KEY (demanda_locacao_id) REFERENCES demandas_locacao(id) ON DELETE SET NULL
//   FOREIGN KEY imoveis_captados_demanda_venda_id_fkey: FOREIGN KEY (demanda_venda_id) REFERENCES demandas_vendas(id) ON DELETE SET NULL
//   FOREIGN KEY imoveis_captados_landlord_id_fkey: FOREIGN KEY (landlord_id) REFERENCES landlord_profiles(id) ON DELETE SET NULL
//   PRIMARY KEY imoveis_captados_pkey: PRIMARY KEY (id)
//   CHECK imoveis_captados_preco_check: CHECK ((preco > (0)::numeric))
//   CHECK imoveis_captados_status_captacao_check: CHECK (((status_captacao)::text = ANY ((ARRAY['pendente'::character varying, 'capturado'::character varying, 'visitado'::character varying, 'fechado'::character varying, 'perdido'::character varying])::text[])))
//   FOREIGN KEY imoveis_captados_user_captador_id_fkey: FOREIGN KEY (user_captador_id) REFERENCES users(id) ON DELETE SET NULL
// Table: landlord_profiles
//   PRIMARY KEY landlord_profiles_pkey: PRIMARY KEY (id)
//   FOREIGN KEY landlord_profiles_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: notificacoes
//   PRIMARY KEY notificacoes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY notificacoes_usuario_id_fkey: FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
// Table: pontuacao_captador
//   FOREIGN KEY pontuacao_captador_captador_id_fkey: FOREIGN KEY (captador_id) REFERENCES users(id) ON DELETE CASCADE
//   FOREIGN KEY pontuacao_captador_demanda_locacao_id_fkey: FOREIGN KEY (demanda_locacao_id) REFERENCES demandas_locacao(id) ON DELETE CASCADE
//   FOREIGN KEY pontuacao_captador_demanda_venda_id_fkey: FOREIGN KEY (demanda_venda_id) REFERENCES demandas_vendas(id) ON DELETE CASCADE
//   PRIMARY KEY pontuacao_captador_pkey: PRIMARY KEY (id)
//   CHECK pontuacao_captador_tipo_pontuacao_check: CHECK ((tipo_pontuacao = ANY (ARRAY['captura_com_demanda'::text, 'captura_sem_demanda'::text, 'ganho_confirmado'::text])))
// Table: prazos_captacao
//   CHECK check_demanda_link_prazos: CHECK ((((demanda_locacao_id IS NOT NULL) AND (demanda_venda_id IS NULL)) OR ((demanda_locacao_id IS NULL) AND (demanda_venda_id IS NOT NULL))))
//   FOREIGN KEY prazos_captacao_captador_id_fkey: FOREIGN KEY (captador_id) REFERENCES users(id) ON DELETE SET NULL
//   FOREIGN KEY prazos_captacao_demanda_locacao_id_fkey: FOREIGN KEY (demanda_locacao_id) REFERENCES demandas_locacao(id) ON DELETE CASCADE
//   FOREIGN KEY prazos_captacao_demanda_venda_id_fkey: FOREIGN KEY (demanda_venda_id) REFERENCES demandas_vendas(id) ON DELETE CASCADE
//   PRIMARY KEY prazos_captacao_pkey: PRIMARY KEY (id)
//   CHECK prazos_captacao_status_check: CHECK (((status)::text = ANY ((ARRAY['ativo'::character varying, 'vencido'::character varying, 'respondido'::character varying, 'sem_resposta_24h'::character varying, 'sem_resposta_final'::character varying])::text[])))
// Table: property_performance
//   PRIMARY KEY property_performance_pkey: PRIMARY KEY (property_id)
//   FOREIGN KEY property_performance_property_id_fkey: FOREIGN KEY (property_id) REFERENCES imoveis_captados(id) ON DELETE CASCADE
// Table: realtime_logs
//   PRIMARY KEY realtime_logs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY realtime_logs_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
// Table: respostas_captador
//   CHECK check_demanda_link_respostas: CHECK ((((demanda_locacao_id IS NOT NULL) AND (demanda_venda_id IS NULL)) OR ((demanda_locacao_id IS NULL) AND (demanda_venda_id IS NOT NULL))))
//   CHECK check_motivo_nao_encontrei: CHECK ((((resposta)::text = 'encontrei'::text) OR (((resposta)::text = 'nao_encontrei'::text) AND (motivo IS NOT NULL) AND (TRIM(BOTH FROM motivo) <> ''::text))))
//   FOREIGN KEY respostas_captador_captador_id_fkey: FOREIGN KEY (captador_id) REFERENCES users(id) ON DELETE CASCADE
//   FOREIGN KEY respostas_captador_demanda_locacao_id_fkey: FOREIGN KEY (demanda_locacao_id) REFERENCES demandas_locacao(id) ON DELETE CASCADE
//   FOREIGN KEY respostas_captador_demanda_venda_id_fkey: FOREIGN KEY (demanda_venda_id) REFERENCES demandas_vendas(id) ON DELETE CASCADE
//   PRIMARY KEY respostas_captador_pkey: PRIMARY KEY (id)
//   CHECK respostas_captador_resposta_check: CHECK (((resposta)::text = ANY ((ARRAY['encontrei'::character varying, 'nao_encontrei'::character varying])::text[])))
// Table: tenant_proposals
//   PRIMARY KEY tenant_proposals_pkey: PRIMARY KEY (id)
//   FOREIGN KEY tenant_proposals_property_id_fkey: FOREIGN KEY (property_id) REFERENCES imoveis_captados(id) ON DELETE CASCADE
// Table: users
//   CHECK users_email_check: CHECK (((email)::text ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+
::text))
//   UNIQUE users_email_key: UNIQUE (email)
//   FOREIGN KEY users_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY users_pkey: PRIMARY KEY (id)
//   CHECK users_status_check: CHECK (((status)::text = ANY ((ARRAY['ativo'::character varying, 'inativo'::character varying])::text[])))
// Table: vistasoft_cache
//   PRIMARY KEY vistasoft_cache_pkey: PRIMARY KEY (key)
// Table: webhook_queue
//   PRIMARY KEY webhook_queue_pkey: PRIMARY KEY (id)
//   CHECK webhook_queue_status_check: CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))

// --- ROW LEVEL SECURITY POLICIES ---
// Table: api_error_logs
//   Policy "Admins can read api_error_logs" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Anyone can insert api_error_logs" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
// Table: audit_log
//   Policy "Admin sees audit log" (ALL, PERMISSIVE) roles={authenticated}
//     USING: ((((current_setting('request.jwt.claims'::text, true))::jsonb -> 'user_metadata'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'gestor'::text]))
// Table: demandas_locacao
//   Policy "Admin JWT full access demandas_locacao" (ALL, PERMISSIVE) roles={authenticated}
//     USING: ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text]))))))
//     WITH CHECK: ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text]))))))
//   Policy "Admin and Gestor full access Locacao" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text])))))
//   Policy "Admin sees all locacao" (ALL, PERMISSIVE) roles={public}
//     USING: (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::user_role))))
//   Policy "Captador can see demands" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'captador'::text))))
//   Policy "Captadores see aberta locacao" (SELECT, PERMISSIVE) roles={public}
//     USING: (((status_demanda)::text = 'aberta'::text) AND (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'captador'::user_role)))))
//   Policy "SDR sees own Locacao demands" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((sdr_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text, 'captador'::text]))))))
//   Policy "SDRs insert locacao" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((sdr_id = auth.uid()) AND (((auth.jwt() ->> 'role'::text) = 'sdr'::text) OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'sdr'::text) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'sdr'::text))))))
//   Policy "SDRs manage own locacao" (ALL, PERMISSIVE) roles={public}
//     USING: ((sdr_id = auth.uid()) AND (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'sdr'::user_role)))))
// Table: demandas_vendas
//   Policy "Admin JWT full access demandas_vendas" (ALL, PERMISSIVE) roles={authenticated}
//     USING: ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text]))))))
//     WITH CHECK: ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text]))))))
//   Policy "Admin and Gestor full access Vendas" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text])))))
//   Policy "Admin sees all vendas" (ALL, PERMISSIVE) roles={public}
//     USING: (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::user_role))))
//   Policy "Broker sees own Vendas demands" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((corretor_id = auth.uid()) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text, 'captador'::text]))))))
//   Policy "Captador can see demands" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'captador'::text))))
//   Policy "Captadores see aberta vendas" (SELECT, PERMISSIVE) roles={public}
//     USING: (((status_demanda)::text = 'aberta'::text) AND (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'captador'::user_role)))))
//   Policy "Corretores manage own vendas" (ALL, PERMISSIVE) roles={public}
//     USING: ((corretor_id = auth.uid()) AND (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'corretor'::user_role)))))
// Table: grupos_demandas
//   Policy "Authenticated users can delete grupos_demandas" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Authenticated users can insert grupos_demandas" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Authenticated users can read grupos_demandas" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Authenticated users can update grupos_demandas" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: imoveis_captados
//   Policy "Admin JWT full access imoveis_captados" (ALL, PERMISSIVE) roles={authenticated}
//     USING: ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text]))))))
//     WITH CHECK: ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text]))))))
//   Policy "Admin can delete captures" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::user_role))))
//   Policy "Admin can update captures" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::user_role))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::user_role))))
//   Policy "Authenticated users can read all captures" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Captadores insert captures" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Captadores update own captures" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((user_captador_id = auth.uid()) OR (captador_id = auth.uid()))
//     WITH CHECK: ((user_captador_id = auth.uid()) OR (captador_id = auth.uid()))
//   Policy "Corretores update captures linked to own vendas demands" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "SDRs update captures linked to own locacao demands" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: landlord_profiles
//   Policy "Users can update own landlord profile" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
//   Policy "Users can view own landlord profile" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (user_id = auth.uid())
// Table: notificacoes
//   Policy "System can insert notifications" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "Users can update own notifications" (UPDATE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = usuario_id)
//   Policy "Users can view own notifications" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.uid() = usuario_id)
// Table: pontuacao_captador
//   Policy "Authenticated users can read pontuacao" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: prazos_captacao
//   Policy "Admin JWT full access prazos_captacao" (ALL, PERMISSIVE) roles={authenticated}
//     USING: ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text]))))))
//     WITH CHECK: ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text]))))))
//   Policy "All users can read prazos" (SELECT, PERMISSIVE) roles={public}
//     USING: true
//   Policy "Captadores can insert prazos" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "Captadores can update prazos" (UPDATE, PERMISSIVE) roles={public}
//     USING: true
// Table: property_performance
//   Policy "Landlords can view own property performance" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM (imoveis_captados ic      JOIN landlord_profiles lp ON ((ic.landlord_id = lp.id)))   WHERE ((ic.id = property_performance.property_id) AND (lp.user_id = auth.uid()))))
// Table: realtime_logs
//   Policy "Insert realtime logs" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "Users can view own realtime logs" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = user_id)
// Table: respostas_captador
//   Policy "Admin JWT full access respostas_captador" (ALL, PERMISSIVE) roles={authenticated}
//     USING: ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text]))))))
//     WITH CHECK: ((((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text) OR (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY (ARRAY['admin'::text, 'gestor'::text]))))))
//   Policy "Admin sees all respostas" (ALL, PERMISSIVE) roles={public}
//     USING: (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::user_role))))
//   Policy "Authenticated read respostas" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Captadores insert respostas" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (captador_id = auth.uid())
//   Policy "Captadores manage own respostas" (ALL, PERMISSIVE) roles={public}
//     USING: (captador_id = auth.uid())
// Table: tenant_proposals
//   Policy "Landlords can update own proposals" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM (imoveis_captados ic      JOIN landlord_profiles lp ON ((ic.landlord_id = lp.id)))   WHERE ((ic.id = tenant_proposals.property_id) AND (lp.user_id = auth.uid()))))
//   Policy "Landlords can view own proposals" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM (imoveis_captados ic      JOIN landlord_profiles lp ON ((ic.landlord_id = lp.id)))   WHERE ((ic.id = tenant_proposals.property_id) AND (lp.user_id = auth.uid()))))
// Table: users
//   Policy "Authenticated users can read users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Users see own profile" (SELECT, PERMISSIVE) roles={public}
//     USING: (id = auth.uid())
//   Policy "Users update own profile" (UPDATE, PERMISSIVE) roles={public}
//     USING: (id = auth.uid())
// Table: vistasoft_cache
//   Policy "vistasoft_cache_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: webhook_queue
//   Policy "Authenticated users can manage webhook_queue" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true

// --- DATABASE FUNCTIONS ---
// FUNCTION atualizar_prazos_vencidos()
//   CREATE OR REPLACE FUNCTION public.atualizar_prazos_vencidos()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       r RECORD;
//       demanda_owner UUID;
//       cliente_nome TEXT;
//   BEGIN
//       UPDATE public.prazos_captacao
//       SET status = 'sem_resposta_24h'
//       WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas < 3;
//       
//       UPDATE public.prazos_captacao
//       SET status = 'sem_resposta_final'
//       WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas >= 3;
//   
//       UPDATE public.demandas_locacao dl
//       SET status_demanda = 'sem_resposta_24h'
//       FROM public.prazos_captacao pc
//       WHERE dl.id = pc.demanda_locacao_id AND pc.status = 'sem_resposta_24h' AND dl.status_demanda = 'aberta';
//   
//       UPDATE public.demandas_vendas dv
//       SET status_demanda = 'sem_resposta_24h'
//       FROM public.prazos_captacao pc
//       WHERE dv.id = pc.demanda_venda_id AND pc.status = 'sem_resposta_24h' AND dv.status_demanda = 'aberta';
//   
//       FOR r IN 
//           SELECT pc.id, pc.demanda_locacao_id, pc.demanda_venda_id 
//           FROM public.prazos_captacao pc 
//           WHERE pc.status = 'sem_resposta_final'
//       LOOP
//           IF r.demanda_locacao_id IS NOT NULL THEN
//               UPDATE public.demandas_locacao SET status_demanda = 'PERDIDA_BAIXA' 
//               WHERE id = r.demanda_locacao_id AND status_demanda IN ('aberta', 'sem_resposta_24h')
//               RETURNING sdr_id, nome_cliente INTO demanda_owner, cliente_nome;
//               
//               IF FOUND AND demanda_owner IS NOT NULL THEN
//                   INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//                   VALUES (demanda_owner, 'status_atualizado', 'Timeout Expirado',
//                           'Demanda de ' || COALESCE(cliente_nome, '') || ' foi baixada automaticamente por timeout (48h/3 prorrog.).',
//                           jsonb_build_object('demanda_id', r.demanda_locacao_id, 'status', 'PERDIDA_BAIXA'), 'alta');
//               END IF;
//               
//               UPDATE public.prazos_captacao SET status = 'vencido' WHERE id = r.id;
//               
//           ELSIF r.demanda_venda_id IS NOT NULL THEN
//               UPDATE public.demandas_vendas SET status_demanda = 'PERDIDA_BAIXA' 
//               WHERE id = r.demanda_venda_id AND status_demanda IN ('aberta', 'sem_resposta_24h')
//               RETURNING corretor_id, nome_cliente INTO demanda_owner, cliente_nome;
//               
//               IF FOUND AND demanda_owner IS NOT NULL THEN
//                   INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//                   VALUES (demanda_owner, 'status_atualizado', 'Timeout Expirado',
//                           'Demanda de ' || COALESCE(cliente_nome, '') || ' foi baixada automaticamente por timeout (48h/3 prorrog.).',
//                           jsonb_build_object('demanda_id', r.demanda_venda_id, 'status', 'PERDIDA_BAIXA'), 'alta');
//               END IF;
//               
//               UPDATE public.prazos_captacao SET status = 'vencido' WHERE id = r.id;
//           END IF;
//       END LOOP;
//   END;
//   $function$
//   
// FUNCTION audit_log_function()
//   CREATE OR REPLACE FUNCTION public.audit_log_function()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       user_id_val UUID;
//       user_exists BOOLEAN;
//   BEGIN
//       user_id_val := auth.uid();
//       
//       IF user_id_val IS NOT NULL THEN
//           SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_id_val) INTO user_exists;
//           IF NOT user_exists THEN
//               user_id_val := NULL;
//           END IF;
//       END IF;
//   
//       IF TG_OP = 'INSERT' THEN
//           INSERT INTO public.audit_log (usuario_id, acao, tabela, registro_id, dados_novos)
//           VALUES (user_id_val, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
//           RETURN NEW;
//       ELSIF TG_OP = 'UPDATE' THEN
//           INSERT INTO public.audit_log (usuario_id, acao, tabela, registro_id, dados_antigos, dados_novos)
//           VALUES (user_id_val, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
//           RETURN NEW;
//       ELSIF TG_OP = 'DELETE' THEN
//           INSERT INTO public.audit_log (usuario_id, acao, tabela, registro_id, dados_antigos)
//           VALUES (user_id_val, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
//           RETURN OLD;
//       END IF;
//       RETURN NULL;
//   END;
//   $function$
//   
// FUNCTION check_demand_auto_close()
//   CREATE OR REPLACE FUNCTION public.check_demand_auto_close()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       total_captadores INT;
//       respostas_count INT;
//       demanda_owner UUID;
//       cliente_nome TEXT;
//       history_text TEXT;
//   BEGIN
//       IF NEW.resposta = 'nao_encontrei' THEN
//           SELECT count(*) INTO total_captadores FROM public.users WHERE role = 'captador' AND status = 'ativo';
//           
//           IF NEW.demanda_locacao_id IS NOT NULL THEN
//               SELECT count(DISTINCT captador_id) INTO respostas_count 
//               FROM public.respostas_captador 
//               WHERE demanda_locacao_id = NEW.demanda_locacao_id AND resposta = 'nao_encontrei';
//           ELSIF NEW.demanda_venda_id IS NOT NULL THEN
//               SELECT count(DISTINCT captador_id) INTO respostas_count 
//               FROM public.respostas_captador 
//               WHERE demanda_venda_id = NEW.demanda_venda_id AND resposta = 'nao_encontrei';
//           END IF;
//   
//           IF respostas_count >= total_captadores AND total_captadores > 0 THEN
//               SELECT string_agg(u.nome || ' (' || to_char(r.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo', 'DD/MM HH24:MI') || ')', ', ')
//               INTO history_text
//               FROM public.respostas_captador r
//               JOIN public.users u ON u.id = r.captador_id
//               WHERE (r.demanda_locacao_id = NEW.demanda_locacao_id OR r.demanda_venda_id = NEW.demanda_venda_id)
//                 AND r.resposta = 'nao_encontrei';
//   
//               IF NEW.demanda_locacao_id IS NOT NULL THEN
//                   UPDATE public.demandas_locacao SET status_demanda = 'PERDIDA_BAIXA' WHERE id = NEW.demanda_locacao_id AND status_demanda != 'PERDIDA_BAIXA';
//                   IF FOUND THEN
//                       SELECT sdr_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
//                       IF demanda_owner IS NOT NULL THEN
//                           INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//                           VALUES (demanda_owner, 'status_atualizado', 'Demanda Baixada: Todos marcaram PERDIDO',
//                                   'Cliente: ' || COALESCE(cliente_nome, '') || '. Histórico: ' || history_text,
//                                   jsonb_build_object('demanda_id', NEW.demanda_locacao_id, 'status', 'PERDIDA_BAIXA'), 'alta');
//                       END IF;
//                   END IF;
//               ELSIF NEW.demanda_venda_id IS NOT NULL THEN
//                   UPDATE public.demandas_vendas SET status_demanda = 'PERDIDA_BAIXA' WHERE id = NEW.demanda_venda_id AND status_demanda != 'PERDIDA_BAIXA';
//                   IF FOUND THEN
//                       SELECT corretor_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
//                       IF demanda_owner IS NOT NULL THEN
//                           INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//                           VALUES (demanda_owner, 'status_atualizado', 'Demanda Baixada: Todos marcaram PERDIDO',
//                                   'Cliente: ' || COALESCE(cliente_nome, '') || '. Histórico: ' || history_text,
//                                   jsonb_build_object('demanda_id', NEW.demanda_venda_id, 'status', 'PERDIDA_BAIXA'), 'alta');
//                       END IF;
//                   END IF;
//               END IF;
//           END IF;
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION criar_prazo_captacao()
//   CREATE OR REPLACE FUNCTION public.criar_prazo_captacao()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       IF TG_TABLE_NAME = 'demandas_locacao' THEN
//           INSERT INTO public.prazos_captacao (demanda_locacao_id, prazo_resposta)
//           VALUES (NEW.id, NOW() + INTERVAL '24 hours');
//       ELSIF TG_TABLE_NAME = 'demandas_vendas' THEN
//           INSERT INTO public.prazos_captacao (demanda_venda_id, prazo_resposta)
//           VALUES (NEW.id, NOW() + INTERVAL '24 hours');
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION fn_agrupar_demandas_automaticamente()
//   CREATE OR REPLACE FUNCTION public.fn_agrupar_demandas_automaticamente()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       v_grupo_id UUID;
//       v_bairro TEXT;
//   BEGIN
//       v_bairro := COALESCE(NEW.bairros[1], 'Desconhecido');
//       
//       SELECT id INTO v_grupo_id
//       FROM public.grupos_demandas
//       WHERE bairro = v_bairro 
//         AND (dormitorios = NEW.dormitorios OR num_quartos = NEW.dormitorios)
//       LIMIT 1;
//   
//       IF v_grupo_id IS NULL THEN
//           INSERT INTO public.grupos_demandas (bairro, tipologia, valor_aluguel, num_quartos, count_demandas, preco_maximo_group, dormitorios, tipo)
//           VALUES (v_bairro, 'Padrão', COALESCE(NEW.valor_maximo, 0), COALESCE(NEW.dormitorios, 0), 1, COALESCE(NEW.valor_maximo, 0), COALESCE(NEW.dormitorios, 0), 'locacao')
//           RETURNING id INTO v_grupo_id;
//       ELSE
//           UPDATE public.grupos_demandas
//           SET count_demandas = count_demandas + 1, total_demandas_ativas = total_demandas_ativas + 1
//           WHERE id = v_grupo_id;
//       END IF;
//   
//       NEW.grupo_id := v_grupo_id;
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION fn_atualizar_tenant_score()
//   CREATE OR REPLACE FUNCTION public.fn_atualizar_tenant_score()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       NEW.tenant_score := public.fn_calcular_tenant_score(COALESCE(NEW.renda_mensal_estimada, 0), COALESCE(NEW.valor_maximo, 0));
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION fn_auto_fix_test_users()
//   CREATE OR REPLACE FUNCTION public.fn_auto_fix_test_users()
//    RETURNS jsonb
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_sdr_id uuid;
//     v_cap_id uuid;
//     v_cor_id uuid;
//     v_adm_id uuid;
//     v_result jsonb := '{"status": "success", "fixed": []}'::jsonb;
//   BEGIN
//     -- Fix NULLs in auth.users just in case (GoTrue bug mitigation)
//     UPDATE auth.users
//     SET
//       confirmation_token = COALESCE(confirmation_token, ''),
//       recovery_token = COALESCE(recovery_token, ''),
//       email_change_token_new = COALESCE(email_change_token_new, ''),
//       email_change = COALESCE(email_change, ''),
//       email_change_token_current = COALESCE(email_change_token_current, ''),
//       phone_change = COALESCE(phone_change, ''),
//       phone_change_token = COALESCE(phone_change_token, ''),
//       reauthentication_token = COALESCE(reauthentication_token, '')
//     WHERE
//       confirmation_token IS NULL OR recovery_token IS NULL
//       OR email_change_token_new IS NULL OR email_change IS NULL
//       OR email_change_token_current IS NULL
//       OR phone_change IS NULL OR phone_change_token IS NULL
//       OR reauthentication_token IS NULL;
//   
//     -- ==========================================
//     -- SDR
//     -- ==========================================
//     SELECT id INTO v_sdr_id FROM auth.users WHERE email = 'sdr@etic.com';
//     IF v_sdr_id IS NULL THEN
//       v_sdr_id := gen_random_uuid();
//       INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
//       VALUES (v_sdr_id, '00000000-0000-0000-0000-000000000000', 'sdr@etic.com', crypt('Password1', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
//     ELSE
//       UPDATE auth.users SET encrypted_password = crypt('Password1', gen_salt('bf')) WHERE id = v_sdr_id;
//     END IF;
//     
//     -- Clean potential orphans
//     DELETE FROM public.users WHERE email = 'sdr@etic.com' AND id != v_sdr_id;
//     
//     INSERT INTO public.users (id, email, nome, role, status) 
//     VALUES (v_sdr_id, 'sdr@etic.com', 'SDR Teste', 'sdr', 'ativo') 
//     ON CONFLICT (id) DO UPDATE SET email = 'sdr@etic.com', role = 'sdr', status = 'ativo';
//   
//     -- ==========================================
//     -- Captador
//     -- ==========================================
//     SELECT id INTO v_cap_id FROM auth.users WHERE email = 'captador@etic.com';
//     IF v_cap_id IS NULL THEN
//       v_cap_id := gen_random_uuid();
//       INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
//       VALUES (v_cap_id, '00000000-0000-0000-0000-000000000000', 'captador@etic.com', crypt('captacao123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
//     ELSE
//       UPDATE auth.users SET encrypted_password = crypt('captacao123', gen_salt('bf')) WHERE id = v_cap_id;
//     END IF;
//   
//     DELETE FROM public.users WHERE email = 'captador@etic.com' AND id != v_cap_id;
//   
//     INSERT INTO public.users (id, email, nome, role, status) 
//     VALUES (v_cap_id, 'captador@etic.com', 'Captador Teste', 'captador', 'ativo') 
//     ON CONFLICT (id) DO UPDATE SET email = 'captador@etic.com', role = 'captador', status = 'ativo';
//   
//     -- ==========================================
//     -- Corretor
//     -- ==========================================
//     SELECT id INTO v_cor_id FROM auth.users WHERE email = 'corretor@etic.com';
//     IF v_cor_id IS NULL THEN
//       v_cor_id := gen_random_uuid();
//       INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
//       VALUES (v_cor_id, '00000000-0000-0000-0000-000000000000', 'corretor@etic.com', crypt('Password1', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
//     ELSE
//       UPDATE auth.users SET encrypted_password = crypt('Password1', gen_salt('bf')) WHERE id = v_cor_id;
//     END IF;
//   
//     DELETE FROM public.users WHERE email = 'corretor@etic.com' AND id != v_cor_id;
//   
//     INSERT INTO public.users (id, email, nome, role, status) 
//     VALUES (v_cor_id, 'corretor@etic.com', 'Corretor Teste', 'corretor', 'ativo') 
//     ON CONFLICT (id) DO UPDATE SET email = 'corretor@etic.com', role = 'corretor', status = 'ativo';
//   
//     -- ==========================================
//     -- Admin
//     -- ==========================================
//     SELECT id INTO v_adm_id FROM auth.users WHERE email = 'admin@etic.com';
//     IF v_adm_id IS NULL THEN
//       v_adm_id := gen_random_uuid();
//       INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
//       VALUES (v_adm_id, '00000000-0000-0000-0000-000000000000', 'admin@etic.com', crypt('Password1', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '', '', '', '', '', '', '', '');
//     ELSE
//       UPDATE auth.users SET encrypted_password = crypt('Password1', gen_salt('bf')) WHERE id = v_adm_id;
//     END IF;
//   
//     DELETE FROM public.users WHERE email = 'admin@etic.com' AND id != v_adm_id;
//   
//     INSERT INTO public.users (id, email, nome, role, status) 
//     VALUES (v_adm_id, 'admin@etic.com', 'Admin Teste', 'admin', 'ativo') 
//     ON CONFLICT (id) DO UPDATE SET email = 'admin@etic.com', role = 'admin', status = 'ativo';
//   
//     v_result := '{"status": "success", "message": "Usuários de teste validados e senhas regeneradas."}'::jsonb;
//     RETURN v_result;
//   END;
//   $function$
//   
// FUNCTION fn_calcular_tenant_score(numeric, numeric)
//   CREATE OR REPLACE FUNCTION public.fn_calcular_tenant_score(p_renda_mensal numeric, p_valor_aluguel numeric)
//    RETURNS integer
//    LANGUAGE plpgsql
//    IMMUTABLE
//   AS $function$
//   DECLARE
//       score INTEGER := 50;
//       comprometimento NUMERIC;
//   BEGIN
//       IF p_valor_aluguel > 0 AND p_renda_mensal > 0 THEN
//           comprometimento := (p_valor_aluguel / p_renda_mensal) * 100;
//           IF comprometimento <= 30 THEN score := score + 30;
//           ELSIF comprometimento <= 40 THEN score := score + 15;
//           ELSE score := score - 20;
//           END IF;
//       END IF;
//       IF score > 100 THEN score := 100; END IF;
//       IF score < 0 THEN score := 0; END IF;
//       RETURN score;
//   END;
//   $function$
//   
// FUNCTION fn_calculate_points_on_insert()
//   CREATE OR REPLACE FUNCTION public.fn_calculate_points_on_insert()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       cid UUID;
//   BEGIN
//       cid := COALESCE(NEW.user_captador_id, NEW.captador_id);
//       IF cid IS NULL THEN
//           RETURN NEW;
//       END IF;
//   
//       IF NEW.demanda_locacao_id IS NOT NULL THEN
//           INSERT INTO public.pontuacao_captador (captador_id, demanda_locacao_id, tipo_pontuacao, pontos)
//           VALUES (cid, NEW.demanda_locacao_id, 'captura_com_demanda', 10);
//       ELSIF NEW.demanda_venda_id IS NOT NULL THEN
//           INSERT INTO public.pontuacao_captador (captador_id, demanda_venda_id, tipo_pontuacao, pontos)
//           VALUES (cid, NEW.demanda_venda_id, 'captura_com_demanda', 10);
//       ELSE
//           INSERT INTO public.pontuacao_captador (captador_id, tipo_pontuacao, pontos)
//           VALUES (cid, 'captura_sem_demanda', 3);
//       END IF;
//       
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION fn_clean_expired_cache()
//   CREATE OR REPLACE FUNCTION public.fn_clean_expired_cache()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       DELETE FROM public.vistasoft_cache WHERE expires_at <= NOW();
//   END;
//   $function$
//   
// FUNCTION fn_diagnose_and_fix_auth(text, text, text, text)
//   CREATE OR REPLACE FUNCTION public.fn_diagnose_and_fix_auth(p_email text, p_password text, p_name text, p_role text)
//    RETURNS jsonb
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_user_id uuid;
//     v_actions jsonb := '[]'::jsonb;
//   BEGIN
//     -- 1. Corrige NULLs globais que causam erro 500 no GoTrue
//     UPDATE auth.users
//     SET
//       confirmation_token = COALESCE(confirmation_token, ''),
//       recovery_token = COALESCE(recovery_token, ''),
//       email_change_token_new = COALESCE(email_change_token_new, ''),
//       email_change = COALESCE(email_change, ''),
//       email_change_token_current = COALESCE(email_change_token_current, ''),
//       phone_change = COALESCE(phone_change, ''),
//       phone_change_token = COALESCE(phone_change_token, ''),
//       reauthentication_token = COALESCE(reauthentication_token, '')
//     WHERE
//       confirmation_token IS NULL OR recovery_token IS NULL
//       OR email_change_token_new IS NULL OR email_change IS NULL
//       OR email_change_token_current IS NULL
//       OR phone_change IS NULL OR phone_change_token IS NULL
//       OR reauthentication_token IS NULL;
//   
//     -- 2. Verifica se o usuário existe em auth.users
//     SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
//     
//     IF v_user_id IS NULL THEN
//       v_user_id := gen_random_uuid();
//       INSERT INTO auth.users (
//         id, instance_id, email, encrypted_password, email_confirmed_at,
//         created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
//         is_super_admin, role, aud,
//         confirmation_token, recovery_token, email_change_token_new,
//         email_change, email_change_token_current,
//         phone, phone_change, phone_change_token, reauthentication_token
//       ) VALUES (
//         v_user_id,
//         '00000000-0000-0000-0000-000000000000',
//         p_email,
//         crypt(p_password, gen_salt('bf')),
//         NOW(), NOW(), NOW(),
//         '{"provider": "email", "providers": ["email"]}',
//         json_build_object('name', p_name, 'role', p_role),
//         false, 'authenticated', 'authenticated',
//         '', '', '', '', '', NULL, '', '', ''
//       );
//       v_actions := v_actions || jsonb_build_array('Criado usuário ausente no auth.users'::text);
//     ELSE
//       -- Força a atualização da senha para garantir hash válido bcrypt
//       UPDATE auth.users 
//       SET 
//         encrypted_password = crypt(p_password, gen_salt('bf')),
//         email_confirmed_at = COALESCE(email_confirmed_at, NOW())
//       WHERE id = v_user_id;
//       v_actions := v_actions || jsonb_build_array('Senha resetada e hash sincronizado'::text);
//     END IF;
//   
//     -- 3. Sincroniza com a tabela public.users customizada
//     IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
//       -- Limpa registros órfãos com o mesmo email mas IDs diferentes
//       DELETE FROM public.users WHERE email = p_email AND id != v_user_id;
//       
//       INSERT INTO public.users (id, email, nome, role, status)
//       VALUES (v_user_id, p_email, p_name, p_role::public.user_role, 'ativo');
//       v_actions := v_actions || jsonb_build_array('Perfil sincronizado na tabela usuarios'::text);
//     ELSE
//       UPDATE public.users 
//       SET email = p_email, nome = p_name, role = p_role::public.user_role, status = 'ativo'
//       WHERE id = v_user_id;
//       v_actions := v_actions || jsonb_build_array('Perfil atualizado e verificado'::text);
//     END IF;
//   
//     RETURN jsonb_build_object('status', 'success', 'user_id', v_user_id, 'actions', v_actions);
//   END;
//   $function$
//   
// FUNCTION fn_diagnose_oauth_setup()
//   CREATE OR REPLACE FUNCTION public.fn_diagnose_oauth_setup()
//    RETURNS jsonb
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_trigger_exists boolean;
//     v_rls_enabled boolean;
//     v_result jsonb;
//   BEGIN
//     -- Check if the crucial auto-sync trigger exists on auth.users
//     SELECT EXISTS (
//       SELECT 1 FROM pg_trigger
//       WHERE tgname = 'on_auth_user_created'
//     ) INTO v_trigger_exists;
//   
//     -- Check if RLS is enabled on public.users
//     SELECT relrowsecurity INTO v_rls_enabled
//     FROM pg_class
//     WHERE relname = 'users';
//   
//     -- Compile results
//     v_result := jsonb_build_object(
//       'trigger_active', v_trigger_exists,
//       'rls_active', COALESCE(v_rls_enabled, false),
//       'timestamp', now()
//     );
//   
//     RETURN v_result;
//   END;
//   $function$
//   
// FUNCTION fn_hard_reset_imoveis()
//   CREATE OR REPLACE FUNCTION public.fn_hard_reset_imoveis()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       v_is_admin boolean;
//   BEGIN
//       -- Verifica se o usuário atual tem permissão de administrador ou gestor
//       SELECT EXISTS (
//           SELECT 1 FROM public.users 
//           WHERE id = auth.uid() AND role IN ('admin', 'gestor')
//       ) INTO v_is_admin;
//   
//       IF NOT v_is_admin THEN
//           RAISE EXCEPTION 'Acesso negado. Apenas administradores podem executar o reset total.';
//       END IF;
//   
//       -- Deleta todos os registros relacionados a imóveis
//       DELETE FROM public.imoveis_captados;
//       DELETE FROM public.vistasoft_cache;
//       DELETE FROM public.property_performance;
//       DELETE FROM public.tenant_proposals;
//   
//       -- Limpa pontuação relacionada a imóveis genéricos (sem demanda)
//       DELETE FROM public.pontuacao_captador WHERE tipo_pontuacao = 'captura_sem_demanda';
//   
//       -- Deleta de tabelas virtuais/futuras se existirem
//       BEGIN
//           EXECUTE 'DELETE FROM public.visitas_agendadas';
//       EXCEPTION WHEN undefined_table THEN NULL;
//       END;
//   
//       BEGIN
//           EXECUTE 'DELETE FROM public.negocios_fechados';
//       EXCEPTION WHEN undefined_table THEN NULL;
//       END;
//   END;
//   $function$
//   
// FUNCTION fn_logar_falhas_api(text, text, text, jsonb)
//   CREATE OR REPLACE FUNCTION public.fn_logar_falhas_api(p_api text, p_endpoint text, p_message text, p_payload jsonb DEFAULT NULL::jsonb)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       INSERT INTO public.api_error_logs (api_name, endpoint, error_message, payload)
//       VALUES (p_api, p_endpoint, p_message, p_payload);
//   END;
//   $function$
//   
// FUNCTION fn_notify_new_demand_locacao()
//   CREATE OR REPLACE FUNCTION public.fn_notify_new_demand_locacao()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       prioridade_val notificacao_prioridade;
//   BEGIN
//       IF NEW.nivel_urgencia IN ('Urgente', 'Alta') THEN 
//           prioridade_val := 'alta';
//       ELSIF NEW.nivel_urgencia IN ('Baixa') THEN 
//           prioridade_val := 'baixa';
//       ELSE 
//           prioridade_val := 'normal'; 
//       END IF;
//   
//       INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//       SELECT id, 'nova_demanda', 
//              'Nova demanda: ' || COALESCE(NEW.nome_cliente, NEW.cliente_nome, 'Cliente'), 
//              COALESCE(array_to_string(NEW.bairros, ', '), '') || ' - R$ ' || COALESCE(NEW.valor_maximo, 0),
//              jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', 'Aluguel'),
//              prioridade_val
//       FROM public.users WHERE role = 'captador';
//       
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION fn_processar_webhook_queue()
//   CREATE OR REPLACE FUNCTION public.fn_processar_webhook_queue()
//    RETURNS TABLE(id uuid, event_type text, payload jsonb, status text)
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       RETURN QUERY
//       UPDATE public.webhook_queue wq
//       SET status = 'processing', updated_at = NOW()
//       WHERE wq.id IN (
//           SELECT w.id FROM public.webhook_queue w
//           WHERE w.status = 'pending' OR (w.status = 'failed' AND w.retry_count < w.max_retries)
//           ORDER BY w.created_at ASC
//           LIMIT 10
//           FOR UPDATE SKIP LOCKED
//       )
//       RETURNING wq.id, wq.event_type, wq.payload, wq.status;
//   END;
//   $function$
//   
// FUNCTION fn_reset_database(timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.fn_reset_database(p_delete_before timestamp with time zone DEFAULT now())
//    RETURNS jsonb
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       v_is_admin boolean;
//       v_count_imoveis int;
//       v_count_locacao int;
//       v_count_vendas int;
//       v_count_notificacoes int;
//   BEGIN
//       -- Verifica se o usuário é admin
//       SELECT EXISTS (
//           SELECT 1 FROM public.users 
//           WHERE id = auth.uid() AND role IN ('admin', 'gestor')
//       ) INTO v_is_admin;
//   
//       IF NOT v_is_admin THEN
//           RAISE EXCEPTION 'Acesso negado. Apenas administradores podem resetar a base.';
//       END IF;
//   
//       -- Deleta imóveis captados (isso inclui visitas_agendadas e negocios_fechados virtuais, pois são apenas status do imóvel no Supabase)
//       WITH deleted AS (
//           DELETE FROM public.imoveis_captados 
//           WHERE created_at <= p_delete_before
//           RETURNING id
//       ) SELECT count(*) INTO v_count_imoveis FROM deleted;
//   
//       -- Deleta demandas de locação
//       WITH deleted AS (
//           DELETE FROM public.demandas_locacao 
//           WHERE created_at <= p_delete_before
//           RETURNING id
//       ) SELECT count(*) INTO v_count_locacao FROM deleted;
//   
//       -- Deleta demandas de vendas
//       WITH deleted AS (
//           DELETE FROM public.demandas_vendas 
//           WHERE created_at <= p_delete_before
//           RETURNING id
//       ) SELECT count(*) INTO v_count_vendas FROM deleted;
//   
//       -- Limpa tabelas auxiliares para não deixar lixo
//       DELETE FROM public.pontuacao_captador WHERE created_at <= p_delete_before;
//       DELETE FROM public.prazos_captacao WHERE data_criacao <= p_delete_before;
//       DELETE FROM public.respostas_captador WHERE created_at <= p_delete_before;
//       DELETE FROM public.tenant_proposals WHERE created_at <= p_delete_before;
//       
//       WITH deleted AS (
//           DELETE FROM public.notificacoes 
//           WHERE created_at <= p_delete_before
//           RETURNING id
//       ) SELECT count(*) INTO v_count_notificacoes FROM deleted;
//   
//       DELETE FROM public.audit_log WHERE created_at <= p_delete_before;
//       DELETE FROM public.realtime_logs WHERE timestamp <= p_delete_before;
//   
//       RETURN jsonb_build_object(
//           'status', 'success',
//           'deleted', jsonb_build_object(
//               'imoveis_captados', v_count_imoveis,
//               'demandas_locacao', v_count_locacao,
//               'demandas_vendas', v_count_vendas,
//               'notificacoes', v_count_notificacoes
//           )
//       );
//   END;
//   $function$
//   
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//     BEGIN
//       INSERT INTO public.users (id, email, nome, role, status)
//       VALUES (
//         NEW.id,
//         NEW.email,
//         COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
//         COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'captador'::public.user_role),
//         'ativo'
//       )
//       ON CONFLICT (id) DO UPDATE SET
//         email = EXCLUDED.email,
//         nome = COALESCE(public.users.nome, EXCLUDED.nome);
//       RETURN NEW;
//     END;
//     $function$
//   
// FUNCTION log_realtime_error(text, text, uuid)
//   CREATE OR REPLACE FUNCTION public.log_realtime_error(p_channel_name text, p_error_message text, p_user_id uuid DEFAULT NULL::uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.realtime_logs (channel_name, error_message, user_id, timestamp)
//     VALUES (p_channel_name, p_error_message, p_user_id, now());
//   END;
//   $function$
//   
// FUNCTION marcar_prazo_respondido_imovel()
//   CREATE OR REPLACE FUNCTION public.marcar_prazo_respondido_imovel()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       IF NEW.demanda_locacao_id IS NOT NULL THEN
//           UPDATE public.prazos_captacao SET status = 'respondido' WHERE demanda_locacao_id = NEW.demanda_locacao_id;
//       ELSIF NEW.demanda_venda_id IS NOT NULL THEN
//           UPDATE public.prazos_captacao SET status = 'respondido' WHERE demanda_venda_id = NEW.demanda_venda_id;
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION marcar_prazo_respondido_resposta()
//   CREATE OR REPLACE FUNCTION public.marcar_prazo_respondido_resposta()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       -- Se for fora do perfil, fora do mercado ou outro, nós consideramos respondido.
//       -- Se for 'Buscando outras opções', continua contando.
//       IF NEW.resposta = 'encontrei' OR (NEW.resposta = 'nao_encontrei' AND NEW.motivo != 'Buscando outras opções') THEN
//           IF NEW.demanda_locacao_id IS NOT NULL THEN
//               UPDATE public.prazos_captacao SET status = 'respondido' WHERE demanda_locacao_id = NEW.demanda_locacao_id;
//           ELSIF NEW.demanda_venda_id IS NOT NULL THEN
//               UPDATE public.prazos_captacao SET status = 'respondido' WHERE demanda_venda_id = NEW.demanda_venda_id;
//           END IF;
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION notify_imovel_atualizado()
//   CREATE OR REPLACE FUNCTION public.notify_imovel_atualizado()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       demanda_owner UUID;
//   BEGIN
//       IF NEW.etapa_funil IS DISTINCT FROM OLD.etapa_funil THEN
//           IF NEW.demanda_locacao_id IS NOT NULL THEN
//               SELECT sdr_id INTO demanda_owner FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
//           ELSIF NEW.demanda_venda_id IS NOT NULL THEN
//               SELECT corretor_id INTO demanda_owner FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
//           END IF;
//   
//           IF demanda_owner IS NOT NULL THEN
//               IF NEW.etapa_funil = 'visitado' THEN
//                   INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//                   VALUES (demanda_owner, 'status_atualizado', 'Imóvel Visitado',
//                           'Imóvel ' || COALESCE(NEW.codigo_imovel, '') || ' marcado como visitado.',
//                           jsonb_build_object('imovel_id', NEW.id, 'demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'normal');
//               ELSIF NEW.etapa_funil = 'fechado' THEN
//                   INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//                   VALUES (demanda_owner, 'status_atualizado', 'Negócio Fechado! 🎉',
//                           'Imóvel ' || COALESCE(NEW.codigo_imovel, '') || ' marcado como fechado!',
//                           jsonb_build_object('imovel_id', NEW.id, 'demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'alta');
//               END IF;
//           END IF;
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION notify_nova_demanda()
//   CREATE OR REPLACE FUNCTION public.notify_nova_demanda()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       urgencia_text TEXT;
//       prioridade_val notificacao_prioridade;
//       cliente_nome TEXT;
//       bairros_text TEXT;
//       valor_max NUMERIC;
//   BEGIN
//       IF TG_TABLE_NAME = 'demandas_locacao' THEN
//           urgencia_text := NEW.nivel_urgencia;
//           cliente_nome := NEW.nome_cliente;
//           valor_max := NEW.valor_maximo;
//       ELSE
//           urgencia_text := NEW.nivel_urgencia;
//           cliente_nome := NEW.nome_cliente;
//           valor_max := NEW.valor_maximo;
//       END IF;
//   
//       IF urgencia_text IN ('Urgente', 'Alta') THEN 
//           prioridade_val := 'alta';
//       ELSIF urgencia_text IN ('Baixa') THEN 
//           prioridade_val := 'baixa';
//       ELSE 
//           prioridade_val := 'normal'; 
//       END IF;
//   
//       bairros_text := array_to_string(NEW.bairros, ', ');
//   
//       INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//       SELECT id, 'nova_demanda', 
//              'Nova demanda: ' || COALESCE(cliente_nome, ''), 
//              COALESCE(bairros_text, '') || ' - R$ ' || COALESCE(valor_max, 0),
//              jsonb_build_object('demanda_id', NEW.id, 'tipo_demanda', CASE WHEN TG_TABLE_NAME = 'demandas_locacao' THEN 'Aluguel' ELSE 'Venda' END),
//              prioridade_val
//       FROM public.users WHERE role = 'captador';
//   
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION notify_novo_imovel()
//   CREATE OR REPLACE FUNCTION public.notify_novo_imovel()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       demanda_owner UUID;
//       cliente_nome TEXT;
//   BEGIN
//       IF NEW.demanda_locacao_id IS NOT NULL THEN
//           SELECT sdr_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
//           IF demanda_owner IS NOT NULL THEN
//               INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//               VALUES (demanda_owner, 'imovel_capturado', 'Imóvel capturado para ' || COALESCE(cliente_nome, 'Cliente'),
//                       'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
//                       jsonb_build_object('imovel_id', NEW.id, 'demanda_id', NEW.demanda_locacao_id), 'alta');
//           END IF;
//       ELSIF NEW.demanda_venda_id IS NOT NULL THEN
//           SELECT corretor_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
//           IF demanda_owner IS NOT NULL THEN
//               INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//               VALUES (demanda_owner, 'imovel_capturado', 'Imóvel capturado para ' || COALESCE(cliente_nome, 'Cliente'),
//                       'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
//                       jsonb_build_object('imovel_id', NEW.id, 'demanda_id', NEW.demanda_venda_id), 'alta');
//           END IF;
//       ELSE
//           INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//           SELECT id, 'novo_imovel', 'Novo imóvel genérico',
//                  'Código: ' || COALESCE(NEW.codigo_imovel, '') || ', Localização: ' || COALESCE(NEW.endereco, '') || ', Preço: R$ ' || COALESCE(NEW.preco, COALESCE(NEW.valor, 0)),
//                  jsonb_build_object('imovel_id', NEW.id), 'normal'
//           FROM public.users WHERE role = 'corretor';
//       END IF;
//   
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION notify_resposta_captador()
//   CREATE OR REPLACE FUNCTION public.notify_resposta_captador()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       demanda_owner UUID;
//       cliente_nome TEXT;
//       captador_nome TEXT;
//   BEGIN
//       IF NEW.resposta = 'nao_encontrei' THEN
//           SELECT nome INTO captador_nome FROM public.users WHERE id = NEW.captador_id;
//           IF NEW.demanda_locacao_id IS NOT NULL THEN
//               SELECT sdr_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_locacao WHERE id = NEW.demanda_locacao_id;
//           ELSIF NEW.demanda_venda_id IS NOT NULL THEN
//               SELECT corretor_id, nome_cliente INTO demanda_owner, cliente_nome FROM public.demandas_vendas WHERE id = NEW.demanda_venda_id;
//           END IF;
//   
//           IF demanda_owner IS NOT NULL THEN
//               INSERT INTO public.notificacoes (usuario_id, tipo, titulo, mensagem, dados_relacionados, prioridade)
//               VALUES (demanda_owner, 'status_atualizado', 'Busca sem sucesso: ' || COALESCE(cliente_nome, 'Cliente'),
//                       'Captador ' || COALESCE(captador_nome, '') || ' não encontrou imóvel. Motivo: ' || COALESCE(NEW.motivo, ''),
//                       jsonb_build_object('demanda_id', COALESCE(NEW.demanda_locacao_id, NEW.demanda_venda_id)), 'normal');
//           END IF;
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION refresh_admin_dashboard_summary()
//   CREATE OR REPLACE FUNCTION public.refresh_admin_dashboard_summary()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_dashboard_summary;
//   EXCEPTION WHEN OTHERS THEN
//       REFRESH MATERIALIZED VIEW public.admin_dashboard_summary;
//   END;
//   $function$
//   
// FUNCTION rls_auto_enable()
//   CREATE OR REPLACE FUNCTION public.rls_auto_enable()
//    RETURNS event_trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'pg_catalog'
//   AS $function$
//   DECLARE
//     cmd record;
//   BEGIN
//     FOR cmd IN
//       SELECT *
//       FROM pg_event_trigger_ddl_commands()
//       WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
//         AND object_type IN ('table','partitioned table')
//     LOOP
//        IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
//         BEGIN
//           EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
//           RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
//         EXCEPTION
//           WHEN OTHERS THEN
//             RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
//         END;
//        ELSE
//           RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
//        END IF;
//     END LOOP;
//   END;
//   $function$
//   
// FUNCTION set_updated_at()
//   CREATE OR REPLACE FUNCTION public.set_updated_at()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     NEW.updated_at = NOW();
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION trg_pontuacao_ganho_locacao()
//   CREATE OR REPLACE FUNCTION public.trg_pontuacao_ganho_locacao()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       IF NEW.status_demanda = 'ganho' AND OLD.status_demanda != 'ganho' THEN
//           INSERT INTO public.pontuacao_captador (captador_id, demanda_locacao_id, tipo_pontuacao, pontos)
//           SELECT DISTINCT COALESCE(user_captador_id, captador_id), NEW.id, 'ganho_confirmado', 30
//           FROM public.imoveis_captados
//           WHERE demanda_locacao_id = NEW.id AND COALESCE(user_captador_id, captador_id) IS NOT NULL;
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION trg_pontuacao_ganho_vendas()
//   CREATE OR REPLACE FUNCTION public.trg_pontuacao_ganho_vendas()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       IF NEW.status_demanda = 'ganho' AND OLD.status_demanda != 'ganho' THEN
//           INSERT INTO public.pontuacao_captador (captador_id, demanda_venda_id, tipo_pontuacao, pontos)
//           SELECT DISTINCT COALESCE(user_captador_id, captador_id), NEW.id, 'ganho_confirmado', 30
//           FROM public.imoveis_captados
//           WHERE demanda_venda_id = NEW.id AND COALESCE(user_captador_id, captador_id) IS NOT NULL;
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION trg_pontuacao_imovel()
//   CREATE OR REPLACE FUNCTION public.trg_pontuacao_imovel()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       cid UUID;
//   BEGIN
//       -- Captura o ID do captador (tentando dois campos para maior segurança)
//       cid := COALESCE(NEW.user_captador_id, NEW.captador_id);
//       
//       -- Se não houver captador associado, ignora
//       IF cid IS NULL THEN
//           RETURN NEW;
//       END IF;
//   
//       -- Se tem demanda de locação vinculada (+10 pontos)
//       IF NEW.demanda_locacao_id IS NOT NULL THEN
//           INSERT INTO public.pontuacao_captador (captador_id, demanda_locacao_id, tipo_pontuacao, pontos)
//           VALUES (cid, NEW.demanda_locacao_id, 'captura_com_demanda', 10);
//           
//       -- Se tem demanda de venda vinculada (+10 pontos)
//       ELSIF NEW.demanda_venda_id IS NOT NULL THEN
//           INSERT INTO public.pontuacao_captador (captador_id, demanda_venda_id, tipo_pontuacao, pontos)
//           VALUES (cid, NEW.demanda_venda_id, 'captura_com_demanda', 10);
//           
//       -- Sem demanda vinculada (+3 pontos)
//       ELSE
//           INSERT INTO public.pontuacao_captador (captador_id, tipo_pontuacao, pontos)
//           VALUES (cid, 'captura_sem_demanda', 3);
//       END IF;
//       
//       RETURN NEW;
//   END;
//   $function$
//   

// --- TRIGGERS ---
// Table: demandas_locacao
//   audit_demandas_locacao: CREATE TRIGGER audit_demandas_locacao AFTER INSERT OR DELETE OR UPDATE ON public.demandas_locacao FOR EACH ROW EXECUTE FUNCTION audit_log_function()
//   criar_prazo_locacao_trigger: CREATE TRIGGER criar_prazo_locacao_trigger AFTER INSERT ON public.demandas_locacao FOR EACH ROW EXECUTE FUNCTION criar_prazo_captacao()
//   pontuacao_ganho_locacao_trigger: CREATE TRIGGER pontuacao_ganho_locacao_trigger AFTER UPDATE ON public.demandas_locacao FOR EACH ROW EXECUTE FUNCTION trg_pontuacao_ganho_locacao()
//   trg_agrupar_demanda_automaticamente: CREATE TRIGGER trg_agrupar_demanda_automaticamente BEFORE INSERT ON public.demandas_locacao FOR EACH ROW EXECUTE FUNCTION fn_agrupar_demandas_automaticamente()
//   trg_atualizar_tenant_score: CREATE TRIGGER trg_atualizar_tenant_score BEFORE INSERT OR UPDATE OF renda_mensal_estimada, valor_maximo ON public.demandas_locacao FOR EACH ROW EXECUTE FUNCTION fn_atualizar_tenant_score()
//   trg_notify_nova_demanda_locacao: CREATE TRIGGER trg_notify_nova_demanda_locacao AFTER INSERT ON public.demandas_locacao FOR EACH ROW EXECUTE FUNCTION fn_notify_new_demand_locacao()
//   update_demandas_locacao_updated_at: CREATE TRIGGER update_demandas_locacao_updated_at BEFORE UPDATE ON public.demandas_locacao FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: demandas_vendas
//   audit_demandas_vendas: CREATE TRIGGER audit_demandas_vendas AFTER INSERT OR DELETE OR UPDATE ON public.demandas_vendas FOR EACH ROW EXECUTE FUNCTION audit_log_function()
//   criar_prazo_vendas_trigger: CREATE TRIGGER criar_prazo_vendas_trigger AFTER INSERT ON public.demandas_vendas FOR EACH ROW EXECUTE FUNCTION criar_prazo_captacao()
//   pontuacao_ganho_vendas_trigger: CREATE TRIGGER pontuacao_ganho_vendas_trigger AFTER UPDATE ON public.demandas_vendas FOR EACH ROW EXECUTE FUNCTION trg_pontuacao_ganho_vendas()
//   trg_notify_nova_demanda_vendas: CREATE TRIGGER trg_notify_nova_demanda_vendas AFTER INSERT ON public.demandas_vendas FOR EACH ROW EXECUTE FUNCTION notify_nova_demanda()
//   update_demandas_vendas_updated_at: CREATE TRIGGER update_demandas_vendas_updated_at BEFORE UPDATE ON public.demandas_vendas FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: imoveis_captados
//   audit_imoveis_captados: CREATE TRIGGER audit_imoveis_captados AFTER INSERT OR DELETE OR UPDATE ON public.imoveis_captados FOR EACH ROW EXECUTE FUNCTION audit_log_function()
//   marcar_prazo_imovel_trigger: CREATE TRIGGER marcar_prazo_imovel_trigger AFTER INSERT ON public.imoveis_captados FOR EACH ROW EXECUTE FUNCTION marcar_prazo_respondido_imovel()
//   pontuacao_imovel_trigger: CREATE TRIGGER pontuacao_imovel_trigger AFTER INSERT ON public.imoveis_captados FOR EACH ROW EXECUTE FUNCTION fn_calculate_points_on_insert()
//   trg_notify_imovel_atualizado: CREATE TRIGGER trg_notify_imovel_atualizado AFTER UPDATE ON public.imoveis_captados FOR EACH ROW EXECUTE FUNCTION notify_imovel_atualizado()
//   trg_notify_novo_imovel: CREATE TRIGGER trg_notify_novo_imovel AFTER INSERT ON public.imoveis_captados FOR EACH ROW EXECUTE FUNCTION notify_novo_imovel()
//   update_imoveis_captados_updated_at: CREATE TRIGGER update_imoveis_captados_updated_at BEFORE UPDATE ON public.imoveis_captados FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: respostas_captador
//   marcar_prazo_resposta_trigger: CREATE TRIGGER marcar_prazo_resposta_trigger AFTER INSERT ON public.respostas_captador FOR EACH ROW EXECUTE FUNCTION marcar_prazo_respondido_resposta()
//   trg_auto_close_demand: CREATE TRIGGER trg_auto_close_demand AFTER INSERT OR UPDATE ON public.respostas_captador FOR EACH ROW EXECUTE FUNCTION check_demand_auto_close()
//   trg_notify_resposta_captador: CREATE TRIGGER trg_notify_resposta_captador AFTER INSERT ON public.respostas_captador FOR EACH ROW EXECUTE FUNCTION notify_resposta_captador()
//   update_respostas_captador_updated_at: CREATE TRIGGER update_respostas_captador_updated_at BEFORE UPDATE ON public.respostas_captador FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: users
//   audit_users: CREATE TRIGGER audit_users AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION audit_log_function()
//   update_users_updated_at: CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION set_updated_at()

// --- INDEXES ---
// Table: admin_dashboard_summary
//   CREATE UNIQUE INDEX idx_admin_dashboard_id ON public.admin_dashboard_summary USING btree (id)
// Table: demandas_locacao
//   CREATE INDEX idx_demandas_grouping_criteria ON public.demandas_locacao USING btree (tipo_demanda, valor_maximo, dormitorios, vagas_estacionamento)
//   CREATE INDEX idx_demandas_locacao_bairros ON public.demandas_locacao USING gin (bairros)
//   CREATE INDEX idx_demandas_locacao_created_at_desc ON public.demandas_locacao USING btree (created_at DESC)
//   CREATE INDEX idx_demandas_locacao_sdr_id ON public.demandas_locacao USING btree (sdr_id)
//   CREATE INDEX idx_demandas_locacao_status_demanda ON public.demandas_locacao USING btree (status_demanda)
// Table: demandas_vendas
//   CREATE INDEX idx_demandas_vendas_bairros ON public.demandas_vendas USING gin (bairros)
//   CREATE INDEX idx_demandas_vendas_corretor_id ON public.demandas_vendas USING btree (corretor_id)
//   CREATE INDEX idx_demandas_vendas_created_at_desc ON public.demandas_vendas USING btree (created_at DESC)
//   CREATE INDEX idx_demandas_vendas_status_demanda ON public.demandas_vendas USING btree (status_demanda)
// Table: imoveis_captados
//   CREATE INDEX idx_imoveis_captados_captador_id ON public.imoveis_captados USING btree (captador_id)
//   CREATE INDEX idx_imoveis_captados_landlord_id ON public.imoveis_captados USING btree (landlord_id)
//   CREATE INDEX idx_imoveis_captados_status_captacao ON public.imoveis_captados USING btree (status_captacao)
//   CREATE INDEX idx_imoveis_captados_user_captador_id ON public.imoveis_captados USING btree (user_captador_id)
//   CREATE INDEX idx_imoveis_captados_user_captador_id_perf ON public.imoveis_captados USING btree (user_captador_id)
//   CREATE UNIQUE INDEX imoveis_captados_codigo_imovel_key ON public.imoveis_captados USING btree (codigo_imovel)
// Table: landlord_profiles
//   CREATE INDEX idx_landlord_profiles_user_id ON public.landlord_profiles USING btree (user_id)
// Table: notificacoes
//   CREATE INDEX idx_notificacoes_created ON public.notificacoes USING btree (created_at DESC)
//   CREATE INDEX idx_notificacoes_lido ON public.notificacoes USING btree (usuario_id, lido)
//   CREATE INDEX idx_notificacoes_usuario ON public.notificacoes USING btree (usuario_id)
//   CREATE INDEX idx_notificacoes_usuario_lido ON public.notificacoes USING btree (usuario_id, lido)
// Table: respostas_captador
//   CREATE INDEX idx_respostas_captador_cap_id ON public.respostas_captador USING btree (captador_id)
//   CREATE INDEX idx_respostas_captador_dem_loc ON public.respostas_captador USING btree (demanda_locacao_id)
//   CREATE INDEX idx_respostas_captador_dem_ven ON public.respostas_captador USING btree (demanda_venda_id)
// Table: tenant_proposals
//   CREATE INDEX idx_tenant_proposals_property_id ON public.tenant_proposals USING btree (property_id)
// Table: users
//   CREATE INDEX idx_users_email ON public.users USING btree (email)
//   CREATE INDEX idx_users_role ON public.users USING btree (role)
//   CREATE INDEX idx_users_status ON public.users USING btree (status)
//   CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)
// Table: vistasoft_cache
//   CREATE INDEX idx_vistasoft_cache_expires_at ON public.vistasoft_cache USING btree (expires_at)
// Table: webhook_queue
//   CREATE INDEX idx_webhook_queue_status_created ON public.webhook_queue USING btree (status, created_at)

// --- MATERIALIZED VIEWS ---
// VIEW admin_dashboard_summary:
//   SELECT 1 AS id,
//       ( SELECT count(*) AS count
//              FROM demandas_locacao
//             WHERE ((demandas_locacao.status_demanda)::text = 'aberta'::text)) AS demandas_abertas,
//       ( SELECT count(*) AS count
//              FROM imoveis_captados
//             WHERE ((imoveis_captados.status_captacao)::text = 'capturado'::text)) AS imoveis_ativos,
//       ( SELECT COALESCE(sum(pontuacao_captador.pontos), (0)::bigint) AS "coalesce"
//              FROM pontuacao_captador) AS total_pontos,
//       ( SELECT count(DISTINCT COALESCE(imoveis_captados.user_captador_id, imoveis_captados.captador_id)) AS count
//              FROM imoveis_captados
//             WHERE (COALESCE(imoveis_captados.user_captador_id, imoveis_captados.captador_id) IS NOT NULL)) AS captadores_ativos,
//       now() AS last_updated;

