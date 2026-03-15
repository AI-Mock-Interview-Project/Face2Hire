# Face2Hire Backend API

A comprehensive backend API for the Face2Hire AI Interview Preparation Platform, built with Node.js, Express, and MongoDB.

## Features

- **User Authentication & Authorization**: JWT-based authentication with refresh tokens
- **Interview Management**: Create, manage, and track interview sessions
- **Question Bank**: Dynamic question management with AI integration
- **Results & Analytics**: Comprehensive interview results and performance analytics
- **File Upload**: Support for job descriptions, avatars, and audio recordings
- **Real-time Communication**: Socket.IO integration for live interviews
- **AI Integration**: Google Gemini AI for interview analysis and feedback

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Real-time**: Socket.IO
- **AI**: Google Generative AI (Gemini)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd F2H/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the `.env` file and update the values:
   ```bash
   cp .env.example .env
   ```

   Update the following variables in `.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/face2hire
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-token-secret
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Start MongoDB:**
   Make sure MongoDB is running on your system.

5. **Seed the database with questions:**
   ```bash
   npm run seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users/profile` - Get user profile with statistics
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users/achievements` - Get user achievements
- `DELETE /api/users/account` - Delete user account

### Interviews
- `GET /api/interviews` - Get user's interviews
- `GET /api/interviews/:id` - Get single interview
- `POST /api/interviews` - Create new interview
- `PUT /api/interviews/:id/start` - Start interview
- `PUT /api/interviews/:id/response` - Submit response
- `PUT /api/interviews/:id/complete` - Complete interview
- `DELETE /api/interviews/:id` - Delete interview
- `GET /api/interviews/stats/overview` - Get interview statistics

### Questions
- `GET /api/questions` - Get questions with filters
- `GET /api/questions/random` - Get random questions
- `GET /api/questions/:id` - Get single question
- `POST /api/questions` - Create question (Admin)
- `PUT /api/questions/:id` - Update question (Admin)
- `DELETE /api/questions/:id` - Delete question (Admin)
- `GET /api/questions/stats/overview` - Get question statistics

### Results
- `GET /api/results` - Get user's results
- `GET /api/results/:id` - Get single result
- `GET /api/results/shared/:shareId` - Get shared result (Public)
- `POST /api/results` - Create result from interview
- `PUT /api/results/:id/share` - Make result shareable
- `PUT /api/results/:id/unshare` - Make result private
- `DELETE /api/results/:id` - Delete result

### Upload
- `POST /api/upload/job-description` - Upload job description file
- `POST /api/upload/avatar` - Upload user avatar
- `POST /api/upload/audio` - Upload audio recording
- `DELETE /api/upload/:filename` - Delete uploaded file

## Database Models

### User
- Authentication and profile information
- Avatar, preferences, and statistics

### Interview
- Interview sessions with questions and responses
- Real-time metrics and AI analysis
- Status tracking and metadata

### Question
- Interview questions with metadata
- Usage statistics and AI prompts
- Categorization and difficulty levels

### Result
- Interview results and performance analytics
- Trends, badges, and feedback
- Shareable public results

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed database with initial questions
- `npm run seed:clear` - Clear all questions and reseed
- `npm test` - Run tests

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/face2hire |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | 15m |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `JWT_REFRESH_EXPIRE` | Refresh token expiration | 7d |
| `GEMINI_API_KEY` | Google Gemini AI API key | - |
| `MAX_FILE_SIZE` | Maximum file upload size | 10485760 |
| `FRONTEND_URL` | Frontend application URL | http://localhost:3000 |

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing control
- **Rate Limiting**: API rate limiting
- **Input Validation**: Request validation with express-validator
- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **File Upload Security**: Type and size validation

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"] // for validation errors
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository.
