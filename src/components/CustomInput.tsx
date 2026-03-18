import { Input } from '@/components/ui/input'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Control } from 'react-hook-form'

interface Props {
  control: Control<any>
  name: string
  label: string
  type?: string
  placeholder?: string
  optional?: boolean
  className?: string
  multiline?: boolean
}

export function CustomInput({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  optional,
  className,
  multiline,
}: Props) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={cn('space-y-0', className)}>
          <FormLabel className="flex items-center h-[20px] mb-[4px] text-[14px] text-[#333333] font-semibold">
            {label}{' '}
            {optional && <span className="text-[#999999] ml-1 font-normal">(opcional)</span>}
          </FormLabel>
          <FormControl>
            <div className="relative">
              {multiline ? (
                <textarea
                  placeholder={placeholder}
                  className={cn(
                    'flex w-full rounded-[8px] border bg-[#FFFFFF] px-[16px] py-[12px] text-[16px] font-medium text-[#333333] placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-[#1A3A52] transition-all resize-none min-h-[96px] h-[96px]',
                    fieldState.error ? 'border-2 border-[#FF4444] pr-[40px]' : 'border-[#E0E0E0]',
                  )}
                  {...field}
                  value={field.value || ''}
                />
              ) : (
                <Input
                  type={type}
                  placeholder={placeholder}
                  className={cn(
                    'h-[48px]',
                    fieldState.error && 'border-2 border-[#FF4444] pr-[40px]',
                  )}
                  {...field}
                  value={field.value || ''}
                />
              )}
              {fieldState.error && (
                <X
                  className={cn(
                    'absolute right-[12px] h-5 w-5 text-[#FF4444]',
                    multiline ? 'top-[14px]' : 'top-1/2 -translate-y-1/2',
                  )}
                />
              )}
            </div>
          </FormControl>
          <FormMessage className="min-h-[16px] mt-1" />
        </FormItem>
      )}
    />
  )
}
