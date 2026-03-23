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
          id: string
          is_prioritaria: boolean | null
          localizacoes: string[] | null
          nivel_urgencia: string | null
          nome_cliente: string | null
          observacoes: string | null
          orcamento_max: number | null
          quartos: number | null
          sdr_id: string | null
          status_demanda: string | null
          telefone: string | null
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
          id?: string
          is_prioritaria?: boolean | null
          localizacoes?: string[] | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          observacoes?: string | null
          orcamento_max?: number | null
          quartos?: number | null
          sdr_id?: string | null
          status_demanda?: string | null
          telefone?: string | null
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
          id?: string
          is_prioritaria?: boolean | null
          localizacoes?: string[] | null
          nivel_urgencia?: string | null
          nome_cliente?: string | null
          observacoes?: string | null
          orcamento_max?: number | null
          quartos?: number | null
          sdr_id?: string | null
          status_demanda?: string | null
          telefone?: string | null
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
            foreignKeyName: "demandas_locacao_sdr_id_fkey"
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
        ]
      }
      imoveis_captados: {
        Row: {
          captador_id: string | null
          codigo_imovel: string | null
          comissao_percentual: number | null
          created_at: string | null
          demanda_locacao_id: string | null
          demanda_venda_id: string | null
          endereco: string | null
          fotos: string[] | null
          id: string
          localizacao_texto: string | null
          preco: number | null
          status_captacao: string | null
          updated_at: string | null
          user_captador_id: string | null
          valor: number | null
        }
        Insert: {
          captador_id?: string | null
          codigo_imovel?: string | null
          comissao_percentual?: number | null
          created_at?: string | null
          demanda_locacao_id?: string | null
          demanda_venda_id?: string | null
          endereco?: string | null
          fotos?: string[] | null
          id?: string
          localizacao_texto?: string | null
          preco?: number | null
          status_captacao?: string | null
          updated_at?: string | null
          user_captador_id?: string | null
          valor?: number | null
        }
        Update: {
          captador_id?: string | null
          codigo_imovel?: string | null
          comissao_percentual?: number | null
          created_at?: string | null
          demanda_locacao_id?: string | null
          demanda_venda_id?: string | null
          endereco?: string | null
          fotos?: string[] | null
          id?: string
          localizacao_texto?: string | null
          preco?: number | null
          status_captacao?: string | null
          updated_at?: string | null
          user_captador_id?: string | null
          valor?: number | null
        }
        Relationships: [
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
            foreignKeyName: "imoveis_captados_user_captador_id_fkey"
            columns: ["user_captador_id"]
            isOneToOne: false
            referencedRelation: "users"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atualizar_prazos_vencidos: { Args: never; Returns: undefined }
    }
    Enums: {
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
// Table: prazos_captacao
//   id: uuid (not null, default: gen_random_uuid())
//   demanda_locacao_id: uuid (nullable)
//   demanda_venda_id: uuid (nullable)
//   captador_id: uuid (nullable)
//   data_criacao: timestamp with time zone (nullable, default: now())
//   prazo_resposta: timestamp with time zone (not null)
//   prorrogacoes_usadas: integer (nullable, default: 0)
//   status: character varying (nullable, default: 'ativo'::character varying)
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
// Table: users
//   id: uuid (not null)
//   email: character varying (not null)
//   nome: character varying (not null)
//   role: user_role (not null, default: 'captador'::user_role)
//   bairros_trabalho: _text (nullable, default: '{}'::text[])
//   status: character varying (nullable, default: 'ativo'::character varying)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())

// --- CONSTRAINTS ---
// Table: audit_log
//   PRIMARY KEY audit_log_pkey: PRIMARY KEY (id)
//   FOREIGN KEY audit_log_usuario_id_fkey: FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL
// Table: demandas_locacao
//   CHECK check_valor_min_max_locacao: CHECK ((valor_maximo >= valor_minimo))
//   CHECK demandas_locacao_dormitorios_check: CHECK (((dormitorios >= 0) AND (dormitorios <= 10)))
//   CHECK demandas_locacao_email_check: CHECK (((email IS NULL) OR ((email)::text = ''::text) OR ((email)::text ~~ '%@%'::text)))
//   CHECK demandas_locacao_nivel_urgencia_check: CHECK (((nivel_urgencia)::text = ANY ((ARRAY['Baixa'::character varying, 'Média'::character varying, 'Alta'::character varying, 'Urgente'::character varying, 'Até 15 dias'::character varying, 'Até 30 dias'::character varying, 'Até 90 dias ou +'::character varying])::text[])))
//   PRIMARY KEY demandas_locacao_pkey: PRIMARY KEY (id)
//   FOREIGN KEY demandas_locacao_sdr_id_fkey: FOREIGN KEY (sdr_id) REFERENCES users(id) ON DELETE SET NULL
//   CHECK demandas_locacao_status_demanda_check: CHECK (((status_demanda)::text = ANY ((ARRAY['aberta'::character varying, 'atendida'::character varying, 'impossivel'::character varying, 'sem_resposta_24h'::character varying])::text[])))
//   CHECK demandas_locacao_telefone_check: CHECK (((telefone IS NULL) OR (((telefone)::text ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}'::text) AND (length((telefone)::text) = 15))))
//   CHECK demandas_locacao_vagas_estacionamento_check: CHECK (((vagas_estacionamento >= 0) AND (vagas_estacionamento <= 10)))
// Table: demandas_vendas
//   CHECK check_valor_min_max_vendas: CHECK ((valor_maximo >= valor_minimo))
//   FOREIGN KEY demandas_vendas_corretor_id_fkey: FOREIGN KEY (corretor_id) REFERENCES users(id) ON DELETE SET NULL
//   CHECK demandas_vendas_dormitorios_check: CHECK (((dormitorios >= 0) AND (dormitorios <= 10)))
//   CHECK demandas_vendas_email_check: CHECK (((email)::text ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+
::text))
//   CHECK demandas_vendas_nivel_urgencia_check: CHECK (((nivel_urgencia)::text = ANY ((ARRAY['Baixa'::character varying, 'Média'::character varying, 'Alta'::character varying, 'Urgente'::character varying, 'Até 15 dias'::character varying, 'Até 30 dias'::character varying, 'Até 90 dias ou +'::character varying])::text[])))
//   PRIMARY KEY demandas_vendas_pkey: PRIMARY KEY (id)
//   CHECK demandas_vendas_status_demanda_check: CHECK (((status_demanda)::text = ANY ((ARRAY['aberta'::character varying, 'atendida'::character varying, 'impossivel'::character varying, 'sem_resposta_24h'::character varying])::text[])))
//   CHECK demandas_vendas_telefone_check: CHECK (((telefone)::text ~ '^\([0-9]{2}\) 9[0-9]{4}-[0-9]{4}
::text))
//   CHECK demandas_vendas_tipo_imovel_check: CHECK (((tipo_imovel)::text = ANY ((ARRAY['Casa'::character varying, 'Apartamento'::character varying, 'Terreno'::character varying])::text[])))
//   CHECK demandas_vendas_vagas_estacionamento_check: CHECK (((vagas_estacionamento >= 0) AND (vagas_estacionamento <= 10)))
// Table: imoveis_captados
//   UNIQUE imoveis_captados_codigo_imovel_key: UNIQUE (codigo_imovel)
//   CHECK imoveis_captados_comissao_percentual_check: CHECK (((comissao_percentual >= (0)::numeric) AND (comissao_percentual <= (100)::numeric)))
//   FOREIGN KEY imoveis_captados_demanda_locacao_id_fkey: FOREIGN KEY (demanda_locacao_id) REFERENCES demandas_locacao(id) ON DELETE SET NULL
//   FOREIGN KEY imoveis_captados_demanda_venda_id_fkey: FOREIGN KEY (demanda_venda_id) REFERENCES demandas_vendas(id) ON DELETE SET NULL
//   PRIMARY KEY imoveis_captados_pkey: PRIMARY KEY (id)
//   CHECK imoveis_captados_preco_check: CHECK ((preco > (0)::numeric))
//   CHECK imoveis_captados_status_captacao_check: CHECK (((status_captacao)::text = ANY ((ARRAY['pendente'::character varying, 'capturado'::character varying, 'visitado'::character varying, 'fechado'::character varying, 'perdido'::character varying])::text[])))
//   FOREIGN KEY imoveis_captados_user_captador_id_fkey: FOREIGN KEY (user_captador_id) REFERENCES users(id) ON DELETE SET NULL
// Table: prazos_captacao
//   CHECK check_demanda_link_prazos: CHECK ((((demanda_locacao_id IS NOT NULL) AND (demanda_venda_id IS NULL)) OR ((demanda_locacao_id IS NULL) AND (demanda_venda_id IS NOT NULL))))
//   FOREIGN KEY prazos_captacao_captador_id_fkey: FOREIGN KEY (captador_id) REFERENCES users(id) ON DELETE SET NULL
//   FOREIGN KEY prazos_captacao_demanda_locacao_id_fkey: FOREIGN KEY (demanda_locacao_id) REFERENCES demandas_locacao(id) ON DELETE CASCADE
//   FOREIGN KEY prazos_captacao_demanda_venda_id_fkey: FOREIGN KEY (demanda_venda_id) REFERENCES demandas_vendas(id) ON DELETE CASCADE
//   PRIMARY KEY prazos_captacao_pkey: PRIMARY KEY (id)
//   CHECK prazos_captacao_status_check: CHECK (((status)::text = ANY ((ARRAY['ativo'::character varying, 'vencido'::character varying, 'respondido'::character varying, 'sem_resposta_24h'::character varying, 'sem_resposta_final'::character varying])::text[])))
// Table: respostas_captador
//   CHECK check_demanda_link_respostas: CHECK ((((demanda_locacao_id IS NOT NULL) AND (demanda_venda_id IS NULL)) OR ((demanda_locacao_id IS NULL) AND (demanda_venda_id IS NOT NULL))))
//   CHECK check_motivo_nao_encontrei: CHECK ((((resposta)::text = 'encontrei'::text) OR (((resposta)::text = 'nao_encontrei'::text) AND (motivo IS NOT NULL) AND (TRIM(BOTH FROM motivo) <> ''::text))))
//   FOREIGN KEY respostas_captador_captador_id_fkey: FOREIGN KEY (captador_id) REFERENCES users(id) ON DELETE CASCADE
//   FOREIGN KEY respostas_captador_demanda_locacao_id_fkey: FOREIGN KEY (demanda_locacao_id) REFERENCES demandas_locacao(id) ON DELETE CASCADE
//   FOREIGN KEY respostas_captador_demanda_venda_id_fkey: FOREIGN KEY (demanda_venda_id) REFERENCES demandas_vendas(id) ON DELETE CASCADE
//   PRIMARY KEY respostas_captador_pkey: PRIMARY KEY (id)
//   CHECK respostas_captador_resposta_check: CHECK (((resposta)::text = ANY ((ARRAY['encontrei'::character varying, 'nao_encontrei'::character varying])::text[])))
// Table: users
//   CHECK users_email_check: CHECK (((email)::text ~ '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+
::text))
//   UNIQUE users_email_key: UNIQUE (email)
//   FOREIGN KEY users_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY users_pkey: PRIMARY KEY (id)
//   CHECK users_status_check: CHECK (((status)::text = ANY ((ARRAY['ativo'::character varying, 'inativo'::character varying])::text[])))

