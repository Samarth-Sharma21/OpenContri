'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import Navigation from '@/components/Navigation'
import CommunityRepoCard from '@/components/CommunityRepoCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Users, Filter, X } from 'lucide-react'
import { toast } from 'sonner'

export default function CommunityPage() {
  const { user } = useUser()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [availableTags, setAvailableTags] = useState([])

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

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/submissions')
      if (!response.ok) throw new Error('Failed to fetch submissions')
      
      const data = await response.json()
      setSubmissions(data)
      
      // Extract unique tags
      const tags = [...new Set(data.flatMap(sub => sub.tags || []))]
      setAvailableTags(tags)
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Failed to load community submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = !searchTerm || 
      submission.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.username?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => submission.tags?.includes(tag))
    
    const matchesPlatform = selectedPlatform === 'all' || 
      submission.platform === selectedPlatform

    return matchesSearch && matchesTags && matchesPlatform
  })

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTags([])
    setSelectedPlatform('all')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-secondary/5 to-primary/5">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Users className="h-12 w-12 mr-3 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Community
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore repositories shared by our amazing community. Discover, discuss, and connect.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Platform Filter */}
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="github">GitHub</SelectItem>
                <SelectItem value="bitbucket">Bitbucket</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Filter by tags:</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 12).map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-muted-foreground mb-2">Active filters:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} className="flex items-center gap-1">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => toggleTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredSubmissions.length} of {submissions.length} repositories
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading community submissions...</span>
          </div>
        )}

        {/* Repository Grid */}
        {!loading && filteredSubmissions.length > 0 && (
          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
            {filteredSubmissions.map((submission) => (
              <CommunityRepoCard 
                key={submission.id} 
                submission={submission} 
                currentUser={user}
                onUpdate={fetchSubmissions}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredSubmissions.length === 0 && submissions.length > 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear All Filters
            </Button>
          </div>
        )}

        {/* No Submissions Yet */}
        {!loading && submissions.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share an amazing repository with the community!
            </p>
            <Button asChild>
              <a href="/submit">Submit Repository</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}