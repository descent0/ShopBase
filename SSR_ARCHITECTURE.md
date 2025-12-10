# SSR Authentication Architecture

## Overview
The authentication has been refactored to maximize Server-Side Rendering (SSR) with client components only where necessary for interactivity.

## Architecture Pattern

### Server Components (SSR)
- **`app/login/page.tsx`** - Main login page (Server Component)
- **`app/signup/page.tsx`** - Main signup page (Server Component)
- These pages render the static layout and metadata on the server

### Client Components (Interactive Parts)
- **`app/login/loginClient.tsx`** - Login form with state and event handlers
- **`app/signup/signUpClient.tsx`** - Signup form with state and event handlers
- Only these components use `'use client'` directive

### Server Actions (Backend Logic)
- **`app/actions/auth.ts`** - All authentication logic runs on the server
  - `login()` - Email/password login
  - `signup()` - User registration
  - `loginWithGoogle()` - OAuth authentication
  - `logout()` - Sign out

## Benefits

### 1. **Maximum SSR**
- Pages are rendered on the server
- Better SEO
- Faster initial page load
- Reduced client-side JavaScript

### 2. **Client Components Only Where Needed**
- Form state management
- User input handling
- Loading states
- Error display

### 3. **Server Actions for Security**
- Authentication logic runs on server
- Secure cookie handling
- No sensitive operations in browser
- Automatic revalidation and redirects

### 4. **Better Performance**
- Smaller client bundle
- Less JavaScript parsing
- Server-side form processing
- Optimized data fetching

## File Structure

```
app/
├── login/
│   ├── page.tsx (Server Component)
│   └── loginClient.tsx (Client Component)
├── signup/
│   ├── page.tsx (Server Component)
│   └── signUpClient.tsx (Client Component)
└── actions/
    └── auth.ts (Server Actions)
```

## Data Flow

### Login Flow
1. User visits `/login` → Server renders `page.tsx`
2. Server sends HTML with `<LoginClient />` component
3. User fills form → Client state updates
4. Form submit → Calls `login()` server action
5. Server action authenticates → Sets cookies
6. Server redirects to `/products`
7. Path revalidation ensures fresh data

### Signup Flow
1. User visits `/signup` → Server renders `page.tsx`
2. Server sends HTML with `<SignUpClient />` component
3. User fills form → Client validates passwords
4. Form submit → Calls `signup()` server action
5. Server action creates user → Sets cookies
6. Server redirects to `/products`
7. Path revalidation ensures fresh data

### OAuth Flow
1. User clicks Google button → Calls `loginWithGoogle()`
2. Server action generates OAuth URL
3. Client receives URL and redirects browser
4. Google authenticates → Redirects to `/auth/callback`
5. Callback exchanges code for session
6. Redirects to `/products`

## Key Features

### Server Actions Benefits
- **Type-safe**: Full TypeScript support
- **Secure**: Runs on server, not exposed to client
- **Simple**: Direct function calls from client
- **Automatic**: Revalidation and redirects handled

### Component Separation
- **Server Pages**: Static layout, metadata, SEO
- **Client Forms**: Interactive inputs, validation
- **Server Actions**: Authentication, database, redirects

## Comparison: Before vs After

### Before (All Client-Side)
```tsx
'use client';
export default function LoginPage() {
  // All logic in client component
  const handleLogin = async () => {
    const { data } = await supabase.auth.signInWithPassword(...);
    router.push('/products');
  };
}
```
❌ Entire page is client-side
❌ Large JavaScript bundle
❌ Client-side routing/redirects

### After (SSR with Server Actions)
```tsx
// page.tsx (Server Component)
export default function LoginPage() {
  return <LoginClient />;
}

// loginClient.tsx (Client Component)
'use client';
export default function LoginClient() {
  const handleLogin = async (e) => {
    await login(formData); // Server Action
  };
}
```
✅ Page rendered on server
✅ Minimal client JavaScript
✅ Server-side redirects

## Usage

### Creating a New Auth Page
1. Create server component page (default)
2. Create client component for form
3. Add server action in `actions/auth.ts`
4. Import and call action from client

### Example: Password Reset
```tsx
// app/reset-password/page.tsx (Server)
export default function ResetPage() {
  return <ResetClient />;
}

// app/reset-password/resetClient.tsx (Client)
'use client';
import { resetPassword } from '@/app/actions/auth';

export default function ResetClient() {
  const handleSubmit = async (e) => {
    const formData = new FormData(e.target);
    await resetPassword(formData);
  };
  // ... form JSX
}

// app/actions/auth.ts (Server Action)
export async function resetPassword(formData: FormData) {
  'use server';
  const email = formData.get('email') as string;
  await supabase.auth.resetPasswordForEmail(email);
  redirect('/check-email');
}
```

## Best Practices

1. **Server Components by Default**
   - Use server components unless you need interactivity
   - Add `'use client'` only when necessary

2. **Server Actions for Mutations**
   - All authentication should use server actions
   - Never expose Supabase keys in client code

3. **Client Components for Forms**
   - Use client components for form state
   - Handle validation on both client and server

4. **Type Safety**
   - Use TypeScript for all components
   - Validate FormData in server actions

5. **Error Handling**
   - Return errors from server actions
   - Display errors in client components

## Security Notes

- ✅ Cookies are HTTP-only (set by Supabase server client)
- ✅ Authentication runs on server
- ✅ No sensitive data in client bundles
- ✅ CSRF protection via server actions
- ✅ Secure redirects and revalidation
