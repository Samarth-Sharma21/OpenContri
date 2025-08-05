import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Root endpoint
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "RepoHub API is running" }))
    }

    // Submissions endpoints
    if (route === '/submissions' && method === 'GET') {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    if (route === '/submissions' && method === 'POST') {
      const { userId } = auth()
      if (!userId) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      const { url, title, description, tags, platform, username, language, stars } = body

      const { data, error } = await supabase
        .from('submissions')
        .insert([{
          url,
          title,
          description,
          tags: tags || [],
          platform: platform || 'github',
          user_id: userId,
          username,
          language,
          stars: stars || 0
        }])
        .select()

      if (error) throw error
      return handleCORS(NextResponse.json(data[0]))
    }

    // Comments endpoints
    if (route === '/comments' && method === 'GET') {
      const { searchParams } = new URL(request.url)
      const repoId = searchParams.get('repoId')
      const repoUrl = searchParams.get('repoUrl')

      let query = supabase.from('comments').select('*').order('created_at', { ascending: true })

      if (repoId) {
        query = query.eq('repo_id', repoId)
      } else if (repoUrl) {
        query = query.eq('repo_url', repoUrl)
      } else {
        return handleCORS(NextResponse.json({ error: 'repoId or repoUrl is required' }, { status: 400 }))
      }

      const { data, error } = await query

      if (error) throw error
      return handleCORS(NextResponse.json(data))
    }

    if (route === '/comments' && method === 'POST') {
      const { userId } = auth()
      if (!userId) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const body = await request.json()
      const { repoId, repoUrl, text, username } = body

      if (!text || !username) {
        return handleCORS(NextResponse.json({ error: 'text and username are required' }, { status: 400 }))
      }

      if (!repoId && !repoUrl) {
        return handleCORS(NextResponse.json({ error: 'repoId or repoUrl is required' }, { status: 400 }))
      }

      const commentData = {
        text,
        user_id: userId,
        username
      }

      if (repoId) {
        commentData.repo_id = repoId
      } else {
        commentData.repo_url = repoUrl
      }

      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select()

      if (error) throw error
      return handleCORS(NextResponse.json(data[0]))
    }

    // Update comment
    if (route.startsWith('/comments/') && method === 'PUT') {
      const { userId } = auth()
      if (!userId) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const commentId = route.split('/')[2]
      const body = await request.json()
      const { text } = body

      const { data, error } = await supabase
        .from('comments')
        .update({ text })
        .eq('id', commentId)
        .eq('user_id', userId)
        .select()

      if (error) throw error
      if (data.length === 0) {
        return handleCORS(NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 }))
      }

      return handleCORS(NextResponse.json(data[0]))
    }

    // Delete comment
    if (route.startsWith('/comments/') && method === 'DELETE') {
      const { userId } = auth()
      if (!userId) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const commentId = route.split('/')[2]

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId)

      if (error) throw error
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute