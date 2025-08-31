"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary/20 select-none">
            404
          </h1>
        </div>

        {/* Main Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground">
            The page you&apos;re looking for seems to have wandered off somewhere in ARSA. 
            Don&apos;t worry, we&apos;ll help you find your way back home!
          </p>
        </div>

                 {/* Action Buttons */}
         <div className="flex justify-center mb-8">
           <Button size="lg" asChild>
             <Link href="/" className="flex items-center">
               <Home className="h-5 w-5 mr-2" />
               Go Home
             </Link>
           </Button>
         </div>


      </div>
    </div>
  )
}
