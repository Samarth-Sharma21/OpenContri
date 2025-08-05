// Test Supabase connection
import { supabase } from './lib/supabase.js'

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('submissions')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    return true
  } catch (e) {
    console.log('❌ Supabase test failed:', e.message)
    return false
  }
}

testSupabaseConnection()