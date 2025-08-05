'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, GitFork, ExternalLink, Eye } from 'lucide-react'

export default function RepoCard({ repo }) {
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  const truncateDescription = (text, maxLength = 100) => {
    if (!text) return 'No description available'
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  return (
    <Card className="group h-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {repo.name}
          </CardTitle>
          {repo.language && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {repo.language}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          by {repo.owner.login}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground min-h-[2.5rem]">
          {truncateDescription(repo.description)}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            <span>{formatNumber(repo.stargazers_count)}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-3 w-3" />
            <span>{formatNumber(repo.forks_count)}</span>
          </div>
          {repo.watchers_count > 0 && (
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{formatNumber(repo.watchers_count)}</span>
            </div>
          )}
        </div>
        
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {repo.topics.slice(0, 3).map((topic) => (
              <Badge key={topic} variant="outline" className="text-xs py-0">
                {topic}
              </Badge>
            ))}
            {repo.topics.length > 3 && (
              <Badge variant="outline" className="text-xs py-0">
                +{repo.topics.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <Button
          asChild
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          variant="outline"
        >
          <a 
            href={repo.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View on GitHub
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}