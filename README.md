# OpenContri - Discover Amazing Open Source Projects

OpenContri is a platform for discovering, contributing to, and discussing amazing open source repositories with the community.

## Features

- GitHub OAuth authentication with Supabase
- Discover open source repositories
- Submit repositories to the community
- Filter repositories by language, stars, and topics
- User profiles with GitHub integration

## Tech Stack

- Next.js 14
- Supabase (Authentication & Database)
- GitHub API
- Tailwind CSS
- Shadcn UI Components

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- GitHub OAuth App

### Environment Setup

1. Clone the repository

```bash
git clone https://github.com/yourusername/opencontri.git
cd opencontri
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Supabase Setup

1. Create a new Supabase project
2. Enable GitHub OAuth in the Authentication settings
3. Run the SQL migration script in `scripts/supabase-migration.sql` in the Supabase SQL editor

### GitHub OAuth Setup

1. Create a new GitHub OAuth App at https://github.com/settings/developers
2. Set the Authorization callback URL to `http://localhost:3000/api/auth/github/callback`
3. Copy the Client ID and Client Secret to your `.env` file

### Running the Application

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Deployment

The application can be deployed to Vercel, Netlify, or any other platform that supports Next.js applications.

### Vercel Deployment

1. Push your code to a GitHub repository
2. Import the repository in Vercel
3. Set the environment variables in the Vercel dashboard
4. Deploy the application

## License

This project is licensed under the MIT License - see the LICENSE file for details.