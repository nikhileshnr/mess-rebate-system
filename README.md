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
- [Database Setup](#database-setup)
  - [Creating the Database](#creating-the-database)
  - [Database Schema](#database-schema)
  - [Sample Data (Optional)](#sample-data-optional)
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
- **Statistics & Reports**: Generate detailed statistics and reports with interactive charts
- **Dynamic Pricing**: Configurable pricing for mess services
- **User-Friendly Interface**: Modern UI built with React and Tailwind CSS
- **Data Export**: Export rebate data to Excel for further analysis
- **Responsive Design**: Works on desktop and mobile devices

## System Requirements

- **Node.js**: v16.0.0 or higher
- **MySQL**: 5.7 or higher
- **npm**: 7.0.0 or higher

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

## Database Setup

### Creating the Database

```sql
CREATE DATABASE mess_rebate;
USE mess_rebate;
```

### Database Schema

You'll need to set up the following tables in your MySQL database:

1. **Mess Managers Table**
```sql
CREATE TABLE mess_managers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
```

2. **Students Table**
```sql
CREATE TABLE students (
    roll_no VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile_no VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    branch VARCHAR(50) NOT NULL,
    batch INT NOT NULL
);
```

3. **Rebates Table**
```sql
CREATE TABLE rebates (
    roll_no VARCHAR(10),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rebate_days INT NOT NULL,
    PRIMARY KEY (roll_no, start_date),
    FOREIGN KEY (roll_no) REFERENCES students(roll_no) ON DELETE CASCADE
);
```

### Sample Data (Optional)

To test the system, you can populate the database with sample data:

```sql
-- Insert default admin
INSERT INTO mess_managers (username, password) 
VALUES ('admin', '$2a$10$6HKjduvnCrA6HcQT9Oe6C.ECRwKLRjZULncNKJGjlFvWzS4.xnmLy'); -- password: admin123

-- Insert sample students
INSERT INTO students (roll_no, name, mobile_no, email, branch, batch) VALUES
('2023001', 'John Doe', '9876543210', 'john@example.com', 'Computer Science', 2023),
('2023002', 'Jane Smith', '9876543211', 'jane@example.com', 'Electrical Engineering', 2023),
('2023003', 'Bob Johnson', '9876543212', 'bob@example.com', 'Mechanical Engineering', 2023);

-- Insert sample rebates
INSERT INTO rebates (roll_no, start_date, end_date, rebate_days) VALUES
('2023001', '2023-09-01', '2023-09-05', 5),
('2023002', '2023-09-10', '2023-09-15', 6),
('2023003', '2023-09-20', '2023-09-22', 3);
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
│   ├── dto/                   # Data Transfer Objects
│   ├── errors/                # Error handling
│   ├── middleware/            # Express middleware
│   ├── migrations/            # Database migrations
│   ├── models/                # Database models
│   ├── repositories/          # Data access layer
│   ├── routes/                # API route definitions
│   ├── scripts/               # Utility scripts
│   ├── services/              # Business logic
│   ├── utils/                 # Utility functions
│   ├── validators/            # Request validation
│   └── server.js              # Main server file
├── frontend/                  # Frontend React application
│   ├── public/                # Static assets
│   └── src/                   # Source code
│       ├── assets/            # Images and other assets
│       ├── components/        # Reusable UI components
│       ├── pages/             # Page components
│       ├── utils/             # Utility functions
│       ├── App.jsx            # Main App component
│       ├── api.js             # API communication
│       ├── index.js           # Application core functions
│       ├── vite.config.js     # Vite configuration
│       └── main.jsx           # Application entry point
```

## Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MySQL** - Database
- **Sequelize** - ORM for database operations
- **JWT** - Authentication

### Frontend
- **React 19** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **Axios** - HTTP client
- **ExcelJS** - Excel file generation
- **Vite** - Build tool and dev server

## Troubleshooting

### Common Issues

#### Backend Connection Issues
- Ensure MySQL is running
- Check `.env` file for correct database credentials
- Verify network connectivity if using a remote database

#### Frontend API Connection
- Check that the backend server is running
- Verify the `VITE_API_BASE_URL` points to the correct backend URL
- Check browser console for CORS errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.