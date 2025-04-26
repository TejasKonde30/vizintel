# Vizintel - Data Visualization and Analytics Platform

## Overview
Vizintel is a modern web application that provides powerful data visualization and analytics capabilities. Built with React and Node.js, it offers an intuitive interface for data analysis, visualization, and reporting.

## Features
- Interactive data visualization using Chart.js and D3.js
- Real-time data updates with Socket.IO
- Secure authentication with JWT and Google OAuth
- Responsive design with Tailwind CSS
- 3D visualizations using Three.js
- Excel file import/export capabilities
- Role-based access control (Admin and User roles)
- Real-time collaboration features

## Tech Stack
### Frontend
- React 18
- Redux Toolkit for state management
- React Router for navigation
- Tailwind CSS for styling
- Chart.js and D3.js for data visualization
- Three.js for 3D visualizations
- Socket.IO client for real-time updates

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.IO for real-time communication
- Multer for file uploads
- Passport.js for OAuth integration

## Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/AniketSingh2704/Vizintel.git
cd Vizintel
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

3. Set up environment variables:
Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

4. Start the development servers:
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from root directory)
npm run dev
```

## Project Structure
```
vizintel/
├── src/                    # Frontend source code
│   ├── components/        # React components
│   ├── services/         # API services
│   ├── assets/           # Static assets
│   └── css/              # Stylesheets
├── backend/              # Backend source code
│   ├── controllers/      # Route controllers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── uploads/         # File upload directory
└── public/              # Public assets
```

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the ISC License.

## Support
For support, please open an issue in the GitHub repository or contact the development team.


## To Login admin
Manually insert a filed in the database for admin login fields should include email and password
or use postman with the api provided in the server.js file to register the admin first then you can login 
 api -> "/api/auth/superadminregister"
 fields to be included 
 name, email, password, schoolName