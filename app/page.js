'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import RepoCard from '@/components/RepoCard'
import FilterSidebar from '@/components/FilterSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Code2, Filter, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function App() {
  const { user } = useUser()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    language: '',
    minStars: 0,
    maxStars: 100000,
    topics: []
  })
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const observer = useRef()

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

  const fetchRepos = async (pageNum = 1, reset = false) => {
    if (loading) return
    
    setLoading(true)
    try {
      const searchQuery = searchTerm || 'stars:>100'
      const languageQuery = filters.language ? ` language:${filters.language}` : ''
      const starsQuery = ` stars:${filters.minStars}..${filters.maxStars}`
      const topicsQuery = filters.topics.length > 0 ? ` topic:${filters.topics.join(' topic:')}` : ''
      
      const query = `${searchQuery}${languageQuery}${starsQuery}${topicsQuery}`
      
      const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&page=${pageNum}&per_page=12`)
      
      if (!response.ok) throw new Error('Failed to fetch repositories')
      
      const data = await response.json()
      
      if (reset) {
        setRepos(data.items)
        setPage(1)
      } else {
        setRepos(prev => [...prev, ...data.items])
      }
      
      // Check if there are more pages
      setHasMore(data.items.length === 12)
      
      if (!reset) setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error fetching repos:', error)
      toast.error('Failed to fetch repositories')
      setHasMore(false)
    } finally {
      setLoading(false)
      if (initialLoading) setInitialLoading(false)
    }
  }

  // Infinite scroll ref callback
  const lastRepoElementRef = useCallback(node => {
    if (loading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchRepos(page + 1, false)
      }
    }, {
      rootMargin: '100px' // Load new content when user is 100px from the bottom
    })
    if (node) observer.current.observe(node)
  }, [loading, hasMore, page])

  useEffect(() => {
    fetchRepos(1, true)
  }, [filters])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setHasMore(true)
    fetchRepos(1, true)
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPage(1)
    setHasMore(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6 fade-in-up">
            <div className="relative">
              <Code2 className="h-12 w-12 mr-3 text-primary" />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-secondary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              OpenContri
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto fade-in-up stagger-1">
            Discover amazing open source projects, contribute to the community, and build the future together.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto mb-6 fade-in-up stagger-2">
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
            <div className="w-80 shrink-0 fade-in-up">
              <FilterSidebar filters={filters} onFiltersChange={handleFilterChange} />
            </div>
          )}
          
          {/* Main Content */}
          <div className="flex-1">
            {/* Initial Loading State */}
            {initialLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Discovering amazing repositories...</span>
              </div>
            )}
            
            {/* Repository Grid */}
            {!initialLoading && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {repos.map((repo, index) => {
                  const isLast = index === repos.length - 1
                  return (
                    <div 
                      key={repo.id}
                      ref={isLast ? lastRepoElementRef : null}
                      className="fade-in-up"
                      style={{ animationDelay: `${(index % 12) * 0.1}s` }}
                    >
                      <RepoCard repo={repo} />
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Infinite Scroll Loading Indicator */}
            {loading && !initialLoading && repos.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading more repositories...</span>
              </div>
            )}
            
            {/* End of Results */}
            {!hasMore && repos.length > 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  🎉 You've discovered all the amazing repositories! Try adjusting your search or filters for more results.
                </p>
              </div>
            )}
            
            {/* No Results */}
            {!initialLoading && repos.length === 0 && !loading && (
              <div className="text-center py-12">
                <Code2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm('')
                    setFilters({
                      language: '',
                      minStars: 0,
                      maxStars: 100000,
                      topics: []
                    })
                  }}
                  variant="outline"
                >
                  Reset Search
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}