// --- ROW LEVEL SECURITY POLICIES ---
// Table: audit_log
//   Policy "Admin sees audit log" (ALL, PERMISSIVE) roles={authenticated}
//     USING: ((((current_setting('request.jwt.claims'::text, true))::jsonb -> 'user_metadata'::text) ->> 'role'::text) = ANY (ARRAY['admin'::text, 'gestor'::text]))
// Table: demandas_locacao
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
//     WITH CHECK: ((sdr_id = auth.uid()) AND (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'sdr'::user_role)))))
//   Policy "SDRs manage own locacao" (ALL, PERMISSIVE) roles={public}
//     USING: ((sdr_id = auth.uid()) AND (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'sdr'::user_role)))))
// Table: demandas_vendas
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
// Table: imoveis_captados
//   Policy "Authenticated users can read all captures" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Captadores insert captures" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Corretores update captures linked to own vendas demands" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "SDRs update captures linked to own locacao demands" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: prazos_captacao
//   Policy "All users can read prazos" (SELECT, PERMISSIVE) roles={public}
//     USING: true
//   Policy "Captadores can insert prazos" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: true
//   Policy "Captadores can update prazos" (UPDATE, PERMISSIVE) roles={public}
//     USING: true
// Table: respostas_captador
//   Policy "Admin sees all respostas" (ALL, PERMISSIVE) roles={public}
//     USING: (EXISTS ( SELECT 1    FROM users   WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::user_role))))
//   Policy "Authenticated read respostas" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Captadores insert respostas" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (captador_id = auth.uid())
//   Policy "Captadores manage own respostas" (ALL, PERMISSIVE) roles={public}
//     USING: (captador_id = auth.uid())
// Table: users
//   Policy "Authenticated users can read users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Users see own profile" (SELECT, PERMISSIVE) roles={public}
//     USING: (id = auth.uid())
//   Policy "Users update own profile" (UPDATE, PERMISSIVE) roles={public}
//     USING: (id = auth.uid())

