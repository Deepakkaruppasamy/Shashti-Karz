# Admin Panel Authentication

## Overview
The admin panel is now protected with password-based authentication. Users must log in before accessing any admin routes.

## Features
- **Password Protection**: Admin routes require authentication
- **Session Management**: Uses HTTP-only cookies for secure session storage
- **Auto-redirect**: Unauthenticated users are automatically redirected to login
- **Logout Functionality**: Secure logout that clears session and redirects to login

## Setup

### 1. Set Admin Password
Add the following to your `.env.local` file:

```bash
ADMIN_PASSWORD=your_secure_password_here
```

**Default password**: `admin123` (Change this in production!)

### 2. Access Admin Panel
1. Navigate to `/admin` in your browser
2. You will be automatically redirected to `/admin/login`
3. Enter the admin password
4. Click "Sign In"
5. You will be redirected to the admin dashboard

## Routes

### Protected Routes
All routes under `/admin/*` except:
- `/admin/login` - Login page (public)
- `/api/admin/auth` - Authentication API (public)

### API Endpoints

#### POST `/api/admin/auth`
Authenticate admin user
```json
{
  "password": "admin123"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Authentication successful"
}
```

**Response (Error)**:
```json
{
  "error": "Invalid password"
}
```

#### DELETE `/api/admin/auth`
Logout admin user

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Security Features

1. **HTTP-Only Cookies**: Session tokens are stored in HTTP-only cookies, preventing XSS attacks
2. **Secure Flag**: In production, cookies are marked as secure (HTTPS only)
3. **SameSite Protection**: Cookies use SameSite=Lax to prevent CSRF attacks
4. **24-Hour Session**: Sessions expire after 24 hours
5. **Middleware Protection**: All admin routes are protected at the middleware level

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── ...                    # Other admin pages (protected)
│   └── api/
│       └── admin/
│           └── auth/
│               └── route.ts       # Authentication API
├── components/
│   └── AdminSidebar.tsx           # Updated with logout functionality
└── middleware.ts                  # Route protection
```

## Testing

1. **Test Login Flow**:
   - Go to `http://localhost:3000/admin`
   - Verify redirect to `/admin/login`
   - Enter password and submit
   - Verify redirect to admin dashboard

2. **Test Protected Routes**:
   - Without logging in, try to access `/admin/packages`
   - Verify redirect to login page

3. **Test Logout**:
   - Click "Logout" button in sidebar
   - Verify redirect to login page
   - Try to access `/admin` again
   - Verify redirect to login page

## Production Deployment

### Important Security Steps:

1. **Change Default Password**:
   ```bash
   ADMIN_PASSWORD=your_very_secure_password_123!@#
   ```

2. **Use Strong Passwords**:
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Avoid common words or patterns

3. **Consider Additional Security**:
   - Implement rate limiting on login attempts
   - Add two-factor authentication (2FA)
   - Use environment-specific passwords
   - Implement IP whitelisting for admin access
   - Add audit logging for admin actions

## Troubleshooting

### Issue: Can't access admin panel
- **Solution**: Make sure you're using the correct password from `.env.local`

### Issue: Redirected to login after successful login
- **Solution**: Check browser console for errors. Ensure cookies are enabled.

### Issue: Session expires too quickly
- **Solution**: Adjust `maxAge` in `/api/admin/auth/route.ts` (currently 24 hours)

### Issue: Password not working
- **Solution**: Restart the development server after changing `.env.local`

## Future Enhancements

Consider implementing:
- [ ] Multi-user support with database-backed authentication
- [ ] Role-based access control (RBAC)
- [ ] Two-factor authentication (2FA)
- [ ] Password reset functionality
- [ ] Login attempt rate limiting
- [ ] Session management dashboard
- [ ] Activity logging and audit trails
