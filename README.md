# Shop Hub 🛍️

A modern, full-stack e-commerce application built with Next.js 16, React 19, TypeScript, and Supabase. Shop Hub provides a seamless shopping experience with product browsing, advanced filtering, cart management, and secure authentication.

## Features

### 🛒 Shopping Experience
- **Product Catalog**: Browse a comprehensive product catalog with high-quality images and detailed descriptions
- **Advanced Filtering**: Filter products by category, price range, and multiple criteria simultaneously
- **Product Details**: View detailed product information including ratings, reviews, and specifications
- **Responsive Design**: Fully responsive UI that works seamlessly on desktop, tablet, and mobile devices

### 🔐 Authentication & User Management
- **Supabase Authentication**: Secure user authentication with email/password
- **Protected Routes**: Automatic authentication checks for cart, checkout, and order pages
- **Session Management**: Persistent user sessions with automatic token refresh

### 🛍️ Shopping Cart
- **Add to Cart**: Easily add products with quantity selection
- **Cart Management**: Update quantities, remove items, and view cart totals in real-time
- **Persistent Cart**: Cart data synced with Supabase for persistence across sessions
- **Cart Context**: Global cart state management using React Context API

### 💳 Checkout & Orders
- **Streamlined Checkout**: Simple and intuitive checkout process
- **Order History**: View past orders with detailed information
- **Order Success Animation**: Delightful confetti animation on successful order placement

### 🎨 UI/UX
- **Modern Design**: Built with Tailwind CSS and shadcn/ui components
- **Interactive Elements**: Smooth animations and transitions
- **Loading States**: Skeleton loaders for better perceived performance
- **Toast Notifications**: User-friendly feedback for actions

## Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Reusable component library
- **[Lucide React](https://lucide.dev/)** - Icon library

### Backend & Database
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Row Level Security (RLS)

### UI Components
- **Radix UI** - Accessible component primitives
- **Canvas Confetti** - Celebration animations
- **class-variance-authority** - Component variants

## Getting Started

### Prerequisites
- Node.js 18+ installed
- A Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   
   Create the following tables in your Supabase database:
   
   **products table**:
   ```sql
   create table products (
     id uuid primary key default uuid_generate_v4(),
     title text not null,
     description text,
     price numeric not null,
     category text,
     image text,
     rating jsonb,
     created_at timestamp with time zone default now()
   );
   ```

   **cart_items table**:
   ```sql
   create table cart_items (
     id uuid primary key default uuid_generate_v4(),
     user_id uuid references auth.users(id) on delete cascade,
     product_id uuid references products(id) on delete cascade,
     quantity integer not null default 1,
     created_at timestamp with time zone default now(),
     unique(user_id, product_id)
   );
   ```

   **orders table**:
   ```sql
   create table orders (
     id uuid primary key default uuid_generate_v4(),
     user_id uuid references auth.users(id) on delete cascade,
     total numeric not null,
     status text default 'pending',
     items jsonb not null,
     created_at timestamp with time zone default now()
   );
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
my-app/
├── app/                      # Next.js App Router
│   ├── auth/                # Authentication routes
│   │   └── callback/        # OAuth callback handler
│   ├── cart/                # Shopping cart page
│   ├── checkout/            # Checkout page
│   ├── orders/              # Order history page
│   ├── products/            # Product pages
│   │   ├── [id]/           # Dynamic product detail pages
│   │   └── ...             # Product filtering components
│   ├── layout.tsx          # Root layout with navbar
│   └── page.tsx            # Home page
├── components/              # Reusable React components
│   ├── ui/                 # shadcn/ui components
│   ├── ConditionalNavbar.tsx
│   ├── LoginClient.tsx
│   ├── Navbar.tsx
│   └── OrderSuccess.tsx
├── contexts/               # React Context providers
│   └── CartContext.tsx    # Global cart state management
├── lib/                    # Utility functions and configs
│   ├── supabase/          # Supabase client configuration
│   │   ├── client.ts      # Client-side Supabase client
│   │   └── server.ts      # Server-side Supabase client
│   ├── types/             # TypeScript type definitions
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## Key Features Implementation

### Authentication Flow
The app uses Supabase Auth with server-side session management for secure authentication. Protected routes automatically redirect unauthenticated users to the login page.

### Cart Management
Cart state is managed globally using React Context, with data persisted to Supabase. The cart syncs across tabs and sessions for the same user.

### Product Filtering
Advanced filtering system allows users to filter by multiple categories and price ranges simultaneously, with instant updates.

### Server & Client Components
Strategic use of React Server Components for data fetching and Client Components for interactive features, optimizing performance and user experience.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Backend powered by [Supabase](https://supabase.com/)
