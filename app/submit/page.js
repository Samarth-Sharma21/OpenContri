'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, X, Github, GitBranch, Sparkles, Code2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SubmitPage() {
  const router = useRouter()
  const { user, isSignedIn } = useUser()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    platform: 'github',
    tags: [],
    language: ''
  })
  const [tempTag, setTempTag] = useState('')

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24">
          <Card className="max-w-md mx-auto fade-in-up">
            <CardContent className="text-center py-8">
              <div className="mb-4">
                <Code2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to contribute amazing repositories to the OpenContri community.
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <a href="/sign-in">Sign In</a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href="/sign-up">Create Account</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const extractRepoInfo = async (url) => {
    try {
      const githubMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      const bitbucketMatch = url.match(/bitbucket\.org\/([^\/]+)\/([^\/]+)/)
      
      if (githubMatch) {
        const [, owner, repo] = githubMatch
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
        
        if (response.ok) {
          const data = await response.json()
          setFormData(prev => ({
            ...prev,
            title: data.name,
            description: data.description || '',
            language: data.language || '',
            platform: 'github'
          }))
          toast.success('Repository info loaded!')
        }
      } else if (bitbucketMatch) {
        setFormData(prev => ({
          ...prev,
          platform: 'bitbucket'
        }))
      }
    } catch (error) {
      console.error('Error extracting repo info:', error)
    }
  }

  const handleUrlChange = (url) => {
    setFormData(prev => ({ ...prev, url }))
    if (url) {
      extractRepoInfo(url)
    }
  }

  const addTag = () => {
    if (tempTag && !formData.tags.includes(tempTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tempTag]
      }))
      setTempTag('')
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          username: user.username || user.firstName || 'Anonymous'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit repository')
      }

      toast.success('🎉 Repository submitted successfully!')
      router.push('/community')
    } catch (error) {
      console.error('Error submitting repository:', error)
      toast.error('Failed to submit repository. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 fade-in-up">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <Plus className="h-8 w-8 text-primary" />
                <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-secondary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Contribute to OpenContri</h1>
            <p className="text-muted-foreground">
              Share an amazing open source project with our community
            </p>
          </div>

          <Card className="fade-in-up stagger-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Repository Details
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Repository URL */}
                <div className="space-y-2">
                  <Label htmlFor="url">Repository URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://github.com/username/amazing-project"
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    required
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports GitHub and Bitbucket URLs
                  </p>
                </div>

                {/* Platform */}
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select 
                    value={formData.platform} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">
                        <div className="flex items-center gap-2">
                          <Github className="h-4 w-4" />
                          GitHub
                        </div>
                      </SelectItem>
                      <SelectItem value="bitbucket">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          Bitbucket
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    placeholder="Amazing Open Source Project"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell the community what makes this project special and worth contributing to..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="language">Primary Language</Label>
                  <Input
                    id="language"
                    placeholder="e.g., JavaScript, Python, Go, Rust"
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  
                  {/* Current Tags */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-1 hover:bg-transparent"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add Tag Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag (e.g., frontend, ai, tool, game)..."
                      value={tempTag}
                      onChange={(e) => setTempTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      disabled={!tempTag}
                    >
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tags help others discover your project. Add topics like: web, api, cli, ai, game, etc.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loading || !formData.url}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Contributing to OpenContri...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Contribute to OpenContri
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}