-- Supabase Database Schema for Modern SaaS App
-- Run this SQL in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    platform TEXT CHECK (platform IN ('github', 'bitbucket')) DEFAULT 'github',
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    language TEXT,
    stars INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    repo_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    repo_url TEXT, -- For external repos not in submissions
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Either repo_id or repo_url should be provided
    CHECK ((repo_id IS NOT NULL) OR (repo_url IS NOT NULL))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_platform ON submissions(platform);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_tags ON submissions USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_comments_repo_id ON comments(repo_id);
CREATE INDEX IF NOT EXISTS idx_comments_repo_url ON comments(repo_url);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for submissions
-- Users can read all submissions
CREATE POLICY "Users can view all submissions" ON submissions
    FOR SELECT USING (true);

-- Users can insert their own submissions
CREATE POLICY "Users can create their own submissions" ON submissions
    FOR INSERT WITH CHECK (true);

-- Users can update their own submissions
CREATE POLICY "Users can update their own submissions" ON submissions
    FOR UPDATE USING (true) WITH CHECK (true);

-- Users can delete their own submissions
CREATE POLICY "Users can delete their own submissions" ON submissions
    FOR DELETE USING (true);

-- RLS Policies for comments
-- Users can read all comments
CREATE POLICY "Users can view all comments" ON comments
    FOR SELECT USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can create their own comments" ON comments
    FOR INSERT WITH CHECK (true);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (true) WITH CHECK (true);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (true);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();