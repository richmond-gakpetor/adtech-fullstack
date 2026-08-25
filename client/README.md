# Xposure GH - Billboard Advertising Platform

A modern billboard advertising platform for Ghana, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🗺️ Interactive Google Maps integration
- ⭐ Featured billboard promotion system
- 📱 Responsive design with multiple view modes
- 🎯 Advanced filtering and search
- 💳 Payment integration with Paystack
- 🔐 Role-based access control

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Google Maps API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd adtech
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Configure Google Maps API:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the "Maps JavaScript API"
   - Create credentials (API Key)
   - Create a Map ID (required for Advanced Markers)
   - Add your domain to the API key restrictions:
     - For development: `http://localhost:3000/*`
     - For production: `https://yourdomain.com/*`
   - Add the API key and Map ID to your `.env.local` file:
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
     NEXT_PUBLIC_GOOGLE_MAPS_ID=your_map_id_here
     ```

5. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Google Maps API Setup

### Step-by-step Guide:


## Project Structure

```
adtech/
├── app/                    # Next.js app directory
│   ├── browse/            # Billboard browsing page
│   ├── billboard/         # Individual billboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── BillboardCard.tsx # Billboard display component
│   ├── MapView.tsx       # Google Maps component
│   └── Filters.tsx       # Search and filter component
├── lib/                  # Utility libraries
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── data/             # Mock data and utilities
└── public/               # Static assets
```

## Technologies Used

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS, Shadcn/ui
- **Maps:** Google Maps JavaScript API with Advanced Markers
- **Payments:** Paystack
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
NEXT_PUBLIC_GOOGLE_MAPS_ID=your_map_id_here

```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
