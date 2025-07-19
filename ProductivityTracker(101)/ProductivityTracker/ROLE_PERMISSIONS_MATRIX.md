# Complete Role-Based Access Control (RBAC) Permissions Matrix

## Overview
This document provides a comprehensive guide to all user roles and their specific permissions in the HR Management System. Each role has been carefully designed to provide appropriate access levels while maintaining security and data integrity.

## Role Hierarchy & Access Levels

### 1. Admin (System Administrator)
**Full system access with complete administrative privileges**

#### Core Features Access:
- ✅ **Dashboard**: Complete dashboard with all widgets and statistics
- ✅ **Projects**: Full CRUD operations (create, read, update, delete)
- ✅ **Staff Management**: Full access to all staff operations
- ✅ **Client Management**: Complete client management capabilities
- ✅ **Task Management**: Full task creation, assignment, and tracking
- ✅ **Attendance**: Complete attendance management and reporting
- ✅ **Leave Requests**: Full leave request management and approval
- ✅ **Residency Management**: Complete residence permit tracking
- ✅ **Notifications**: Full notification management
- ✅ **Reports**: All reporting capabilities

#### Specific Permissions:
- **staff.create**: ✅ Can create new employees
- **staff.read**: ✅ Can view all employee data
- **staff.update**: ✅ Can modify employee information
- **staff.delete**: ✅ Can delete employees
- **staff.manage**: ✅ Full staff management capabilities
- **attendance.view**: ✅ Can view all attendance records
- **attendance.create**: ✅ Can create attendance records
- **attendance.manage**: ✅ Can manage attendance for all staff
- **projects.create**: ✅ Can create new projects
- **projects.manage**: ✅ Full project management
- **residency.view**: ✅ Can view residence permits
- **residency.manage**: ✅ Can manage residence renewals
- **leave_requests.approve**: ✅ Can approve/reject leave requests
- **reports.generate**: ✅ Can generate all reports

### 2. HR Manager (Human Resources Manager)
**Comprehensive HR functionality with staff management focus**

#### Core Features Access:
- ✅ **Dashboard**: HR-focused dashboard with leave requests and attendance widgets
- ✅ **Staff Management**: Full staff management capabilities
- ✅ **Attendance**: Complete attendance tracking and manual entry
- ✅ **Leave Requests**: Full leave request management
- ✅ **Residency Management**: Complete residence permit tracking
- ✅ **Notifications**: HR-related notifications
- ✅ **Reports**: HR and attendance reports
- ❌ **Project Management**: Limited to viewing assigned projects only
- ❌ **Client Management**: View-only access

#### Specific Permissions:
- **staff.create**: ✅ Can create new employees
- **staff.read**: ✅ Can view all employee data
- **staff.update**: ✅ Can modify employee information
- **staff.manage**: ✅ Full staff management capabilities
- **attendance.view**: ✅ Can view all attendance records
- **attendance.create**: ✅ Can create attendance records
- **attendance.manage**: ✅ Can manage attendance for all staff
- **residency.view**: ✅ Can view residence permits
- **residency.manage**: ✅ Can manage residence renewals
- **leave_requests.approve**: ✅ Can approve/reject leave requests
- **reports.generate**: ✅ Can generate HR reports

### 3. General Manager
**Strategic oversight with project and staff management focus**

#### Core Features Access:
- ✅ **Dashboard**: Management dashboard with project and staff overview
- ✅ **Projects**: Full project management capabilities
- ✅ **Staff Management**: Full staff management
- ✅ **Attendance**: View and manage attendance
- ✅ **Leave Requests**: Full leave request approval
- ✅ **Residency Management**: Complete residence permit tracking
- ✅ **Reports**: All management reports
- ✅ **Client Management**: Complete client management

#### Specific Permissions:
- **staff.create**: ✅ Can create new employees
- **staff.manage**: ✅ Full staff management capabilities
- **projects.create**: ✅ Can create new projects
- **projects.manage**: ✅ Full project management
- **attendance.view**: ✅ Can view all attendance records
- **attendance.manage**: ✅ Can manage attendance
- **residency.view**: ✅ Can view residence permits
- **residency.manage**: ✅ Can manage residence renewals
- **leave_requests.approve**: ✅ Can approve/reject leave requests
- **reports.generate**: ✅ Can generate all reports

### 4. Project Manager
**Project-focused access with limited staff management**

#### Core Features Access:
- ✅ **Dashboard**: Project-focused dashboard
- ✅ **Projects**: Full access to assigned projects only
- ✅ **Task Management**: Full task management for assigned projects
- ✅ **Staff Management**: Limited to assigned project team members
- ✅ **Attendance**: View attendance for assigned team members
- ✅ **Reports**: Project-specific reports
- ❌ **Leave Requests**: Cannot approve leave requests
- ❌ **Residency Management**: No access
- ❌ **Client Management**: View-only access

