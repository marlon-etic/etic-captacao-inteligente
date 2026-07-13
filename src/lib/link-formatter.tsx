import { Fragment } from 'react'
import { cn } from '@/lib/utils'

const URL_REGEX = /(https?:\/\/[^\s]+)/g

interface LinkTextProps {
  text: string
  className?: string
  linkClassName?: string
}

export function LinkText({ text, className, linkClassName }: LinkTextProps) {
  if (!text) return null

  const parts = text.split(URL_REGEX)

  return (
    <span className={cn('break-all break-words', className)}>
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('text-blue-600 hover:text-blue-800 hover:underline', linkClassName)}
            >
              {part}
            </a>
          )
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </span>
  )
}

export function hasUrls(text: string): boolean {
  if (!text) return false
  return URL_REGEX.test(text)
}
