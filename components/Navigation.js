'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Github, Menu, Plus, Users, Home, Code2, LogOut } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const { user, profile, isSignedIn, signInWithGitHub, signOut } = useAuth()
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
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile?.username || 'User'} />
                ) : (
                  <AvatarFallback>
                    {profile?.username?.charAt(0).toUpperCase() || 
                     user?.user_metadata?.preferred_username?.charAt(0).toUpperCase() || 
                     user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="hidden md:block mr-2">
                <p className="text-sm font-medium">{profile?.username || user?.user_metadata?.preferred_username || 'User'}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={signOut}
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm"
                onClick={signInWithGitHub}
                className="flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                Sign In with GitHub
              </Button>
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
                      <Button 
                        variant="default" 
                        className="w-full flex items-center gap-2" 
                        onClick={() => {
                          signInWithGitHub();
                          setIsOpen(false);
                        }}
                      >
                        <Github className="h-4 w-4" />
                        Sign In with GitHub
                      </Button>
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