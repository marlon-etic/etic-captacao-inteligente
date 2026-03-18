import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { User, Role } from '@/types'
import { cn } from '@/lib/utils'

const baseSchema = z.object({
  name: z.string().min(3, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.enum(['captador', 'sdr', 'corretor', 'admin', 'gestor'] as const),
  whatsapp: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.replace(/\D/g, '').length >= 10,
      'WhatsApp inválido (mínimo 10 dígitos)',
    ),
  status: z.enum(['ativo', 'inativo', 'bloqueado']).default('ativo'),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
})

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: User | null
}

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const { users, createUser, updateUser } = useAppStore()
  const { toast } = useToast()
  const [showPass, setShowPass] = useState(false)

  const formSchema = useMemo(() => {
    return baseSchema
      .refine(
        (data) => {
          if (!user && (!data.password || data.password.length < 8)) return false
          if (data.password && data.password.length > 0 && data.password.length < 8) return false
          return true
        },
        { message: 'Mínimo 8 caracteres', path: ['password'] },
      )
      .refine((data) => data.password === data.confirmPassword, {
        message: 'As senhas não coincidem',
        path: ['confirmPassword'],
      })
  }, [user])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'captador',
      whatsapp: '',
      status: 'ativo',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (user) {
        form.reset({
          name: user.name,
          email: user.email,
          role: user.role,
          whatsapp: user.whatsapp || '',
          status: user.status || 'ativo',
          password: '',
          confirmPassword: '',
        })
      } else {
        form.reset({
          name: '',
          email: '',
          role: 'captador',
          whatsapp: '',
          status: 'ativo',
          password: '',
          confirmPassword: '',
        })
      }
      setShowPass(false)
    }
  }, [isOpen, user, form])

  const passwordVal = form.watch('password')
  const strength = useMemo(() => {
    if (!passwordVal) return ''
    if (passwordVal.length < 6) return 'Fraca'
    if (
      passwordVal.length >= 8 &&
      /[A-Z]/.test(passwordVal) &&
      /[0-9]/.test(passwordVal) &&
      /[^A-Za-z0-9]/.test(passwordVal)
    )
      return 'Forte'
    if (passwordVal.length >= 8 && /[a-zA-Z]/.test(passwordVal) && /[0-9]/.test(passwordVal))
      return 'Média'
    return 'Fraca'
  }, [passwordVal])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const isDuplicate = users.some(
        (u) => u.email.toLowerCase() === values.email.toLowerCase() && u.id !== user?.id,
      )
      if (isDuplicate) {
        form.setError('email', { type: 'manual', message: 'Este email já está cadastrado' })
        return
      }

      if (user) {
        updateUser(user.id, {
          name: values.name,
          email: values.email,
          role: values.role as Role,
          whatsapp: values.whatsapp,
          status: values.status as any,
        })
        toast({
          title: '✅ Usuário atualizado com sucesso!',
          className: 'bg-emerald-600 text-white',
        })
      } else {
        createUser({
          name: values.name,
          email: values.email,
          role: values.role as Role,
          whatsapp: values.whatsapp,
          status: values.status as any,
        })
        toast({
          title: `✅ Usuário ${values.name} criado com sucesso!`,
          className: 'bg-emerald-600 text-white',
        })
      }
      onClose()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar usuário. Tente novamente',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-[#1A3A52]">
            {user ? 'Editar Usuário' : 'Criar Novo Usuário'}
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-2 overflow-y-auto max-h-[75vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="joao@etic.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="captador">Captador</SelectItem>
                        <SelectItem value="sdr">SDR</SelectItem>
                        <SelectItem value="corretor">Corretor</SelectItem>
                        <SelectItem value="gestor">Gestor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{user ? 'Nova Senha (opcional)' : 'Senha'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPass ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPass(!showPass)}
                          tabIndex={-1}
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    {strength && (
                      <p
                        className={cn(
                          'text-xs font-bold mt-1 text-right',
                          strength === 'Forte'
                            ? 'text-green-600'
                            : strength === 'Média'
                              ? 'text-yellow-600'
                              : 'text-red-500',
                        )}
                      >
                        Força da senha: {strength}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input
                        type={showPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#E0E0E0] bg-[#F5F5F5] p-3 shadow-sm mt-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-[14px] font-bold text-[#1A3A52]">
                        Status da Conta
                      </FormLabel>
                      <p className="text-[12px] text-[#666666]">
                        Contas inativas não podem acessar o sistema
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'ativo'}
                        onCheckedChange={(checked) => field.onChange(checked ? 'ativo' : 'inativo')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 mt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto h-12"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto h-12 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold px-8"
                >
                  {user ? '💾 Salvar Alterações' : '✅ Criar Usuário'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