#### Specific Permissions:
- **projects.manage**: ✅ Can manage assigned projects
- **staff.read**: ✅ Can view assigned team members
- **attendance.view**: ✅ Can view team attendance
- **tasks.create**: ✅ Can create and assign tasks
- **tasks.manage**: ✅ Can manage project tasks

### 5. Engineer
**Individual contributor with limited access to own data**

#### Core Features Access:
- ❌ **Dashboard**: Redirected to Projects page
- ✅ **Projects**: View assigned projects only
- ✅ **Task Management**: View and update assigned tasks
- ✅ **Attendance**: View own attendance records only
- ✅ **Leave Requests**: Can submit leave requests
- ✅ **Profile**: Can view and update own profile
- ❌ **Staff Management**: No access
- ❌ **Residency Management**: No access
- ❌ **Reports**: No access

#### Specific Permissions:
- **projects.view**: ✅ Can view assigned projects
- **tasks.view**: ✅ Can view assigned tasks
- **tasks.update**: ✅ Can update task status
- **attendance.view**: ✅ Can view own attendance only
- **leave_requests.create**: ✅ Can submit leave requests
- **profile.update**: ✅ Can update own profile

### 6. Admin Staff
**Basic administrative support with limited access**

#### Core Features Access:
- ✅ **Dashboard**: Basic dashboard with limited widgets
- ✅ **Projects**: View-only access
- ✅ **Staff Management**: View-only access
- ✅ **Attendance**: View own attendance only
- ✅ **Leave Requests**: Can submit leave requests
- ❌ **Residency Management**: No access
- ❌ **Client Management**: No access
- ❌ **Reports**: No access

#### Specific Permissions:
- **projects.view**: ✅ Can view projects
- **staff.read**: ✅ Can view staff directory
- **attendance.view**: ✅ Can view own attendance only
- **leave_requests.create**: ✅ Can submit leave requests

## Critical HR/Admin Features Summary

### 1. ✅ **Leave Requests Dashboard Widget**
- **Who can see**: Admin, HR Manager, General Manager
- **Location**: Dashboard sidebar
- **Functionality**: Shows pending leave requests with employee details, dates, and reason
- **Actions**: Click to view full leave management page

### 2. ✅ **Residency Management Access**
- **Who can access**: Admin, HR Manager, General Manager
- **Location**: Sidebar navigation → "إدارة الإقامات"
- **Functionality**: View expiring residence permits, manage renewals
- **Fixed**: Proper RBAC permissions with 'residency.manage' feature

### 3. ✅ **Manual Attendance Entry**
- **Who can access**: Admin, HR Manager, General Manager
- **Location**: Attendance page → "تسجيل حضور يدوي" button
- **Functionality**: Select employee, date, time, and attendance status
- **Features**: Calendar picker, time selectors, presence/absence toggle

### 4. ✅ **Staff Creation**
- **Who can create**: Admin, HR Manager, General Manager
- **Location**: Staff page → "إضافة موظف" button
- **Functionality**: Create new employees with all role assignments
- **Features**: Complete form with residence tracking for non-Saudi employees

## API Endpoints Security

All endpoints are protected with session-based authentication and role-based authorization:

### Staff Management
- `POST /api/users` - Create new employee (Admin, HR Manager, General Manager)
- `GET /api/users` - View all employees (Admin, HR Manager, General Manager)
- `PATCH /api/users/:id` - Update employee (Admin, HR Manager, General Manager)

### Attendance Management
- `GET /api/attendance/daily` - View daily attendance (Admin, HR Manager)
- `POST /api/attendance` - Create attendance record (Admin, HR Manager)

### Leave Requests
- `GET /api/leave-requests` - View leave requests (Admin, HR Manager, General Manager)
- `POST /api/leave-requests` - Create leave request (All roles)
- `PATCH /api/leave-requests/:id` - Approve/reject (Admin, HR Manager, General Manager)

### Residency Management
- `GET /api/residence/expiring` - View expiring permits (Admin, HR Manager, General Manager)
- `POST /api/residence/renewal` - Process renewal (Admin, HR Manager, General Manager)

## Testing Credentials

### Admin User
- **Username**: admin
- **Password**: admin123
- **Access**: Full system access

### HR Manager User
- **Username**: hrmanager
- **Password**: password123
- **Access**: Full HR functionality

### General Manager User
- **Username**: generalmanager
- **Password**: password123
- **Access**: Full management access

## Verification Results

All 4 critical production issues have been tested and verified:

1. ✅ **Frontend Error Fixed**: ResidenceManagement.tsx no longer crashes
2. ✅ **Residency Access Fixed**: HR Manager can access residence management
3. ✅ **Attendance Management Enhanced**: Manual date/time entry working
4. ✅ **Leave Requests Dashboard**: Widget showing in HR Manager dashboard
5. ✅ **User Creation Working**: HR Manager can create new employees

## Production Status: ✅ FULLY OPERATIONAL

All critical HR and Admin functionalities are now working correctly with proper role-based access control, comprehensive error handling, and production-ready stability.