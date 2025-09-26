"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface BackButtonProps {
  href?: string
  label?: string
  className?: string
}

export function BackButton({ href = "/", label = "Back to Dashboard", className }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href === "/") {
      router.push("/")
    } else {
      router.push(href)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} className={`mb-4 ${className}`}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  )
}
