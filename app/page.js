'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import RepoCard from '@/components/RepoCard'
import FilterSidebar from '@/components/FilterSidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Code2, Filter, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function App() {
  const { user, profile } = useAuth()
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

  const buildSearchQuery = (searchTerm, filters) => {
    let query = []
    
    if (searchTerm) {
      // Check if it's an author search (detect common patterns)
      const authorPattern = /^@([a-zA-Z0-9-]+)$/.exec(searchTerm.trim())
      const userPattern = /^user:([a-zA-Z0-9-]+)$/i.exec(searchTerm.trim())
      const orgPattern = /^org:([a-zA-Z0-9-]+)$/i.exec(searchTerm.trim())
      
      if (authorPattern) {
        // Convert @username to user:username for GitHub API
        const username = authorPattern[1]
        query.push(`user:${username}`)
      } else if (userPattern) {
        query.push(`user:${userPattern[1]}`)
      } else if (orgPattern) {
        query.push(`org:${orgPattern[1]}`)
      } else {
        // Regular search - look in name, description, and readme
        query.push(`${searchTerm} in:name,description,readme`)
      }
    } else {
      // Default search for popular repos
      query.push('stars:>10')
    }
    
    // Add language filter
    if (filters.language) {
      query.push(`language:${filters.language}`)
    }
    
    // Add stars filter (more generous range)
    const minStars = filters.minStars || 0
    const maxStars = filters.maxStars === 100000 ? '' : filters.maxStars
    if (minStars > 0 || maxStars) {
      query.push(`stars:${minStars}..${maxStars || ''}`)
    }
    
    // Add topics filter
    if (filters.topics && filters.topics.length > 0) {
      filters.topics.forEach(topic => {
        query.push(`topic:${topic}`)
      })
    }
    
    return query.join(' ')
  }

  const fetchRepos = async (pageNum = 1, reset = false) => {
    if (loading) return
    
    // GitHub Search API has a 1000 results limit (100 pages), but let's be more generous
    if (pageNum > 100) {
      setHasMore(false)
      return
    }
    
    setLoading(true)
    try {
      const query = buildSearchQuery(searchTerm, filters)
      
      // Use 20 items per page for better infinite scroll experience
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&page=${pageNum}&per_page=20`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            // Add User-Agent to avoid rate limiting
            'User-Agent': 'OpenContri-App'
          }
        }
      )
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('GitHub API rate limit exceeded. Please try again later.')
        }
        throw new Error('Failed to fetch repositories')
      }
      
      const data = await response.json()
      
      if (reset) {
        setRepos(data.items || [])
        setPage(1)
      } else {
        setRepos(prev => [...prev, ...(data.items || [])])
      }
      
      // Continue loading if we got a full page and haven't hit the total count limit
      const totalCount = data.total_count || 0
      const currentTotal = reset ? (data.items?.length || 0) : repos.length + (data.items?.length || 0)
      
      // GitHub API limits to 1000 results, but we can check if there are more pages
      const hasMoreItems = (data.items?.length || 0) === 20 // Full page means more likely to have more
      const notAtGitHubLimit = currentTotal < Math.min(totalCount, 1000)
      const notAtPageLimit = pageNum < 50 // Reasonable limit to avoid excessive requests
      
      setHasMore(hasMoreItems && notAtGitHubLimit && notAtPageLimit)
      
      if (!reset) setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error fetching repos:', error)
      if (error.message.includes('rate limit')) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.')
      } else {
        toast.error('Failed to fetch repositories')
      }
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
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search repos or @username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <p className="text-xs text-muted-foreground mt-1 text-left">
                Try: "react", "@facebook", "user:microsoft", "machine-learning"
              </p>
            </div>
            <Button type="submit" size="icon" className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
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
                <p className="text-muted-foreground mb-4">
                  🎯 Found {repos.length} amazing repositories! Try different search terms or filters to explore more.
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
                    setPage(1)
                    setHasMore(true)
                  }}
                  variant="outline"
                >
                  Explore Different Projects
                </Button>
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