// --- DATABASE FUNCTIONS ---
// FUNCTION atualizar_prazos_vencidos()
//   CREATE OR REPLACE FUNCTION public.atualizar_prazos_vencidos()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       UPDATE public.prazos_captacao
//       SET status = 'sem_resposta_24h'
//       WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas = 0;
//       
//       UPDATE public.prazos_captacao
//       SET status = 'sem_resposta_final'
//       WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas >= 3;
//   
//       UPDATE public.prazos_captacao
//       SET status = 'vencido'
//       WHERE status = 'ativo' AND prazo_resposta <= NOW() AND prorrogacoes_usadas > 0 AND prorrogacoes_usadas < 3;
//   
//       UPDATE public.demandas_locacao dl
//       SET status_demanda = 'sem_resposta_24h'
//       FROM public.prazos_captacao pc
//       WHERE dl.id = pc.demanda_locacao_id AND pc.status IN ('sem_resposta_24h', 'sem_resposta_final') AND dl.status_demanda = 'aberta';
//   
//       UPDATE public.demandas_vendas dv
//       SET status_demanda = 'sem_resposta_24h'
//       FROM public.prazos_captacao pc
//       WHERE dv.id = pc.demanda_venda_id AND pc.status IN ('sem_resposta_24h', 'sem_resposta_final') AND dv.status_demanda = 'aberta';
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
//   BEGIN
//       user_id_val := auth.uid();
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

