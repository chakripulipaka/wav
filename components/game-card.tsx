"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GameCardProps {
  id: string
  title: string
  description: string
  previewComponent?: React.ReactNode
  category: string
  href?: string
}

export function GameCard({ id, title, description, previewComponent, category, href }: GameCardProps) {
  const linkHref = href || `/games/${id}`

  return (
    <Card className="group relative overflow-hidden border-border bg-card transition-all hover:border-primary/50 hover:shadow-[0_0_25px_rgba(255,92,147,0.3)]">
      <div className="aspect-video w-full overflow-hidden relative bg-[#0a0a0a]">
        {previewComponent}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent opacity-60 pointer-events-none" />
      </div>

      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="border-secondary/50 text-secondary bg-secondary/10">
            {category}
          </Badge>
        </div>
        <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground">{title}</h3>
      </CardHeader>

      <CardContent className="px-5 py-0">
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardContent>

      <CardFooter className="p-5 pt-4">
        <Link
          href={linkHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(255,92,147,0.4)]"
        >
          Play Now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>

      {/* Decorative glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-secondary/10 blur-[80px] transition-opacity group-hover:opacity-100 opacity-0 pointer-events-none" />
    </Card>
  )
}
