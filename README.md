
## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=your_database_name
   SESSION_SECRET=your_session_secret
   ```
4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/login` - Manager login
- `POST /api/logout` - Manager logout
- `GET /api/checkLoginStatus` - Check login status

### Student
- `GET /api/student/:roll_no` - Get student details

### Rebate
- `POST /api/rebate/create` - Create new rebate entry
- `GET /api/rebate/rebates` - Get all rebate entries

## Contributing

This project is currently under development. More features will be added in future updates.

## License

[MIT License](LICENSE)