// --- TRIGGERS ---
// Table: demandas_locacao
//   audit_demandas_locacao: CREATE TRIGGER audit_demandas_locacao AFTER INSERT OR DELETE OR UPDATE ON public.demandas_locacao FOR EACH ROW EXECUTE FUNCTION audit_log_function()
//   criar_prazo_locacao_trigger: CREATE TRIGGER criar_prazo_locacao_trigger AFTER INSERT ON public.demandas_locacao FOR EACH ROW EXECUTE FUNCTION criar_prazo_captacao()
//   update_demandas_locacao_updated_at: CREATE TRIGGER update_demandas_locacao_updated_at BEFORE UPDATE ON public.demandas_locacao FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: demandas_vendas
//   audit_demandas_vendas: CREATE TRIGGER audit_demandas_vendas AFTER INSERT OR DELETE OR UPDATE ON public.demandas_vendas FOR EACH ROW EXECUTE FUNCTION audit_log_function()
//   criar_prazo_vendas_trigger: CREATE TRIGGER criar_prazo_vendas_trigger AFTER INSERT ON public.demandas_vendas FOR EACH ROW EXECUTE FUNCTION criar_prazo_captacao()
//   update_demandas_vendas_updated_at: CREATE TRIGGER update_demandas_vendas_updated_at BEFORE UPDATE ON public.demandas_vendas FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: imoveis_captados
//   audit_imoveis_captados: CREATE TRIGGER audit_imoveis_captados AFTER INSERT OR DELETE OR UPDATE ON public.imoveis_captados FOR EACH ROW EXECUTE FUNCTION audit_log_function()
//   marcar_prazo_imovel_trigger: CREATE TRIGGER marcar_prazo_imovel_trigger AFTER INSERT ON public.imoveis_captados FOR EACH ROW EXECUTE FUNCTION marcar_prazo_respondido_imovel()
//   update_imoveis_captados_updated_at: CREATE TRIGGER update_imoveis_captados_updated_at BEFORE UPDATE ON public.imoveis_captados FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: respostas_captador
//   marcar_prazo_resposta_trigger: CREATE TRIGGER marcar_prazo_resposta_trigger AFTER INSERT ON public.respostas_captador FOR EACH ROW EXECUTE FUNCTION marcar_prazo_respondido_resposta()
//   update_respostas_captador_updated_at: CREATE TRIGGER update_respostas_captador_updated_at BEFORE UPDATE ON public.respostas_captador FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: users
//   audit_users: CREATE TRIGGER audit_users AFTER INSERT OR DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION audit_log_function()
//   update_users_updated_at: CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION set_updated_at()

