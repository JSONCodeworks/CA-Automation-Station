# CA Automation Station

A comprehensive enterprise portal for CyberArk automation, resource provisioning, and reporting.

## Features

- **Modern UI**: Dark, sleek, sophisticated design with React and Tailwind CSS
- **Authentication**: Local user authentication + CyberArk SSO integration
- **Role-Based Access Control**: Admin panel with user role management
- **Dynamic Navigation**: Database-driven menu system
- **Resource Management**: Create and track provisioned resources
- **Slack Integration**: Notify teams about automation events
- **AWS Integration**: Hosted on AWS with full infrastructure support
- **MSSQL Database**: Robust data storage and management

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Material-UI components and icons
- Zustand for state management
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- Passport.js for authentication (Local + SAML/SSO)
- MSSQL database with connection pooling
- JWT tokens for API security
- Winston for logging
- Slack Web API for notifications

### Infrastructure
- AWS (US-West-1 region)
- GitHub for version control
- AWS CodePipeline for CI/CD (optional)

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MSSQL Server access
- AWS account (for deployment)
- GitHub account
- CyberArk Identity tenant (for SSO)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/JSONCodeworks/CA-Automation-Station.git
cd CA-Automation-Station
```

2. **Setup Database**
```bash
# Connect to your MSSQL server and run
cd database
# Execute schema.sql to create all tables
```

3. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

4. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Default Admin Credentials
- **Username**: admin@jsoncloudworks.com
- **Password**: T3@mw0rK!

**⚠️ IMPORTANT**: Change the default password immediately after first login!

## Configuration

### Environment Variables (Backend)

Key environment variables to configure:

```bash
# Database
DB_SERVER=your-mssql-server.rds.amazonaws.com
DB_DATABASE=CAAutomationStation
DB_USER=admin
DB_PASSWORD=your-password

# CyberArk SSO
SSO_ENABLED=true
CYBERARK_TENANT_URL=https://your-tenant.cyberark.cloud
CYBERARK_CLIENT_ID=your-client-id
CYBERARK_CLIENT_SECRET=your-client-secret

# AWS
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Slack (optional)
SLACK_ENABLED=true
SLACK_BOT_TOKEN=xoxb-your-token
```

## Project Structure

```
ca-automation-station/
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── store/      # State management
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
├── backend/            # Node.js/Express API
│   ├── config/         # Configuration files
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── server.js       # Entry point
├── database/           # SQL scripts
│   └── schema.sql      # Database schema
├── infrastructure/     # AWS/IaC scripts
└── docs/              # Documentation
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Local login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/sso/cyberark` - Initiate SSO login
- `POST /api/auth/sso/cyberark/callback` - SSO callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Menu Endpoints
- `GET /api/menu/main` - Get main navigation menu

### Configuration Endpoints
- `GET /api/config` - Get all configuration
- `PUT /api/config/:key` - Update configuration (admin)

### Resource Endpoints
- `GET /api/resources` - Get all resources
- `POST /api/resources` - Create new resource

### Admin Endpoints
- `GET /api/admin/users` - Get all users (admin)
- `POST /api/admin/users/:userId/roles` - Assign role (admin)
- `DELETE /api/admin/users/:userId/roles/:roleName` - Remove role (admin)

## Security Considerations

**CRITICAL**: After setup, immediately:
1. Rotate all credentials uploaded during setup
2. Change default admin password
3. Configure AWS security groups properly
4. Enable AWS Secrets Manager for credential storage
5. Set up SSL/TLS certificates for production
6. Review and restrict API rate limits
7. Enable audit logging

## AWS Deployment

The application is designed to be deployed on AWS infrastructure:

- **Compute**: AWS Elastic Beanstalk or ECS
- **Database**: AWS RDS (MSSQL)
- **Storage**: AWS S3 for assets
- **CI/CD**: AWS CodePipeline + GitHub integration
- **Networking**: VPC with security groups

Detailed deployment instructions are in the `/infrastructure` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/JSONCodeworks/CA-Automation-Station/issues
- Email: admin@jsoncodeworks.com

## Acknowledgments

- CyberArk Identity for SSO capabilities
- AWS for cloud infrastructure
- The open-source community
