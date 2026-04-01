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
          vinculacao_captador_id: string | null
          captadores_busca: Json[] | null
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
          vinculacao_captador_id?: string | null
          captadores_busca?: Json[] | null
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
          vinculacao_captador_id?: string | null
          captadores_busca?: Json[] | null
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
          vinculacao_captador_id: string | null
          captadores_busca: Json[] | null
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
          vinculacao_captador_id?: string | null
          captadores_busca?: Json[] | null
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
          vinculacao_captador_id?: string | null
          captadores_busca?: Json[] | null
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
      zerar_testes: { Args: never; Returns: undefined }
      append_captador_busca: {
        Args: {
          p_demanda_id: string
          p_tipo_demanda: string
          p_captador_id: string
          p_nome: string
          p_regiao: string
        }
        Returns: undefined
      }
    }
    Enums: {
      notificacao_prioridade: "alta" | "normal" | "baixa"
      notificacao_tipo:
        | "nova_demanda"
        | "novo_imovel"
        | "imovel_capturado"
        | "status_atualizado"
        | "busca_iniciada_outros"
        | "busca_iniciada_responsavel"
        | "busca_iniciada_admin"
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
        "busca_iniciada_outros",
        "busca_iniciada_responsavel",
        "busca_iniciada_admin",
      ],
      user_role: ["admin", "sdr", "corretor", "captador"],
    },
  },
} as const