// --- INDEXES ---
// Table: demandas_locacao
//   CREATE INDEX idx_demandas_locacao_bairros ON public.demandas_locacao USING gin (bairros)
//   CREATE INDEX idx_demandas_locacao_sdr_id ON public.demandas_locacao USING btree (sdr_id)
//   CREATE INDEX idx_demandas_locacao_status_demanda ON public.demandas_locacao USING btree (status_demanda)
// Table: demandas_vendas
//   CREATE INDEX idx_demandas_vendas_bairros ON public.demandas_vendas USING gin (bairros)
//   CREATE INDEX idx_demandas_vendas_corretor_id ON public.demandas_vendas USING btree (corretor_id)
//   CREATE INDEX idx_demandas_vendas_status_demanda ON public.demandas_vendas USING btree (status_demanda)
// Table: imoveis_captados
//   CREATE INDEX idx_imoveis_captados_status_captacao ON public.imoveis_captados USING btree (status_captacao)
//   CREATE INDEX idx_imoveis_captados_user_captador_id ON public.imoveis_captados USING btree (user_captador_id)
//   CREATE UNIQUE INDEX imoveis_captados_codigo_imovel_key ON public.imoveis_captados USING btree (codigo_imovel)
// Table: respostas_captador
//   CREATE INDEX idx_respostas_captador_cap_id ON public.respostas_captador USING btree (captador_id)
//   CREATE INDEX idx_respostas_captador_dem_loc ON public.respostas_captador USING btree (demanda_locacao_id)
//   CREATE INDEX idx_respostas_captador_dem_ven ON public.respostas_captador USING btree (demanda_venda_id)
// Table: users
//   CREATE INDEX idx_users_email ON public.users USING btree (email)
//   CREATE INDEX idx_users_role ON public.users USING btree (role)
//   CREATE INDEX idx_users_status ON public.users USING btree (status)
//   CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)

