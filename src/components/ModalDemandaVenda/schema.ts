import { z } from 'zod'

export const formSchema = z
  .object({
    nome_cliente: z.string().min(1, 'Nome do cliente é obrigatório').max(100),
    telefone: z
      .string()
      .regex(/^\+?[0-9\s\-()]{8,}$/, 'Telefone inválido. Use um formato válido.')
      .optional()
      .or(z.literal('')),
    tipo_imovel: z.array(z.string()).min(1, 'Selecione pelo menos um tipo de imóvel'),
    bairros: z
      .array(z.string())
      .min(1, 'Selecione pelo menos um bairro')
      .max(20, 'Máximo de 20 bairros'),
    valor_minimo: z.coerce.number().min(0).optional().or(z.literal('')),
    valor_maximo: z.coerce.number().min(0).optional().or(z.literal('')),
    dormitorios: z.coerce.number().min(0).max(10).optional().or(z.literal('')),
    vagas_estacionamento: z.coerce.number().min(0).max(10).optional().or(z.literal('')),
    nivel_urgencia: z.enum(['Baixa', 'Média', 'Alta']).default('Média'),
    necessidades_especificas: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.valor_minimo && data.valor_maximo) {
        return Number(data.valor_maximo) >= Number(data.valor_minimo)
      }
      return true
    },
    { message: 'Valor máximo deve ser maior que o mínimo', path: ['valor_maximo'] },
  )

export type FormValues = z.infer<typeof formSchema>
