'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Comments from '@/components/Comments'
import { Star, ExternalLink, Github, GitBranch, Calendar, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function CommunityRepoCard({ submission, currentUser, onUpdate }) {
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'github':
        return <Github className="h-4 w-4" />
      case 'bitbucket':
        return <GitBranch className="h-4 w-4" />
      default:
        return <Github className="h-4 w-4" />
    }
  }

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'github':
        return 'bg-black text-white'
      case 'bitbucket':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        {/* Header with user info and platform */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {submission.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{submission.username}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          
          <Badge className={`${getPlatformColor(submission.platform)} flex items-center gap-1`}>
            {getPlatformIcon(submission.platform)}
            {submission.platform}
          </Badge>
        </div>

        {/* Repository Title */}
        <CardTitle className="text-xl line-clamp-2">
          {submission.title || 'Untitled Repository'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {submission.description && (
          <p className="text-muted-foreground text-sm line-clamp-3">
            {submission.description}
          </p>
        )}

        {/* Repository Details */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {submission.language && (
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full bg-primary`}></div>
              {submission.language}
            </div>
          )}
          {submission.stars > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {submission.stars}
            </div>
          )}
        </div>

        {/* Tags */}
        {submission.tags && submission.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {submission.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs py-0">
                {tag}
              </Badge>
            ))}
            {submission.tags.length > 4 && (
              <Badge variant="outline" className="text-xs py-0">
                +{submission.tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          asChild
          className="w-full"
          variant="outline"
        >
          <a 
            href={submission.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Repository
          </a>
        </Button>

        {/* Comments Section */}
        <div className="border-t pt-4">
          <Comments 
            repoId={submission.id}
            repoUrl={submission.url}
            currentUser={currentUser}
          />
        </div>
      </CardContent>
    </Card>
  )
}