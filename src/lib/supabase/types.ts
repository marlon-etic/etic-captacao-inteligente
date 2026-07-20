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
      acompanhamento_diario: {
        Row: {
          clientes_em_fechamento: number | null
          clientes_em_visita: number | null
          created_at: string | null
          data_checkin: string
          demandas_atualizadas: Json | null
          id: string
          novas_demandas_dia: number | null
          observacoes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clientes_em_fechamento?: number | null
          clientes_em_visita?: number | null
          created_at?: string | null
          data_checkin?: string
          demandas_atualizadas?: Json | null
          id?: string
          novas_demandas_dia?: number | null
          observacoes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clientes_em_fechamento?: number | null
          clientes_em_visita?: number | null
          created_at?: string | null
          data_checkin?: string
          demandas_atualizadas?: Json | null
          id?: string
          novas_demandas_dia?: number | null
          observacoes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acompanhamento_diario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acompanhamento_diario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acompanhamento_diario_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_email_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          metrics_data: Json | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metrics_data?: Json | null
          sent_at?: string | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metrics_data?: Json | null
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          period: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          period?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          period?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
          {
            foreignKeyName: "audit_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          bairro_alvo: string | null
          bairros_alvo: string[] | null
          created_at: string
          data_fim: string
          data_inicio: string
          faixa_valor_max: number
          faixa_valor_min: number
          id: string
          meta: number
          progresso: number
          status: string
          tipo_imovel: string
          updated_at: string
        }
        Insert: {
          bairro_alvo?: string | null
          bairros_alvo?: string[] | null
          created_at?: string
          data_fim: string
          data_inicio?: string
          faixa_valor_max?: number
          faixa_valor_min?: number
          id?: string
          meta?: number
          progresso?: number
          status?: string
          tipo_imovel: string
          updated_at?: string
        }
        Update: {
          bairro_alvo?: string | null
          bairros_alvo?: string[] | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          faixa_valor_max?: number
          faixa_valor_min?: number
          id?: string
          meta?: number
          progresso?: number
          status?: string
          tipo_imovel?: string
          updated_at?: string
        }
        Relationships: []
      }
      campanhas_historico: {
        Row: {
          campanha_id: string
          data_fechamento: string
          faixa_valor: Json
          id: string
          tipo_imovel: string
          total_captadores: number
          total_imoveis: number
        }
        Insert: {
          campanha_id: string
          data_fechamento?: string
          faixa_valor: Json
          id?: string
          tipo_imovel: string
          total_captadores?: number
          total_imoveis?: number
        }
        Update: {
          campanha_id?: string
          data_fechamento?: string
          faixa_valor?: Json
          id?: string
          tipo_imovel?: string
          total_captadores?: number
          total_imoveis?: number
        }
        Relationships: []
      }
      campanhas_imoveis: {
        Row: {
          campanha_id: string
          captador_id: string | null
          data_adicionado: string
          id: string
          imovel_id: string
        }
        Insert: {
          campanha_id: string
          captador_id?: string | null
          data_adicionado?: string
          id?: string
          imovel_id: string
        }
        Update: {
          campanha_id?: string
          captador_id?: string | null
          data_adicionado?: string
          id?: string
          imovel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_imoveis_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_imoveis_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_imoveis_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_imoveis_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_imoveis_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_captados"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas_imoveis_descartados: {
        Row: {
          campanha_id: string
          created_at: string
          id: string
          imovel_id: string
        }
        Insert: {
          campanha_id: string
          created_at?: string
          id?: string
          imovel_id: string
        }
        Update: {
          campanha_id?: string
          created_at?: string
          id?: string
          imovel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_imoveis_descartados_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanhas_imoveis_descartados_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_captados"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_execution_log: {
        Row: {
          error_message: string | null
          executed_at: string | null
          id: number
          status: string
        }
        Insert: {
          error_message?: string | null
          executed_at?: string | null
          id?: number
          status: string
        }
        Update: {
          error_message?: string | null
          executed_at?: string | null
          id?: number
          status?: string
        }
        Relationships: []
      }
      demand_status_log: {
        Row: {
          alterado_por: string | null
          created_at: string
          demanda_id: string
          id: string
          status_anterior: string | null
          status_novo: string
          tipo_demanda: string
        }
        Insert: {
          alterado_por?: string | null
          created_at?: string
          demanda_id: string
          id?: string
          status_anterior?: string | null
          status_novo: string
          tipo_demanda: string
        }
        Update: {
          alterado_por?: string | null
          created_at?: string
          demanda_id?: string
          id?: string
          status_anterior?: string | null
          status_novo?: string
          tipo_demanda?: string
        }
        Relationships: []
      }
      demandas_locacao: {
        Row: {
          bairros: string[] | null
          banheiros: number | null
          captadores_busca: Json | null
          cliente_em_fechamento: boolean | null
          cliente_em_visita: boolean | null
          cliente_nome: string | null
          created_at: string | null
          data_check_status: string | null
          data_fechamento: string | null
          data_marcacao_sem_resposta: string | null
          data_prazo_resposta: string | null
          data_primeira_resposta: string | null
          dormitorios: number | null
          email: string | null
          grupo_id: string | null
          id: string
          is_prioritaria: boolean | null
          is_test_data: boolean | null
          links_sugeridos: Json | null
          localizacoes: string[] | null
          marcada_sem_resposta: boolean | null
          motivo_perda: string | null
          motivo_perda_descricao: string | null
          motivo_priorizacao: string | null
          nivel_urgencia: string | null
          nome_cliente: string | null
          observacoes: string | null
          orcamento_max: number | null
          prorrogacoes_count: number | null
          quartos: number | null
          renda_mensal_estimada: number | null
          sdr_id: string | null
          status_demanda: string | null
          telefone: string | null
          tenant_score: number | null
          tipo: string | null
          tipo_demanda: string | null
          tipo_imovel: string | null
          updated_at: string | null
          urgencia: string | null
          vagas: number | null
          vagas_estacionamento: number | null
          valor_maximo: number | null
          valor_minimo: number | null
          vinculacao_captador_id: string | null
        }
        Insert: {
          bairros?: string[] | null
          banheiros?: number | null
          captadores_busca?: Json | null
          cliente_em_fechamento?: boolean | null
          cliente_em_visita?: boolean | null
          cliente_nome?: string | null
          created_at?: string | null
          data_check_status?: string | null
          data_fechamento?: string | null
          data_marcacao_sem_resposta?: string | null
          data_prazo_resposta?: string | null
          data_primeira_resposta?: string | null
          dormitorios?: number | null
          email?: string | null
          grupo_id?: string | null
          id?: string
          is_prioritaria?: boolean | null
          is_test_data?: boolean | null
          links_sugeridos?: Json | null
          localizacoes?: string[] | null
          marcada_sem_resposta?: boolean | null
          motivo_perda?: string | null
          motivo_perda_descricao?: string | null
          motivo_priorizacao?: string | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          observacoes?: string | null
          orcamento_max?: number | null
          prorrogacoes_count?: number | null
          quartos?: number | null
          renda_mensal_estimada?: number | null
          sdr_id?: string | null
          status_demanda?: string | null
          telefone?: string | null
          tenant_score?: number | null
          tipo?: string | null
          tipo_demanda?: string | null
          tipo_imovel?: string | null
          updated_at?: string | null
          urgencia?: string | null
          vagas?: number | null
          vagas_estacionamento?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
          vinculacao_captador_id?: string | null
        }
        Update: {
          bairros?: string[] | null
          banheiros?: number | null
          captadores_busca?: Json | null
          cliente_em_fechamento?: boolean | null
          cliente_em_visita?: boolean | null
          cliente_nome?: string | null
          created_at?: string | null
          data_check_status?: string | null
          data_fechamento?: string | null
          data_marcacao_sem_resposta?: string | null
          data_prazo_resposta?: string | null
          data_primeira_resposta?: string | null
          dormitorios?: number | null
          email?: string | null
          grupo_id?: string | null
          id?: string
          is_prioritaria?: boolean | null
          is_test_data?: boolean | null
          links_sugeridos?: Json | null
          localizacoes?: string[] | null
          marcada_sem_resposta?: boolean | null
          motivo_perda?: string | null
          motivo_perda_descricao?: string | null
          motivo_priorizacao?: string | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          observacoes?: string | null
          orcamento_max?: number | null
          prorrogacoes_count?: number | null
          quartos?: number | null
          renda_mensal_estimada?: number | null
          sdr_id?: string | null
          status_demanda?: string | null
          telefone?: string | null
          tenant_score?: number | null
          tipo?: string | null
          tipo_demanda?: string | null
          tipo_imovel?: string | null
          updated_at?: string | null
          urgencia?: string | null
          vagas?: number | null
          vagas_estacionamento?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
          vinculacao_captador_id?: string | null
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
            foreignKeyName: "demandas_locacao_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_locacao_sdr_id_fkey"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_demandas_locacao_sdr"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_demandas_locacao_sdr"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_demandas_locacao_sdr"
            columns: ["sdr_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
            referencedColumns: ["id"]
          },
        ]
      }
      demandas_vendas: {
        Row: {
          bairros: string[] | null
          banheiros: number | null
          captadores_busca: Json | null
          cliente_em_fechamento: boolean | null
          cliente_em_visita: boolean | null
          cliente_nome: string | null
          corretor_id: string | null
          created_at: string | null
          data_check_status: string | null
          data_fechamento: string | null
          data_marcacao_sem_resposta: string | null
          data_prazo_resposta: string | null
          data_primeira_resposta: string | null
          dormitorios: number | null
          email: string | null
          grupo_id: string | null
          id: string
          is_prioritaria: boolean | null
          is_test_data: boolean | null
          links_sugeridos: Json | null
          localizacoes: string[] | null
          marcada_sem_resposta: boolean | null
          motivo_perda: string | null
          motivo_perda_descricao: string | null
          motivo_priorizacao: string | null
          necessidades_especificas: string | null
          nivel_urgencia: string | null
          nome_cliente: string | null
          orcamento_max: number | null
          prorrogacoes_count: number | null
          quartos: number | null
          status_demanda: string | null
          telefone: string | null
          tipo: string | null
          tipo_imovel: string | null
          updated_at: string | null
          urgencia: string | null
          vagas: number | null
          vagas_estacionamento: number | null
          valor_maximo: number | null
          valor_minimo: number | null
          vinculacao_captador_id: string | null
        }
        Insert: {
          bairros?: string[] | null
          banheiros?: number | null
          captadores_busca?: Json | null
          cliente_em_fechamento?: boolean | null
          cliente_em_visita?: boolean | null
          cliente_nome?: string | null
          corretor_id?: string | null
          created_at?: string | null
          data_check_status?: string | null
          data_fechamento?: string | null
          data_marcacao_sem_resposta?: string | null
          data_prazo_resposta?: string | null
          data_primeira_resposta?: string | null
          dormitorios?: number | null
          email?: string | null
          grupo_id?: string | null
          id?: string
          is_prioritaria?: boolean | null
          is_test_data?: boolean | null
          links_sugeridos?: Json | null
          localizacoes?: string[] | null
          marcada_sem_resposta?: boolean | null
          motivo_perda?: string | null
          motivo_perda_descricao?: string | null
          motivo_priorizacao?: string | null
          necessidades_especificas?: string | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          orcamento_max?: number | null
          prorrogacoes_count?: number | null
          quartos?: number | null
          status_demanda?: string | null
          telefone?: string | null
          tipo?: string | null
          tipo_imovel?: string | null
          updated_at?: string | null
          urgencia?: string | null
          vagas?: number | null
          vagas_estacionamento?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
          vinculacao_captador_id?: string | null
        }
        Update: {
          bairros?: string[] | null
          banheiros?: number | null
          captadores_busca?: Json | null
          cliente_em_fechamento?: boolean | null
          cliente_em_visita?: boolean | null
          cliente_nome?: string | null
          corretor_id?: string | null
          created_at?: string | null
          data_check_status?: string | null
          data_fechamento?: string | null
          data_marcacao_sem_resposta?: string | null
          data_prazo_resposta?: string | null
          data_primeira_resposta?: string | null
          dormitorios?: number | null
          email?: string | null
          grupo_id?: string | null
          id?: string
          is_prioritaria?: boolean | null
          is_test_data?: boolean | null
          links_sugeridos?: Json | null
          localizacoes?: string[] | null
          marcada_sem_resposta?: boolean | null
          motivo_perda?: string | null
          motivo_perda_descricao?: string | null
          motivo_priorizacao?: string | null
          necessidades_especificas?: string | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          orcamento_max?: number | null
          prorrogacoes_count?: number | null
          quartos?: number | null
          status_demanda?: string | null
          telefone?: string | null
          tipo?: string | null
          tipo_imovel?: string | null
          updated_at?: string | null
          urgencia?: string | null
          vagas?: number | null
          vagas_estacionamento?: number | null
          valor_maximo?: number | null
          valor_minimo?: number | null
          vinculacao_captador_id?: string | null
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
            foreignKeyName: "demandas_vendas_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandas_vendas_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
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
      fechamentos: {
        Row: {
          created_at: string | null
          data_prevista: string | null
          demanda_id: string
          id: string
          imovel_id: string | null
          is_test_data: boolean | null
          status: string | null
          tipo_demanda: string
          user_sdr_id: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          data_prevista?: string | null
          demanda_id: string
          id?: string
          imovel_id?: string | null
          is_test_data?: boolean | null
          status?: string | null
          tipo_demanda: string
          user_sdr_id: string
          valor: number
        }
        Update: {
          created_at?: string | null
          data_prevista?: string | null
          demanda_id?: string
          id?: string
          imovel_id?: string | null
          is_test_data?: boolean | null
          status?: string | null
          tipo_demanda?: string
          user_sdr_id?: string
          valor?: number
        }
        Relationships: []
      }
      feedback_records: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          interest_level: string
          property_link_id: string
          sdr_user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          interest_level: string
          property_link_id: string
          sdr_user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          interest_level?: string
          property_link_id?: string
          sdr_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_records_property_link_id_fkey"
            columns: ["property_link_id"]
            isOneToOne: false
            referencedRelation: "imovel_demand_match"
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
          banheiros: number | null
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
          is_test_data: boolean | null
          landlord_id: string | null
          localizacao_texto: string | null
          observacoes: string | null
          preco: number | null
          status_captacao: string | null
          status_revisao: string | null
          tipo: string | null
          tipo_imovel: string | null
          updated_at: string | null
          user_captador_id: string | null
          vagas: number | null
          valor: number | null
        }
        Insert: {
          banheiros?: number | null
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
          is_test_data?: boolean | null
          landlord_id?: string | null
          localizacao_texto?: string | null
          observacoes?: string | null
          preco?: number | null
          status_captacao?: string | null
          status_revisao?: string | null
          tipo?: string | null
          tipo_imovel?: string | null
          updated_at?: string | null
          user_captador_id?: string | null
          vagas?: number | null
          valor?: number | null
        }
        Update: {
          banheiros?: number | null
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
          is_test_data?: boolean | null
          landlord_id?: string | null
          localizacao_texto?: string | null
          observacoes?: string | null
          preco?: number | null
          status_captacao?: string | null
          status_revisao?: string | null
          tipo?: string | null
          tipo_imovel?: string | null
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
            foreignKeyName: "fk_imoveis_captador"
            columns: ["user_captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_imoveis_captador"
            columns: ["user_captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
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
          {
            foreignKeyName: "imoveis_captados_user_captador_id_fkey"
            columns: ["user_captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_captados_user_captador_id_fkey"
            columns: ["user_captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
            referencedColumns: ["id"]
          },
        ]
      }
      imoveis_captados_backup: {
        Row: {
          banheiros: number | null
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
          id: string | null
          landlord_id: string | null
          localizacao_texto: string | null
          observacoes: string | null
          preco: number | null
          status_captacao: string | null
          status_revisao: string | null
          tipo: string | null
          tipo_imovel: string | null
          updated_at: string | null
          user_captador_id: string | null
          vagas: number | null
          valor: number | null
        }
        Insert: {
          banheiros?: number | null
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
          id?: string | null
          landlord_id?: string | null
          localizacao_texto?: string | null
          observacoes?: string | null
          preco?: number | null
          status_captacao?: string | null
          status_revisao?: string | null
          tipo?: string | null
          tipo_imovel?: string | null
          updated_at?: string | null
          user_captador_id?: string | null
          vagas?: number | null
          valor?: number | null
        }
        Update: {
          banheiros?: number | null
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
          id?: string | null
          landlord_id?: string | null
          localizacao_texto?: string | null
          observacoes?: string | null
          preco?: number | null
          status_captacao?: string | null
          status_revisao?: string | null
          tipo?: string | null
          tipo_imovel?: string | null
          updated_at?: string | null
          user_captador_id?: string | null
          vagas?: number | null
          valor?: number | null
        }
        Relationships: []
      }
      imovel_demand_match: {
        Row: {
          captador_id: string | null
          compatibilidade_pct: number | null
          created_at: string | null
          data_vinculacao: string | null
          demanda_id: string | null
          id: string
          imovel_id: string | null
          tipo_demanda: string | null
          tipo_vinculacao: string | null
        }
        Insert: {
          captador_id?: string | null
          compatibilidade_pct?: number | null
          created_at?: string | null
          data_vinculacao?: string | null
          demanda_id?: string | null
          id?: string
          imovel_id?: string | null
          tipo_demanda?: string | null
          tipo_vinculacao?: string | null
        }
        Update: {
          captador_id?: string | null
          compatibilidade_pct?: number | null
          created_at?: string | null
          data_vinculacao?: string | null
          demanda_id?: string | null
          id?: string
          imovel_id?: string | null
          tipo_demanda?: string | null
          tipo_vinculacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imovel_demand_match_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_captados"
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
      matches_sugestoes: {
        Row: {
          created_at: string | null
          demanda_id: string
          demanda_tipo: string
          id: string
          imovel_id: string
          score: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          demanda_id: string
          demanda_tipo: string
          id?: string
          imovel_id: string
          score: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          demanda_id?: string
          demanda_tipo?: string
          id?: string
          imovel_id?: string
          score?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_sugestoes_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis_captados"
            referencedColumns: ["id"]
          },
        ]
      }
      negotiation_records: {
        Row: {
          created_at: string
          id: string
          negotiated_by_user_id: string
          negotiation_date: string
          negotiation_status: string
          notes: string | null
          property_link_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          negotiated_by_user_id: string
          negotiation_date?: string
          negotiation_status: string
          notes?: string | null
          property_link_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          negotiated_by_user_id?: string
          negotiation_date?: string
          negotiation_status?: string
          notes?: string | null
          property_link_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiation_records_property_link_id_fkey"
            columns: ["property_link_id"]
            isOneToOne: false
            referencedRelation: "imovel_demand_match"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
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
            foreignKeyName: "pontuacao_captador_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontuacao_captador_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
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
            foreignKeyName: "prazos_captacao_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prazos_captacao_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
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
            foreignKeyName: "respostas_captador_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_captadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_captador_captador_id_fkey"
            columns: ["captador_id"]
            isOneToOne: false
            referencedRelation: "vw_engajamento_sdr_corretor"
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
      resumo_diario_sdr: {
        Row: {
          conversao_pct: number | null
          criado_em: string | null
          data: string
          fechamentos: number | null
          id: string
          novos_clientes: number | null
          user_id: string
          visitas: number | null
        }
        Insert: {
          conversao_pct?: number | null
          criado_em?: string | null
          data?: string
          fechamentos?: number | null
          id?: string
          novos_clientes?: number | null
          user_id: string
          visitas?: number | null
        }
        Update: {
          conversao_pct?: number | null
          criado_em?: string | null
          data?: string
          fechamentos?: number | null
          id?: string
          novos_clientes?: number | null
          user_id?: string
          visitas?: number | null
        }
        Relationships: []
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
      visit_records: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          property_link_id: string
          sdr_user_id: string
          updated_at: string
          visited_at: string
          visited_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          property_link_id: string
          sdr_user_id: string
          updated_at?: string
          visited_at?: string
          visited_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          property_link_id?: string
          sdr_user_id?: string
          updated_at?: string
          visited_at?: string
          visited_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_records_property_link_id_fkey"
            columns: ["property_link_id"]
            isOneToOne: false
            referencedRelation: "imovel_demand_match"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas_imovel: {
        Row: {
          created_at: string | null
          data_visita: string | null
          demanda_id: string
          id: string
          imovel_id: string | null
          novo_imovel_endereco: string | null
          novo_imovel_valor: number | null
          qtd_imoveis_visitados: number | null
          tipo_demanda: string
          user_sdr_id: string
        }
        Insert: {
          created_at?: string | null
          data_visita?: string | null
          demanda_id: string
          id?: string
          imovel_id?: string | null
          novo_imovel_endereco?: string | null
          novo_imovel_valor?: number | null
          qtd_imoveis_visitados?: number | null
          tipo_demanda: string
          user_sdr_id: string
        }
        Update: {
          created_at?: string | null
          data_visita?: string | null
          demanda_id?: string
          id?: string
          imovel_id?: string | null
          novo_imovel_endereco?: string | null
          novo_imovel_valor?: number | null
          qtd_imoveis_visitados?: number | null
          tipo_demanda?: string
          user_sdr_id?: string
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
      vw_demandas_perdidas: {
        Row: {
          bairros: string[] | null
          created_at: string | null
          id: string | null
          nivel_urgencia: string | null
          nome_cliente: string | null
          status_demanda: string | null
          tipo: string | null
          valor_maximo: number | null
        }
        Relationships: []
      }
      vw_demandas_sem_retorno: {
        Row: {
          cliente_nome: string | null
          data_criacao: string | null
          data_vencimento: string | null
          demanda_id: string | null
          horas_sem_resposta: number | null
          status_atual: string | null
          status_urgencia: string | null
          tipo_demanda: string | null
        }
        Relationships: []
      }
      vw_engajamento_captadores: {
        Row: {
          captador_nome: string | null
          data_relatorio: string | null
          demandas_sem_resposta_24h: number | null
          id: string | null
          imoveis_captados_hoje: number | null
          imoveis_livres: number | null
          imoveis_sob_demanda: number | null
          taxa_resposta_percentual: number | null
        }
        Relationships: []
      }
      vw_engajamento_sdr_corretor: {
        Row: {
          clientes_em_fechamento: number | null
          clientes_em_visita: number | null
          data_relatorio: string | null
          demandas_locacao_hoje: number | null
          demandas_locacao_mes: number | null
          demandas_locacao_semana: number | null
          demandas_vendas_hoje: number | null
          demandas_vendas_mes: number | null
          demandas_vendas_semana: number | null
          id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          sdr_corretor_nome: string | null
        }
        Relationships: []
      }
      vw_foco_captacao_v6: {
        Row: {
          bairro_alvo: string | null
          qtd_clientes_aguardando: number | null
          ticket_medio: number | null
          tipo: string | null
          tipo_imovel: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      append_captador_busca: {
        Args: {
          p_captador_id: string
          p_demanda_id: string
          p_nome: string
          p_regiao: string
          p_tipo_demanda: string
        }
        Returns: undefined
      }
      atualizar_prazos_vencidos: { Args: never; Returns: undefined }
      calculate_imovel_demand_match: {
        Args: {
          p_demanda_id: string
          p_imovel_id: string
          p_tipo_demanda: string
        }
        Returns: Json
      }
      cleanup_old_analytics: { Args: never; Returns: undefined }
      cleanup_old_email_logs: { Args: never; Returns: undefined }
      escalate_lost_demand: {
        Args: { p_demanda_id: string; p_tipo_demanda: string }
        Returns: undefined
      }
      fn_arquivar_demandas_inativas: { Args: never; Returns: undefined }
      fn_auto_fix_test_users: { Args: never; Returns: Json }
      fn_calcular_tenant_score: {
        Args: { p_renda_mensal: number; p_valor_aluguel: number }
        Returns: number
      }
      fn_clean_expired_cache: { Args: never; Returns: undefined }
      fn_cleanup_inactive_demands: { Args: never; Returns: Json }
      fn_close_expired_campanhas: { Args: never; Returns: undefined }
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
      fn_escalate_all_expired_demands: { Args: never; Returns: undefined }
      fn_executar_marcar_demandas_cron: { Args: never; Returns: undefined }
      fn_gerar_match_inteligente_v4: {
        Args: { p_imovel_id: string }
        Returns: undefined
      }
      fn_gerar_match_inteligente_v6: {
        Args: { p_imovel_id: string }
        Returns: undefined
      }
      fn_get_foco_demandas: {
        Args: { p_bairro?: string; p_tipo?: string; p_tipo_imovel?: string }
        Returns: {
          bairros: string[]
          created_at: string
          dormitorios: number
          email: string
          id: string
          localizacoes: string[]
          nivel_urgencia: string
          nome_cliente: string
          observacoes: string
          orcamento_max: number
          quartos: number
          status_demanda: string
          telefone: string
          tipo: string
          tipo_imovel: string
          vagas: number
          valor_maximo: number
        }[]
      }
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
      fn_marcar_demandas_perdidas_inatividade: {
        Args: never
        Returns: undefined
      }
      fn_marcar_demandas_sem_resposta: {
        Args: never
        Returns: {
          qtd_marcadas: number
          tabela: string
        }[]
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
      fn_prorrogar_prazo: {
        Args: { p_demanda_id: string; p_horas: number; p_tipo_demanda: string }
        Returns: Json
      }
      fn_recalcular_pontos_captadores: { Args: never; Returns: Json }
      fn_reset_database: { Args: { p_delete_before?: string }; Returns: Json }
      fn_test_notifications_flow: { Args: never; Returns: undefined }
      get_imovel_matches: {
        Args: { p_imovel_id: string }
        Returns: {
          bairros: string[]
          budget: number
          cliente_nome: string
          compatibilidade_pct: number
          demanda_id: string
          imovel_id: string
          match_status: string
          motivo: string
          orcamento: number
          score: number
          specs: string
          tipo: string
        }[]
      }
      get_quick_matches: {
        Args: {
          p_dormitorios: number
          p_endereco: string
          p_preco: number
          p_tipo: string
          p_tipo_imovel: string
          p_vagas: number
        }
        Returns: {
          id: string
          nome: string
        }[]
      }
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
        | "visita_registrada"
        | "feedback_registrado"
        | "negociacao_registrada"
      user_role: "admin" | "sdr" | "corretor" | "captador" | "gestor"
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
        "visita_registrada",
        "feedback_registrado",
        "negociacao_registrada",
      ],
      user_role: ["admin", "sdr", "corretor", "captador", "gestor"],
    },
  },
} as const

