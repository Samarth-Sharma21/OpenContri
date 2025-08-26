'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, MessageCircle, Edit2, Trash2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

export default function Comments({ repoId, repoUrl, currentUser }) {
  const { user, profile, isSignedIn } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [showComments, setShowComments] = useState(false)

  const fetchComments = async () => {
    try {
      const params = new URLSearchParams()
      if (repoId) params.append('repoId', repoId)
      if (repoUrl) params.append('repoUrl', repoUrl)
      
      const response = await fetch(`/api/comments?${params}`)
      if (!response.ok) throw new Error('Failed to fetch comments')
      
      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [repoId, repoUrl])

  // Set up real-time subscriptions
  useEffect(() => {
    const { supabase } = require('@/lib/supabase')
    
    let subscription
    
    if (repoId) {
      subscription = supabase
        .channel(`comments_${repoId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'comments',
            filter: `repo_id=eq.${repoId}` 
          }, 
          () => {
            fetchComments()
          }
        )
        .subscribe()
    } else if (repoUrl) {
      subscription = supabase
        .channel(`comments_${repoUrl.replace(/[^a-zA-Z0-9]/g, '_')}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'comments',
            filter: `repo_url=eq.${repoUrl}` 
          }, 
          () => {
            fetchComments()
          }
        )
        .subscribe()
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [repoId, repoUrl])

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !isSignedIn) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoId,
          repoUrl,
          text: newComment.trim(),
          username: currentUser?.username || currentUser?.firstName || 'Anonymous'
        }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      setNewComment('')
      fetchComments()
      toast.success('Comment posted!')
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: editText.trim()
        }),
      })

      if (!response.ok) throw new Error('Failed to update comment')

      setEditingId(null)
      setEditText('')
      fetchComments()
      toast.success('Comment updated!')
    } catch (error) {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete comment')

      fetchComments()
      toast.success('Comment deleted!')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const startEdit = (comment) => {
    setEditingId(comment.id)
    setEditText(comment.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading comments...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </Button>
      </div>

      {showComments && (
        <>
          {/* Add Comment Form */}
          {isSignedIn ? (
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          ) : (
            <Card className="border-dashed">
              <CardContent className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Please sign in to join the discussion
                </p>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className="border-l-2 border-l-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {comment.username?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        {editingId === comment.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="min-h-[60px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEditComment(comment.id)}
                                disabled={!editText.trim()}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap">
                              {comment.text}
                            </p>
                            
                            {/* Edit/Delete buttons for comment owner */}
                            {isSignedIn && currentUser && comment.user_id === currentUser.id && (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEdit(comment)}
                                  className="h-7 px-2 text-xs"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="text-center py-6">
                <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No comments yet. Be the first to share your thoughts!
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}