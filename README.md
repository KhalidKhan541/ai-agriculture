# AI Agriculture Platform

[![CI](https://github.com/your-org/ai-agriculture/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/ai-agriculture/actions/workflows/ci.yml)
[![CD](https://github.com/your-org/ai-agriculture/actions/workflows/cd.yml/badge.svg)](https://github.com/your-org/ai-agriculture/actions/workflows/cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An intelligent agriculture management platform powered by AI, providing crop monitoring, yield prediction, pest detection, and smart farming recommendations.

## Features

### Core Features

- **Farm Management** - Manage multiple farms with detailed information
- **Crop Tracking** - Track crop growth stages, health, and harvest data
- **Soil Analysis** - Monitor soil health and get improvement recommendations
- **Irrigation Control** - Smart irrigation scheduling and water usage optimization
- **Harvest Management** - Track harvests, quality, and sales

### AI-Powered Features

- **Crop Monitoring** - Real-time health monitoring using image analysis
- **Yield Prediction** - ML-based yield forecasting with confidence intervals
- **Pest Detection** - Automatic pest identification from images
- **Disease Detection** - Early disease detection and prevention
- **Growth Stage Tracking** - Automated growth stage classification

### Weather & Market

- **Weather Integration** - Real-time weather data and forecasts
- **Weather Alerts** - Severe weather notifications and recommendations
- **Market Prices** - Live market price tracking and trends
- **Buyer Matching** - Connect with potential buyers

### Equipment Management

- **Equipment Tracking** - Monitor farm equipment status and usage
- **Maintenance Scheduling** - Automated maintenance reminders
- **Cost Tracking** - Track equipment costs and depreciation

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL, Redis
- **AI/ML**: OpenAI API, TensorFlow.js
- **Authentication**: NextAuth.js
- **Testing**: Jest, React Testing Library
- **Deployment**: Docker, GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/ai-agriculture.git
cd ai-agriculture
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_agriculture
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
WEATHER_API_KEY=your-weather-api-key
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Seed the database:

```bash
npm run seed
```

6. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Docker Setup

```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

## Project Structure

```
ai-agriculture/
├── __tests__/           # Test files
│   ├── api/            # API route tests
│   ├── components/     # Component tests
│   ├── farm/           # Farm service tests
│   ├── crops/          # Crop service tests
│   ├── soil/           # Soil service tests
│   ├── irrigation/     # Irrigation service tests
│   ├── harvest/        # Harvest service tests
│   ├── ai/             # AI service tests
│   ├── weather/        # Weather service tests
│   ├── market/         # Market service tests
│   ├── equipment/      # Equipment service tests
│   └── lib/            # Utility tests
├── prisma/             # Database schema
├── src/
│   ├── components/     # React components
│   ├── pages/          # Next.js pages
│   ├── services/       # Business logic
│   ├── dto/            # Data transfer objects
│   ├── lib/            # Utilities
│   └── types/          # TypeScript types
├── public/             # Static assets
├── .github/workflows/  # CI/CD pipelines
└── docker/             # Docker configuration
```

## API Documentation

### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password",
  "name": "John Farmer"
}

# Login
POST /api/auth/signin
{
  "email": "user@example.com",
  "password": "password"
}
```

### Farms

```bash
# Get all farms
GET /api/farms

# Create farm
POST /api/farms
{
  "name": "Green Valley Farm",
  "location": "California, USA",
  "latitude": 36.7783,
  "longitude": -119.4179,
  "area": 500,
  "areaUnit": "acres",
  "soilType": "loamy"
}
```

### Crops

```bash
# Get crops
GET /api/crops?farmId=farm-1

# Create crop
POST /api/crops
{
  "name": "Tomato Plot A",
  "cropTypeId": "type-1",
  "farmId": "farm-1",
  "plantedDate": "2024-03-01",
  "area": 2.5,
  "areaUnit": "hectares"
}
```

### AI Features

```bash
# Analyze crop image
POST /api/ai/monitoring
{
  "cropId": "crop-1",
  "imageUrl": "https://example.com/image.jpg"
}

# Predict yield
POST /api/ai/predictions
{
  "cropId": "crop-1"
}

# Detect pests
POST /api/ai/pest-detection
{
  "cropId": "crop-1",
  "imageUrl": "https://example.com/pest-image.jpg"
}
```

## Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: [docs.agriculture-app.com](https://docs.agriculture-app.com)
- Issues: [GitHub Issues](https://github.com/your-org/ai-agriculture/issues)
- Email: support@agriculture-app.com
