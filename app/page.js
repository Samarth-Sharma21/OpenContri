'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import RepoCard from '@/components/RepoCard'
import FilterSidebar from '@/components/FilterSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Github, Filter } from 'lucide-react'
import { toast } from 'sonner'

export default function App() {
  const { user } = useUser()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    language: '',
    minStars: 0,
    maxStars: 100000,
    topics: []
  })
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Initialize Lenis for smooth scrolling
  useEffect(() => {
    const initLenis = async () => {
      const Lenis = (await import('lenis')).default
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })

      function raf(time) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)
    }
    initLenis()
  }, [])

  const fetchRepos = async (reset = false) => {
    setLoading(true)
    try {
      const searchQuery = searchTerm || 'stars:>100'
      const languageQuery = filters.language ? ` language:${filters.language}` : ''
      const starsQuery = ` stars:${filters.minStars}..${filters.maxStars}`
      const topicsQuery = filters.topics.length > 0 ? ` topic:${filters.topics.join(' topic:')}` : ''
      
      const query = `${searchQuery}${languageQuery}${starsQuery}${topicsQuery}`
      
      const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&page=${reset ? 1 : page}&per_page=12`)
      
      if (!response.ok) throw new Error('Failed to fetch repositories')
      
      const data = await response.json()
      
      if (reset) {
        setRepos(data.items)
        setPage(1)
      } else {
        setRepos(prev => [...prev, ...data.items])
      }
      
      if (!reset) setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error fetching repos:', error)
      toast.error('Failed to fetch repositories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRepos(true)
  }, [filters])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchRepos(true)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Github className="h-12 w-12 mr-3 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              RepoHub
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover amazing repositories, share your favorites, and connect with the developer community.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto mb-6">
            <Input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-80 shrink-0">
              <FilterSidebar filters={filters} onFiltersChange={handleFilterChange} />
            </div>
          )}
          
          {/* Main Content */}
          <div className="flex-1">
            {/* Repository Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {repos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
            
            {/* Load More Button */}
            {repos.length > 0 && (
              <div className="text-center mt-12">
                <Button
                  onClick={() => fetchRepos()}
                  disabled={loading}
                  size="lg"
                  className="px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Repositories'
                  )}
                </Button>
              </div>
            )}
            
            {loading && repos.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Loading repositories...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}