# Mess Rebate System

A comprehensive web application for managing mess rebates for student hostels and institutions. This system allows administrators to process, track, and report on mess rebates, helping both students and administration manage the mess billing process effectively.

## Table of Contents

- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Rebate Management**: Create, view, and manage student mess rebates
- **Student Database**: Store and retrieve student information
- **Authentication System**: Secure login for administrators
- **Statistics & Reports**: Generate detailed statistics and reports
- **Dynamic Pricing**: Configurable pricing for mess services
- **User-Friendly Interface**: Modern UI built with React and Tailwind CSS

## System Requirements

- **Node.js**: v14.0.0 or higher
- **MySQL**: 5.7 or higher
- **npm**: 6.0.0 or higher

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mess-rebate-system
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp ../.env.example .env

# Edit the .env file with your actual database credentials and secrets
# Using your preferred text editor
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file if needed for custom configuration
# You can use the VITE_API_BASE_URL from the .env.example file
```

## Configuration

### Environment Variables

The following environment variables can be configured in the `.env` file:

#### Database Configuration
```
DB_HOST=localhost         # Database host
DB_USER=your_db_user      # Database username
DB_PASS=your_db_password  # Database password
DB_NAME=mess_rebate       # Database name
```

#### Security
```
SESSION_SECRET=your_session_secret_key  # For encrypting session data
JWT_SECRET=your_jwt_secret_key          # For JWT authentication
```

#### System Settings
```
PRICE_PER_DAY=150.00      # Default price per day for mess services
GALA_DINNER_COST=225.00   # Default cost for gala dinners
```

#### Frontend Configuration
```
VITE_API_BASE_URL=http://localhost:5000  # Backend API URL for the frontend
```

## Usage

### Starting the Backend Server

```bash
cd backend
npm start
```

The backend server will run on http://localhost:5000 by default.

### Starting the Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend development server will run on http://localhost:5173 by default.

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# The build output will be in the 'dist' directory
```

## API Documentation

### Authentication Endpoints

- `POST /api/login` - Administrator login
- `POST /api/logout` - Administrator logout
- `GET /api/checkLoginStatus` - Check current login status

### Rebate Endpoints

- `POST /api/rebate/create` - Create a new rebate entry
- `GET /api/rebate/rebates` - Get all rebate entries
- `GET /api/rebate/rebates/:rollNo` - Get rebates for a specific student
- `GET /api/rebate/check-overlap` - Check for overlapping rebate periods

### Student Endpoints

- `GET /api/students/:rollNo` - Get student details by roll number
- `GET /api/students` - Get all students

### Statistics Endpoints

- `GET /api/statistics` - Get general statistics (supports filtering)
- `GET /api/statistics/students-by-branch` - Get student statistics grouped by branch

### Price Settings Endpoints

- `GET /api/price-settings/current` - Get current price settings
- `PUT /api/price-settings/update` - Update price settings

## Project Structure

```
mess-rebate-system/
├── backend/                   # Backend Node.js application
│   ├── config/                # Configuration files
│   ├── controllers/           # Controller functions for routes
│   ├── middleware/            # Express middleware
│   ├── models/                # Database models
│   ├── routes/                # API route definitions
│   ├── scripts/               # Utility scripts
│   ├── utils/                 # Utility functions
│   └── server.js              # Main server file
│
├── frontend/                  # Frontend React application
│   ├── public/                # Static files
│   ├── src/                   # Source code
│   │   ├── assets/            # Images, fonts, etc.
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── utils/             # Utility functions
│   │   ├── App.jsx            # Main App component
│   │   └── main.jsx           # Entry point
│   ├── index.html             # HTML template
│   └── vite.config.js         # Vite configuration
│
├── .env.example               # Example environment variables
└── README.md                  # Project documentation
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify that MySQL is running
   - Check that database credentials in `.env` file are correct
   - Ensure the specified database exists

2. **Backend API Unavailable**
   - Check that the backend server is running
   - Verify that the port (default: 5000) is not in use by another application

3. **Frontend Cannot Connect to Backend**
   - Check that the `VITE_API_BASE_URL` is correctly set
   - Ensure CORS is properly configured if running on different domains

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.