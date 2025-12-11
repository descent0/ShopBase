'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { ShoppingCart, Lock, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginClient() {
  const router = useRouter()

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const continueAsGuest = () => {
    router.push('/products')
  }

  return (
    <Card className="w-full max-w-[450px] mx-4 shadow-xl">
      <CardHeader className="space-y-3 md:space-y-4 text-center pb-4 md:pb-6">
        <div className="flex justify-center">
          <div className="bg-linear-to-br from-blue-500 to-purple-600 p-3 md:p-4 rounded-2xl shadow-lg">
            <ShoppingCart className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
        </div>

        <div className="space-y-2 md:space-y-3">
          <CardTitle className="text-2xl md:text-3xl font-bold">
            Login Required
          </CardTitle>
          <CardDescription className="text-sm md:text-base text-gray-600 px-2">
            Please log in before proceeding
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 md:space-y-6 pb-4 md:pb-6">
        {/* Why Login Section */}
        <div className="bg-blue-50 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
          <p className="font-semibold text-gray-800 text-center text-sm md:text-base">
            Authentication is mandatory to:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-blue-500 rounded-full p-1.5 shrink-0">
                <Lock className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
              </div>
              <span className="text-xs md:text-sm text-gray-700">Complete checkout securely</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-blue-500 rounded-full p-1.5 shrink-0">
                <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
              </div>
              <span className="text-xs md:text-sm text-gray-700">View and track your orders</span>
            </div>

          </div>
        </div>

        <Button 
          className="w-full h-11 md:h-12 text-sm md:text-base font-semibold bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 shadow-sm transition-all hover:shadow-md" 
          onClick={loginWithGoogle}
        >
          <svg className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              style={{ fill: '#4285F4' }}
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              style={{ fill: '#34A853' }}
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              style={{ fill: '#FBBC05' }}
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              style={{ fill: '#EA4335' }}
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button 
          variant="outline"
          className="w-full h-11 md:h-12 text-sm md:text-base font-semibold" 
          onClick={continueAsGuest}
        >
          Continue Shopping as Guest
        </Button>
      </CardContent>
    </Card>
  )
}