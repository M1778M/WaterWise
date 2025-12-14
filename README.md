# WaterWise

WaterWise is a comprehensive mobile application for water usage tracking and conservation. Built with React Native and Expo, this cross-platform application helps users monitor their water consumption, analyze usage patterns, and receive personalized recommendations for water conservation.

## Features

### Core Functionality
- **Water Usage Tracking**: Record daily water consumption with detailed categorization (shower, kitchen, garden, etc.)
- **Bill Management**: Track water bills with associated costs and consumption data
- **Real-time Analytics**: Visualize usage patterns through interactive charts and graphs
- **Personalized Recommendations**: AI-powered water conservation advisor with tailored tips
- **Weather Integration**: Regional weather data to contextualize water usage recommendations

### Advanced Features
- **Multi-language Support**: English and Persian language support with RTL layout handling
- **Data Visualization**: Interactive charts for usage trends, patterns, and savings opportunities
- **Data Export**: Export usage data in JSON or CSV formats for backup or analysis
- **Theming**: Light and dark mode support with customizable themes
- **Offline Capability**: Local-first architecture with SQLite database storage
- **Cross-platform**: Native iOS, Android, and web support via Expo

### Technical Highlights
- **Local Database**: SQLite storage with web-compatible localStorage fallback
- **API Integration**: Open-Meteo API for weather data and World Bank data for global statistics
- **Responsive UI**: Adaptive layouts for different screen sizes and orientations
- **Internationalization**: Full i18n support with language persistence
- **Performance Optimized**: Efficient data handling and caching mechanisms

## Technology Stack

- **Frontend**: React Native with TypeScript
- **Framework**: Expo SDK
- **Database**: SQLite with localStorage fallback for web
- **State Management**: React Context API
- **Navigation**: React Navigation
- **UI Components**: Custom-built with React Native primitives
- **Charts**: React Native Chart Kit
- **Internationalization**: i18n-js with AsyncStorage
- **Data Persistence**: AsyncStorage for settings and preferences
- **APIs**: Open-Meteo Weather API

## Architecture

The application follows a modular architecture with clear separation of concerns:

```
app/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── services/           # Business logic and data services
│   ├── ai/            # AI-powered recommendations
│   ├── analytics/     # Data analysis and reporting
│   ├── api/           # External API integrations
│   ├── db/            # Database operations
│   ├── export/        # Data export functionality
│   ├── location/      # Geolocation services
│   ├── notifications/ # Notification management
│   └── theme/         # Theming system
└── i18n/              # Internationalization
```

## Key Screens

1. **Dashboard**: Overview of today's usage, 30-day average, total consumption, and costs
2. **Usage Tracker**: Detailed water usage logging with time, category, and location tracking
3. **Bill Manager**: Water bill tracking with cost analysis
4. **Analytics**: Comprehensive usage reports with trends, patterns, and savings opportunities
5. **AI Advisor**: Conversational interface for water conservation recommendations
6. **Weather**: Regional weather data and drought indicators
7. **Regional/Global Stats**: Comparative water usage statistics
8. **Settings**: Theme selection, daily goals, notifications, and data export

## Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Expo CLI

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd waterwise
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### Available Scripts
- `npm start`: Starts the Expo development server
- `npm run android`: Runs the app on Android emulator/device
- `npm run ios`: Runs the app on iOS simulator/device
- `npm run web`: Runs the app in web browser
- `npm run build`: Builds the application assets

## Project Structure

```
waterwise/
├── app/                    # Main application source code
│   ├── components/         # Shared UI components
│   ├── screens/            # Application screens
│   ├── services/           # Business logic and services
│   ├── i18n/               # Internationalization files
│   └── utils/              # Utility functions
├── assets/                 # Static assets (images, icons)
├── .gitignore              # Git ignore rules
├── app.json                # Expo configuration
├── babel.config.js         # Babel configuration
├── eas.json                # Expo Application Services configuration
├── package.json            # NPM dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## Data Management

### Database Schema
The application uses a local SQLite database with three main tables:

1. **Bills Table**: Stores water bill information
   - id (TEXT, PRIMARY KEY)
   - amount (REAL)
   - date (TEXT)
   - consumptionLiters (REAL)
   - currency (TEXT)

2. **Usage Table**: Tracks daily water consumption
   - id (INTEGER, PRIMARY KEY AUTOINCREMENT)
   - liters (REAL)
   - date (TEXT)
   - time (TEXT, optional)
   - category (TEXT, optional)
   - location (TEXT, optional)
   - description (TEXT, optional)

3. **Cache Table**: API response caching
   - key (TEXT, PRIMARY KEY)
   - value (TEXT)
   - timestamp (INTEGER)

### Data Privacy
All user data is stored locally on the device. No personal information is transmitted to external servers, ensuring complete privacy and compliance with data protection regulations.

## Contributing

This project was developed as a college project and demonstrates proficiency in:
- Mobile application development with React Native
- Cross-platform compatibility
- Simple Database design and management
- API integration
- User experience design
- Internationalization

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Open-Meteo for weather data APIs
- World Bank for global water statistics
- Expo for the development framework
- React Native community for libraries and tools
