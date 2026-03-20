# GroceryTrackBD

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) application for grocery tracking and management.

## Features

- User authentication (local and Google OAuth)
- Role-based access control (user/admin)
- User profile management
- Admin dashboard
- Modern UI with Material-UI

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd grocerytrackbd
```

### 2. Install dependencies

#### Server dependencies
```bash
cd server
npm install
```

#### Client dependencies
```bash
cd ../client
npm install
```

### 3. Environment Setup

#### Server Environment Variables
Create a `.env` file in the `server` directory with the following variables:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/grocerytrackbd

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

#### Client Environment Variables
Create a `.env` file in the `client` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
```

### 5. Run the application

#### Development mode (both server and client)
```bash
# From the root directory
npm run dev
```

#### Run server only
```bash
cd server
npm start
```

#### Run client only
```bash
cd client
npm start
```

## Running with WSL (Windows Subsystem for Linux)

### 1. Install WSL
```bash
# Open PowerShell as Administrator and run:
wsl --install
```

### 2. Install Node.js in WSL
```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install MongoDB in WSL
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 4. Run the application in WSL
```bash
# Navigate to your project directory
cd /mnt/d/Documents/CSE471/Lab\ Project/grocerytrackbd

# Install dependencies
cd server && npm install
cd ../client && npm install

# Start the application
cd ..
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check if the connection string is correct
   - Verify MongoDB is installed and accessible

2. **Port Already in Use**
   - Change the PORT in the .env file
   - Kill processes using the port: `lsof -ti:5000 | xargs kill -9`

3. **Module Not Found Errors**
   - Run `npm install` in both server and client directories
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

4. **CORS Errors**
   - Ensure the proxy is set correctly in client/package.json
   - Check that the server is running on the correct port

5. **JWT Token Issues**
   - Verify JWT_SECRET is set in the environment
   - Check token expiration

### WSL Specific Issues

1. **File Permission Errors**
   ```bash
   sudo chown -R $USER:$USER /mnt/d/Documents/CSE471/Lab\ Project/
   ```

2. **Windows Path Issues**
   - Use WSL paths instead of Windows paths
   - Access Windows files through `/mnt/c/` or `/mnt/d/`

3. **Node.js Version Issues**
   ```bash
   # Use nvm to manage Node.js versions
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

## Development

### Project Structure
```
grocerytrackbd/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── context/      # React context
│   └── package.json
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   └── server.js        # Main server file
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License 