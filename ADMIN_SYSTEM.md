# TimeRent Admin System Documentation

## Overview

The TimeRent Admin System provides comprehensive administrative capabilities for managing the platform, including user management, content moderation, system settings, and crisis intervention features.

## 🚀 Quick Start

### Access Admin Portal
1. Navigate to: `http://localhost:3000/admin/login`
2. Use demo credentials (see below)
3. Access all admin features from the dashboard

### Demo Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@timerent.com | admin123 | Full access |
| **Moderator** | mod@timerent.com | mod123 | Content moderation |
| **Listener 1** | listener1@timerent.com | listener123 | Time Giver |
| **Listener 2** | listener2@timerent.com | listener123 | Time Giver |
| **Listener 3** | listener3@timerent.com | listener123 | Time Giver |
| **Listener 4** | listener4@timerent.com | listener123 | Time Giver |
| **Listener 5** | listener5@timerent.com | listener123 | Both |
| **Seeker 1** | seeker1@timerent.com | seeker123 | Time Seeker |
| **Seeker 2** | seeker2@timerent.com | seeker123 | Time Seeker |
| **Seeker 3** | seeker3@timerent.com | seeker123 | Time Seeker |
| **Seeker 4** | seeker4@timerent.com | seeker123 | Both |
| **Seeker 5** | seeker5@timerent.com | seeker123 | Time Seeker |

## 🏗️ System Architecture

### Database Models

#### Core Admin Models
- **AdminAction**: Tracks all administrative actions with audit trail
- **SystemSettings**: Platform configuration and settings
- **ContentModeration**: Content review and approval workflow
- **SystemLog**: System events and debugging logs

#### User Roles
- **ADMIN**: Full system access
- **MODERATOR**: Content moderation and user management
- **TIME_GIVER**: Can provide time/companionship
- **TIME_SEEKER**: Can seek time/companionship  
- **BOTH**: Can both give and seek time

### API Endpoints

#### Authentication
- `POST /api/admin/auth/login` - Admin login

#### Dashboard
- `GET /api/admin/dashboard` - Platform statistics and overview

#### User Management
- `GET /api/admin/users` - List users with filtering
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users` - Update user (ban, suspend, verify)

#### Content Moderation
- `GET /api/admin/content` - List content requiring moderation
- `POST /api/admin/content` - Approve/reject content

#### System Settings
- `GET /api/admin/settings` - Retrieve system settings
- `POST /api/admin/settings` - Create new setting
- `PUT /api/admin/settings` - Update existing setting

## 🎯 Features

### 1. Dashboard
- **Real-time Statistics**: User counts, session data, revenue tracking
- **Activity Monitoring**: Recent system events and logs
- **Quick Actions**: Direct access to common admin tasks
- **Visual Analytics**: Charts and graphs for platform metrics

### 2. User Management
- **User Directory**: Complete user listing with search and filters
- **Role Management**: Assign and modify user roles
- **Account Actions**: Ban, suspend, verify users
- **Profile Viewing**: Detailed user information and activity

### 3. Content Moderation
- **Queue Management**: Review pending content
- **Bulk Actions**: Approve/reject multiple items
- **Content Types**: Forum posts, experiences, replies
- **Moderation History**: Track all moderation decisions

### 4. System Settings
- **Platform Configuration**: Fees, session limits, features
- **Safety Settings**: Crisis protocols, emergency contacts
- **Payment Settings**: Revenue sharing, withdrawal limits
- **Feature Toggles**: Enable/disable platform features

### 5. Crisis Management
- **Professional Network**: Mental health professionals
- **Intervention Protocols**: Step-by-step crisis response
- **Emergency Contacts**: User-configurable support network
- **Reporting System**: Track and resolve crisis incidents

### 6. Audit & Logging
- **Action Logging**: All admin actions are tracked
- **System Events**: Platform events and errors
- **Access Logs**: User login and activity tracking
- **Data Export**: Export logs for analysis

## 🔧 Setup & Development

### Database Seeding
```bash
# Generate demo data and accounts
bun run db:seed
```

### Environment Variables
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App Settings
NODE_ENV=development
```

### Admin Authentication
- Uses token-based authentication
- Tokens expire after 24 hours
- Middleware protects all admin routes
- Role-based access control

## 🛡️ Security Features

### Authentication
- Secure password hashing with bcrypt
- Token-based session management
- Automatic logout on token expiration
- Route protection with middleware

### Authorization
- Role-based access control
- Permission checking for all admin actions
- Audit trail for all administrative changes
- IP and user agent logging

### Data Protection
- Input validation and sanitization
- SQL injection prevention with Prisma ORM
- XSS protection with React
- CSRF protection with Next.js

## 📊 Demo Data

The seed script creates comprehensive demo data:

### Users (12 total)
- 1 Admin, 1 Moderator
- 5 Time Givers with different specializations
- 5 Time Seekers with various needs
- Realistic profiles and availability

### Content
- 15+ forum posts across different categories
- 25+ forum replies and discussions
- Various content statuses for moderation testing

### Sessions
- 20+ sample sessions with different statuses
- Realistic scheduling and completion data
- Ratings and feedback for completed sessions

### System Data
- 8 default system settings
- 3 professional backup contacts
- 2 crisis intervention protocols
- 20+ system log entries

## 🎨 UI Components

### Admin Layout
- Responsive sidebar navigation
- Mobile-friendly design
- User profile and quick logout
- Breadcrumb navigation

### Dashboard
- Statistical cards with trends
- Recent activity feed
- Quick action buttons
- Session status breakdown

### User Management
- Searchable and filterable user table
- Role badges and status indicators
- Bulk action capabilities
- Pagination for large datasets

## 🔄 Workflow Examples

### User Onboarding
1. Admin creates new user account
2. Assign appropriate role (TIME_GIVER/TIME_SEEKER)
3. User receives login credentials
4. User can access platform based on role

### Content Moderation
1. User creates content (forum post/experience)
2. System flags content for review
3. Moderator reviews and approves/rejects
4. Action is logged in audit trail

### Crisis Response
1. User reports crisis or system detects
2. Appropriate protocol is activated
3. Professional backup is notified
4. Resolution is documented

## 🚀 Deployment

### Production Setup
1. Set production environment variables
2. Run database migrations
3. Seed initial admin account
4. Configure domain and SSL
5. Set up monitoring and backups

### Monitoring
- System health checks
- Error tracking and alerting
- Performance metrics
- User activity analytics

## 📝 API Documentation

### Authentication Header
```
Authorization: Bearer <admin_token>
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Handling
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 500: Internal Server Error

## 🤝 Support

### Admin Support
- Check system logs for errors
- Review audit trail for issues
- Use crisis protocols for emergencies
- Contact technical support for system issues

### User Support
- Monitor user feedback and ratings
- Review content moderation queue
- Respond to crisis reports promptly
- Manage user disputes and conflicts

---

**Note**: This admin system is designed for comprehensive platform management while maintaining security, auditability, and ease of use for administrators.