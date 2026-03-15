# Save this as setup.ps1 and run it

Write-Host "Setting up Face2Hire Backend..." -ForegroundColor Green

# Navigate to backend directory
cd F2H/backend

# Remove existing node_modules if any
if (Test-Path "node_modules") {
    Write-Host "Removing existing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules
}

# Remove package-lock.json if exists
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}

# Create fresh package.json
Write-Host "Creating package.json..." -ForegroundColor Cyan
@'
{
  "name": "face2hire-backend",
  "version": "1.0.0",
  "description": "Backend for Face2Hire AI Interview Simulator",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
'@ | Out-File -FilePath "package.json" -Encoding utf8

# Install packages
Write-Host "Installing packages..." -ForegroundColor Cyan
npm install

# Verify installation
Write-Host "Verifying installation..." -ForegroundColor Green
if (Test-Path "node_modules") {
    Write-Host "Successfully installed packages!" -ForegroundColor Green
    Write-Host "Installed packages:" -ForegroundColor Cyan
    Get-ChildItem node_modules | Select-Object -First 10 Name
} else {
    Write-Host "Installation failed!" -ForegroundColor Red
}

Write-Host "Backend setup complete!" -ForegroundColor Green
Write-Host "Run 'npm run dev' to start the server" -ForegroundColor Yellow