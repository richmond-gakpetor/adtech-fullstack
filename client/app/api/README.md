# API Integration Guide

## Quick Start

### Using Authentication Hooks

```tsx
'use client';

import { useLogin, useRegister, useAuth, useLogout } from '@/app/api/hooks/useAuth';

function LoginComponent() {
  const { mutate: login, isPending } = useLogin();

  const handleLogin = () => {
    login({ 
      email: 'user@example.com', 
      password: 'password123' 
    });
  };

  return (
    <button onClick={handleLogin} disabled={isPending}>
      {isPending ? 'Logging in...' : 'Login'}
    </button>
  );
}
```

### Checking Current User

```tsx
'use client';

import { useAuth } from '@/app/api/hooks/useAuth';

function Profile() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;

  return <div>Welcome, {user?.full_name}!</div>;
}
```

### Protected Routes

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/api/hooks/useAuth';

function ProtectedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;

  return <div>Protected Content</div>;
}
```

## Available Hooks

### Authentication

- `useAuth()` - Get current user and auth status
- `useLogin()` - Login mutation
- `useRegister()` - Registration mutation  
- `useLogout()` - Logout mutation
- `useRequestPasswordReset()` - Request password reset
- `useResetPassword()` - Complete password reset

## API Response Structure

All API responses follow this format:

```typescript
{
  success: boolean;
  data: T;  // Your actual data
  message: string;
}
```

## Error Handling

Errors are automatically handled:
- Toast notifications for user feedback
- Console logging in development
- Automatic token refresh on 401 errors
- Redirect to login on auth failures

## Token Management

Tokens are stored in localStorage and automatically:
- Attached to requests via interceptor
- Refreshed when expired
- Cleared on logout

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## Examples

### Making Direct API Calls

```typescript
import { authEndpoints } from '@/app/api/endpoints/auth';

// In an async function
const response = await authEndpoints.login({
  email: 'user@example.com',
  password: 'password123'
});

console.log(response.data.user);
```

### Custom API Calls

```typescript
import apiClient from '@/app/api';

// GET request
const response = await apiClient.get('/custom-endpoint');

// POST request
const response = await apiClient.post('/custom-endpoint', { 
  data: 'value' 
});
```

## Next Steps

Once comfortable with auth, you can:
1. Create billboard hooks (Phase 3)
2. Add chat functionality (Phase 5)
3. Implement payment flows (Phase 6)

## Troubleshooting

### "Network Error"
- Check if backend is running on port 8000
- Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local`

### "401 Unauthorized"
- Token may be expired (should auto-refresh)
- Try logging out and back in
- Check browser console for details

### "CORS Error"
- Backend must allow `http://localhost:3000`
- Check backend CORS configuration

### Tokens Not Persisting
- Check browser localStorage
- Look for `xposure_auth_tokens` key
- Ensure no extensions are blocking localStorage

## File Structure

```
app/api/
├── index.ts              # Axios client + interceptors
├── types.ts              # TypeScript definitions
├── client.ts             # Centralized exports
├── endpoints/
│   └── auth.ts           # Auth endpoints
└── hooks/
    └── useAuth.ts        # Auth React Query hooks
```
