'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Github, Menu, Plus, Users, Home, Code2 } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const { isSignedIn, user } = useUser()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: '/', label: 'Discover', icon: Home },
    { href: '/submit', label: 'Submit', icon: Plus, requiresAuth: true },
    { href: '/community', label: 'Community', icon: Users },
  ]

  const NavLinks = ({ mobile = false, onItemClick = () => {} }) => (
    <>
      {navItems.map((item) => {
        if (item.requiresAuth && !isSignedIn) return null
        
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              mobile ? 'w-full justify-start' : ''
            } ${
              isActive 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="relative">
            <Code2 className="h-6 w-6 text-primary" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary rounded-full"></div>
          </div>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            OpenContri
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLinks />
        </nav>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          ) : (
            <div className="flex items-center gap-2">
              <SignInButton>
                <Button variant="ghost" size="sm">Sign In</Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm">Sign Up</Button>
              </SignUpButton>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-4 mt-8">
                <NavLinks mobile onItemClick={() => setIsOpen(false)} />
                
                {/* Mobile Auth Buttons */}
                {!isSignedIn && (
                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <SignInButton>
                        <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                          Sign In
                        </Button>
                      </SignInButton>
                      <SignUpButton>
                        <Button className="w-full" onClick={() => setIsOpen(false)}>
                          Sign Up
                        </Button>
                      </SignUpButton>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}