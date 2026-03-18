import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

interface FAQItem {
  q: string
  a: string | React.ReactNode
}

export function FAQList({ faqs }: { faqs: FAQItem[] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, i) => (
        <AccordionItem value={`faq-${i}`} key={i} className="border-b border-[#2E5F8A]/10">
          <AccordionTrigger className="font-bold text-[#1A3A52] text-left">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="text-[#333333] leading-relaxed">{faq.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

interface SectionCardProps {
  title: string
  icon?: React.ElementType
  children: React.ReactNode
  className?: string
}

export function SectionCard({ title, icon: Icon, children, className }: SectionCardProps) {
  return (
    <Card className={`border-[2px] border-[#2E5F8A]/20 shadow-sm ${className || ''}`}>
      <CardHeader className="bg-[#F5F5F5] border-b border-[#2E5F8A]/10 py-3">
        <CardTitle className="text-[18px] text-[#1A3A52] flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-[#4CAF50]" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 text-[#333333] space-y-3">{children}</CardContent>
    </Card>
  )
}

export function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-[#E5E5E5] text-[#1A3A52] px-1.5 py-0.5 rounded text-[13px] font-mono border border-[#CCCCCC]">
      {children}
    </code>
  )
}
