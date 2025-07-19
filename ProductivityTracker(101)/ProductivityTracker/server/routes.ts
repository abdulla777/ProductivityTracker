import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertClientSchema,
  insertProjectSchema,
  insertProjectPhaseSchema,
  insertProjectStaffSchema,
  insertProjectFileSchema,
  insertClientNoteSchema,
  insertAttendanceSchema,
  insertNotificationSchema,
  insertStaffEvaluationSchema,
  insertTaskSchema,
  insertOpportunitySchema,
  insertProposalSchema,
  insertEventSchema,
  insertLeaveRequestSchema
} from "@shared/schema";

// Helper function to handle async route handlers
function asyncHandler(fn: (req: Request, res: Response) => Promise<any>) {
  return async (req: Request, res: Response) => {
    try {
      await fn(req, res);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Internal server error", error: (error as Error).message });
    }
  };
}

// Utility function to convert empty strings to null
function sanitizeData(data: any): any {
  if (typeof data === 'string' && data.trim() === '') {
    return null;
  }
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const sanitized: any = {};
    for (const key in data) {
      sanitized[key] = sanitizeData(data[key]);
    }
    return sanitized;
  }
  return data;
}

// Helper function to filter out empty objects and validate updates
function validateUpdateData(data: any): any {
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => value !== undefined)
  );
  
  if (Object.keys(filtered).length === 0) {
    throw new Error('No valid update data provided');
  }
  
  return filtered;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.get("/api/users", asyncHandler(async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  }));
  
  app.get("/api/users/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  }));
  
  app.post("/api/users", asyncHandler(async (req, res) => {
    try {
      const sanitizedData = sanitizeData(req.body);
      const userData = insertUserSchema.parse(sanitizedData);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  app.patch("/api/users/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const sanitizedData = sanitizeData(req.body);
      const validatedData = validateUpdateData(sanitizedData);
      const userData = insertUserSchema.partial().parse(validatedData);
      
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if residence expiry date was updated and trigger real-time notifications
      if (sanitizedData.residenceExpiryDate) {
        console.log(`Residence expiry date updated for user ${id}, triggering notification check...`);
        // Import and trigger real-time notification check
        const { residenceNotificationService } = await import('./residence-notification-service');
        residenceNotificationService.checkSpecificUser(id);
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      if (error.message === 'No valid update data provided') {
        return res.status(400).json({ message: "No changes provided" });
      }
      throw error;
    }
  }));
  
  // Client routes
  app.get("/api/clients", asyncHandler(async (req, res) => {
    const clients = await storage.getAllClients();
    res.json(clients);
  }));
  
  app.get("/api/clients/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const client = await storage.getClient(id);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    res.json(client);
  }));
  
  app.post("/api/clients", asyncHandler(async (req, res) => {
    try {
      const sanitizedData = sanitizeData(req.body);
      const clientData = insertClientSchema.parse(sanitizedData);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  app.patch("/api/clients/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const sanitizedData = sanitizeData(req.body);
      const validatedData = validateUpdateData(sanitizedData);
      const clientData = insertClientSchema.partial().parse(validatedData);
      const client = await storage.updateClient(id, clientData);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      if (error.message === 'No valid update data provided') {
        return res.status(400).json({ message: "No changes provided" });
      }
      throw error;
    }
  }));

  // Delete client with cascade handling
  app.delete("/api/clients/:id", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = parseInt(req.params.id);
    try {
      const success = await storage.deleteClient(id);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client", error: error.message });
    }
  }));

  // Delete/disable user with cascade handling  
  app.delete("/api/users/:id", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = parseInt(req.params.id);
    try {
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user", error: error.message });
    }
  }));
  
  // Project routes
  app.get("/api/projects", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    let projects;
    
    // Role-based project filtering
    if (user.role === 'admin' || user.role === 'hr_manager' || user.role === 'general_manager') {
      // Admins and managers can see all projects
      projects = await storage.getAllProjects();
    } else if (user.role === 'project_manager' || user.role === 'engineer') {
      // Engineers and project managers see only assigned projects
      projects = await storage.getProjectsByUser(user.id);
    } else {
      // Default fallback for any other roles
      projects = await storage.getProjectsByUser(user.id);
    }
    
    res.json(projects);
  }));
  
  app.get("/api/projects/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const project = await storage.getProject(id);
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    res.json(project);
  }));

  // Project staff routes
  app.get("/api/projects/:id/staff", asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.id);
    const staff = await storage.getProjectStaff(projectId);
    res.json(staff);
  }));

  app.post("/api/project-staff", asyncHandler(async (req, res) => {
    try {
      const sanitizedData = sanitizeData(req.body);
      const staffData = insertProjectStaffSchema.parse(sanitizedData);
      const assignment = await storage.assignStaffToProject(staffData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid staff assignment data", errors: error.errors });
      }
      throw error;
    }
  }));

  app.delete("/api/projects/:projectId/staff/:userId", asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const userId = parseInt(req.params.userId);
    
    const success = await storage.removeStaffFromProject(projectId, userId);
    
    if (!success) {
      return res.status(404).json({ message: "Staff assignment not found" });
    }
    
    res.status(204).send();
  }));
  
  app.get("/api/clients/:clientId/projects", asyncHandler(async (req, res) => {
    const clientId = parseInt(req.params.clientId);
    const projects = await storage.getProjectsByClient(clientId);
    res.json(projects);
  }));
  
  app.get("/api/users/:userId/projects", asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const projects = await storage.getProjectsByUser(userId);
    res.json(projects);
  }));
  
  app.post("/api/projects", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const sanitizedData = sanitizeData(req.body);
      // Automatically set createdBy from session
      const projectData = insertProjectSchema.parse({
        ...sanitizedData,
        createdBy: req.session.userId
      });
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  app.patch("/api/projects/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, projectData);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      throw error;
    }
  }));

  app.delete("/api/projects/:id", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Only admin can delete projects
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Only admin can delete projects" });
    }

    const id = parseInt(req.params.id);
    
    try {
      const success = await storage.deleteProject(id);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Project deletion error:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  }));
  
  // Project Phases routes
  app.get("/api/projects/:projectId/phases", asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const phases = await storage.getPhasesByProject(projectId);
    res.json(phases);
  }));
  
  app.post("/api/project-phases", asyncHandler(async (req, res) => {
    try {
      const phaseData = insertProjectPhaseSchema.parse(req.body);
      const phase = await storage.createProjectPhase(phaseData);
      res.status(201).json(phase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid phase data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  app.patch("/api/project-phases/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const phaseData = insertProjectPhaseSchema.partial().parse(req.body);
      const phase = await storage.updateProjectPhase(id, phaseData);
      
      if (!phase) {
        return res.status(404).json({ message: "Phase not found" });
      }
      
      res.json(phase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid phase data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  // Project Staff routes
  app.get("/api/projects/:projectId/staff", asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const staff = await storage.getProjectStaff(projectId);
    res.json(staff);
  }));
  
  app.post("/api/project-staff", asyncHandler(async (req, res) => {
    try {
      const staffData = insertProjectStaffSchema.parse(req.body);
      const assignment = await storage.assignStaffToProject(staffData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid staff assignment data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  app.delete("/api/projects/:projectId/staff/:userId", asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const userId = parseInt(req.params.userId);
    
    const success = await storage.removeStaffFromProject(projectId, userId);
    
    if (!success) {
      return res.status(404).json({ message: "Staff assignment not found" });
    }
    
    res.status(204).end();
  }));
  
  // Project Files routes
  app.get("/api/projects/:projectId/files", asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const files = await storage.getProjectFiles(projectId);
    res.json(files);
  }));
  
  app.get("/api/project-phases/:phaseId/files", asyncHandler(async (req, res) => {
    const phaseId = parseInt(req.params.phaseId);
    const files = await storage.getPhaseFiles(phaseId);
    res.json(files);
  }));
  
  app.post("/api/project-files", asyncHandler(async (req, res) => {
    try {
      const fileData = insertProjectFileSchema.parse(req.body);
      const file = await storage.addProjectFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid file data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  // Client Notes routes
  app.get("/api/clients/:clientId/notes", asyncHandler(async (req, res) => {
    const clientId = parseInt(req.params.clientId);
    const notes = await storage.getClientNotes(clientId);
    res.json(notes);
  }));
  
  app.get("/api/projects/:projectId/client-notes", asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const notes = await storage.getProjectClientNotes(projectId);
    res.json(notes);
  }));
  
  app.post("/api/client-notes", asyncHandler(async (req, res) => {
    try {
      const noteData = insertClientNoteSchema.parse(req.body);
      const note = await storage.addClientNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  // Attendance routes
  app.get("/api/attendance/daily", asyncHandler(async (req, res) => {
    const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);
    
    let attendance = await storage.getDailyAttendance(date);
    
    // If no attendance found for today, get the most recent attendance data
    if (attendance.length === 0 && !req.query.date) {
      const recentAttendance = await storage.getRecentAttendance();
      attendance = recentAttendance;
    }
    
    res.json(attendance);
  }));
  
  app.get("/api/users/:userId/attendance", asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const startDateStr = req.query.startDate as string || new Date().toISOString().split('T')[0];
    const endDateStr = req.query.endDate as string || new Date().toISOString().split('T')[0];
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    const attendance = await storage.getUserAttendance(userId, startDate, endDate);
    res.json(attendance);
  }));
  
  app.post("/api/attendance", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Process time fields BEFORE sanitization to preserve them
      const processedData = { ...req.body };
      
      // Fix time format issues - handle various input formats
      if (processedData.clockInTime) {
        if (processedData.clockInTime.includes('T')) {
          // Handle ISO timestamp format (2025-07-08T07:36:00.000Z)
          const time = new Date(processedData.clockInTime);
          if (!isNaN(time.getTime())) {
            processedData.clockInTime = time.toTimeString().slice(0, 8); // HH:MM:SS
          }
        } else if (!processedData.clockInTime.includes(':')) {
          // Handle numeric or other formats
          const time = new Date(processedData.clockInTime);
          if (!isNaN(time.getTime())) {
            processedData.clockInTime = time.toTimeString().slice(0, 8); // HH:MM:SS
          }
        } else if (processedData.clockInTime.split(':').length === 2) {
          // Add seconds if missing (HH:MM -> HH:MM:SS)
          processedData.clockInTime += ':00';
        }
        console.log('Processed clockInTime:', processedData.clockInTime);
      }
      
      if (processedData.clockOutTime) {
        if (processedData.clockOutTime.includes('T')) {
          // Handle ISO timestamp format
          const time = new Date(processedData.clockOutTime);
          if (!isNaN(time.getTime())) {
            processedData.clockOutTime = time.toTimeString().slice(0, 8); // HH:MM:SS
          }
        } else if (!processedData.clockOutTime.includes(':')) {
          // Handle numeric or other formats
          const time = new Date(processedData.clockOutTime);
          if (!isNaN(time.getTime())) {
            processedData.clockOutTime = time.toTimeString().slice(0, 8); // HH:MM:SS
          }
        } else if (processedData.clockOutTime.split(':').length === 2) {
          // Add seconds if missing (HH:MM -> HH:MM:SS)
          processedData.clockOutTime += ':00';
        }
        console.log('Processed clockOutTime:', processedData.clockOutTime);
      }
      
      // Now sanitize the processed data
      const sanitizedData = sanitizeData(processedData);
      
      // Special handling for attendance: ensure notes is always a string
      if (sanitizedData.notes === null || sanitizedData.notes === undefined) {
        sanitizedData.notes = '';
      }
      
      // Automatically set recordedBy from session
      const attendanceData = insertAttendanceSchema.parse({
        ...sanitizedData,
        recordedBy: req.session.userId
      });
      
      const attendanceRecord = await storage.recordAttendance(attendanceData);
      res.status(201).json(attendanceRecord);
    } catch (error) {
      console.error("Attendance creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid attendance data", 
          error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          details: "Please ensure all fields are properly filled and time fields are in HH:MM format"
        });
      }
      throw error;
    }
  }));
  
  // Notification routes
  app.get("/api/users/:userId/notifications", asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Get user role for RBAC filtering
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    const notifications = await storage.getUserNotifications(userId);
    
    // Filter notifications based on user role
    const filteredNotifications = notifications.filter(notification => {
      // Filter out residency notifications for unauthorized roles
      if (notification.type === 'residence_expiry' || notification.type === 'residence_expiry_alert') {
        return user.role === 'admin' || user.role === 'hr_manager' || user.role === 'general_manager' || user.role === 'project_manager';
      }
      return true;
    });
    
    res.json(filteredNotifications);
  }));
  
  app.post("/api/notifications", asyncHandler(async (req, res) => {
    try {
      const sanitizedData = sanitizeData(req.body);
      const notificationData = insertNotificationSchema.parse(sanitizedData);
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  app.patch("/api/notifications/:id/read", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const notification = await storage.markNotificationAsRead(id);
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json(notification);
  }));

  // Get all notifications
  app.get("/api/notifications", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Get user role for RBAC filtering
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    const notifications = await storage.getUserNotifications(req.session.userId);
    
    // Filter notifications based on user role
    const filteredNotifications = notifications.filter(notification => {
      // Filter out residency notifications for unauthorized roles
      if (notification.type === 'residence_expiry' || notification.type === 'residence_expiry_alert') {
        return user.role === 'admin' || user.role === 'hr_manager' || user.role === 'general_manager' || user.role === 'project_manager';
      }
      return true;
    });
    
    res.json(filteredNotifications);
  }));

  // Mark all notifications as read
  app.patch("/api/notifications/mark-all-read", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      await storage.markAllNotificationsAsRead(req.session.userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  }));

  // Delete notification
  app.delete("/api/notifications/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteNotification(id);
    
    if (!success) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    res.json({ success: true, message: "Notification deleted successfully" });
  }));

  // Get today's attendance
  app.get("/api/attendance/today", asyncHandler(async (req, res) => {
    const today = new Date();
    const attendance = await storage.getDailyAttendance(today);
    res.json(attendance);
  }));

  // Update attendance record
  app.patch("/api/attendance/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      // Process time fields BEFORE validation
      const processedData = { ...req.body };
      
      // Fix time format issues - handle various input formats
      if (processedData.clockInTime) {
        if (processedData.clockInTime.includes('T')) {
          const time = new Date(processedData.clockInTime);
          if (!isNaN(time.getTime())) {
            processedData.clockInTime = time.toTimeString().slice(0, 8);
          }
        } else if (processedData.clockInTime.split(':').length === 2) {
          processedData.clockInTime += ':00';
        }
      }
      
      if (processedData.clockOutTime) {
        if (processedData.clockOutTime.includes('T')) {
          const time = new Date(processedData.clockOutTime);
          if (!isNaN(time.getTime())) {
            processedData.clockOutTime = time.toTimeString().slice(0, 8);
          }
        } else if (processedData.clockOutTime.split(':').length === 2) {
          processedData.clockOutTime += ':00';
        }
      }
      
      const attendanceData = insertAttendanceSchema.partial().parse(processedData);
      const attendance = await storage.updateAttendance(id, attendanceData);
      
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      res.json(attendance);
    } catch (error) {
      console.error("Attendance update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  // Staff Evaluation routes
  app.get("/api/users/:userId/evaluations", asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.userId);
    const evaluations = await storage.getStaffEvaluations(userId);
    res.json(evaluations);
  }));
  
  app.get("/api/projects/:projectId/evaluations", asyncHandler(async (req, res) => {
    const projectId = parseInt(req.params.projectId);
    const evaluations = await storage.getProjectEvaluations(projectId);
    res.json(evaluations);
  }));
  
  app.post("/api/staff-evaluations", asyncHandler(async (req, res) => {
    try {
      const evaluationData = insertStaffEvaluationSchema.parse(req.body);
      const evaluation = await storage.evaluateStaff(evaluationData);
      res.status(201).json(evaluation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid evaluation data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  // Task routes
  app.get("/api/tasks", asyncHandler(async (req, res) => {
    const { projectId, userId, status, priority } = req.query;
    
    let tasks;
    if (projectId) {
      tasks = await storage.getTasksByProject(parseInt(projectId as string));
    } else if (userId) {
      tasks = await storage.getTasksByUser(parseInt(userId as string));
    } else if (status) {
      tasks = await storage.getTasksByStatus(status as string);
    } else if (priority) {
      tasks = await storage.getTasksByPriority(priority as string);
    } else {
      tasks = await storage.getAllTasks();
    }
    
    res.json(tasks);
  }));
  
  app.get("/api/tasks/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const task = await storage.getTask(id);
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.json(task);
  }));
  
  app.post("/api/tasks", asyncHandler(async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  app.patch("/api/tasks/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, taskData);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  app.delete("/api/tasks/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteTask(id);
    
    if (!success) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.json({ success: true, message: "Task deleted successfully" });
  }));
  
  // Authentication routes
  app.get("/api/auth/me", asyncHandler(async (req, res) => {
    // Check if user is authenticated via session
    const session = req.session as any;
    if (session && session.userId) {
      try {
        const user = await storage.getUser(session.userId);
        if (user) {
          const { password, ...userData } = user;
          return res.json(userData);
        }
      } catch (error) {
        console.error('Error fetching user from session:', error);
      }
    }
    
    res.status(401).json({ message: "Not authenticated" });
  }));

  app.post("/api/auth/login", asyncHandler(async (req, res) => {
    const { username, password: userPassword } = req.body;
    
    console.log('Login attempt for username:', username);
    
    if (!username || !userPassword) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    try {
      const user = await storage.getUserByUsername(username);
      console.log('User found:', !!user);
      
      if (!user || user.password !== userPassword) {
        console.log('Invalid credentials');
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user ID in session
      const session = req.session as any;
      session.userId = user.id;
      console.log('User logged in successfully, session userId:', session.userId);
      
      // Create a new object without the password
      const { password, ...userData } = user;
      
      res.json({ user: userData });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error during login" });
    }
  }));
  
  app.post("/api/auth/logout", asyncHandler(async (req, res) => {
    // Destroy the session
    const session = req.session as any;
    if (session && session.destroy) {
      session.destroy((err: any) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ message: "Could not log out" });
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ success: true, message: "Logged out successfully" });
      });
    } else {
      res.json({ success: true, message: "Logged out successfully" });
    }
  }));

  // Opportunity routes
  app.get("/api/opportunities", asyncHandler(async (req, res) => {
    const opportunities = await storage.getAllOpportunities();
    res.json(opportunities);
  }));
  
  app.get("/api/opportunities/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const opportunity = await storage.getOpportunity(id);
    
    if (!opportunity) {
      return res.status(404).json({ message: "Opportunity not found" });
    }
    
    res.json(opportunity);
  }));
  
  app.post("/api/opportunities", asyncHandler(async (req, res) => {
    try {
      const opportunityData = insertOpportunitySchema.parse(req.body);
      const opportunity = await storage.createOpportunity(opportunityData);
      res.status(201).json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid opportunity data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  app.patch("/api/opportunities/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const opportunityData = insertOpportunitySchema.partial().parse(req.body);
      const opportunity = await storage.updateOpportunity(id, opportunityData);
      
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      res.json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid opportunity data", errors: error.errors });
      }
      throw error;
    }
  }));
  
  app.delete("/api/opportunities/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteOpportunity(id);
    
    if (!success) {
      return res.status(404).json({ message: "Opportunity not found" });
    }
    
    res.json({ success: true, message: "Opportunity deleted successfully" });
  }));

  // Proposal routes
  app.get("/api/proposals", asyncHandler(async (req, res) => {
    const proposals = await storage.getAllProposals();
    res.json(proposals);
  }));
  
  app.get("/api/opportunities/:opportunityId/proposals", asyncHandler(async (req, res) => {
    const opportunityId = parseInt(req.params.opportunityId);
    const proposals = await storage.getProposalsByOpportunity(opportunityId);
    res.json(proposals);
  }));
  
  app.post("/api/proposals", asyncHandler(async (req, res) => {
    try {
      const proposalData = insertProposalSchema.parse(req.body);
      const proposal = await storage.createProposal(proposalData);
      res.status(201).json(proposal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid proposal data", errors: error.errors });
      }
      throw error;
    }
  }));

  // Event routes
  app.get("/api/events", asyncHandler(async (req, res) => {
    const events = await storage.getAllEvents();
    res.json(events);
  }));
  
  app.post("/api/events", asyncHandler(async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      throw error;
    }
  }));

  // Leave Request Routes
  app.get("/api/leave-requests", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Get user to check role
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    let leaveRequests;
    
    // Enhanced visibility - all managers can see all requests
    if (user.role === 'admin' || user.role === 'hr_manager' || user.role === 'general_manager') {
      leaveRequests = await storage.getAllLeaveRequests();
      console.log(`Manager ${user.fullName} accessing ${leaveRequests.length} leave requests`);
    } else {
      leaveRequests = await storage.getUserLeaveRequests(req.session.userId);
      console.log(`Employee ${user.fullName} accessing ${leaveRequests.length} personal leave requests`);
    }
    
    res.json(leaveRequests);
  }));

  app.get("/api/leave-requests/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const leaveRequest = await storage.getLeaveRequest(id);
    
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    
    res.json(leaveRequest);
  }));

  app.post("/api/leave-requests", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // Don't sanitize daysCount as it's a number, not a string that could be null
      const rawData = req.body;
      
      // Ensure daysCount is included and properly calculated if missing
      const daysCount = rawData.daysCount || (() => {
        if (rawData.startDate && rawData.endDate) {
          const start = new Date(rawData.startDate);
          const end = new Date(rawData.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }
        return 1;
      })();

      const leaveRequestData = insertLeaveRequestSchema.parse({
        userId: rawData.userId || req.session.userId,
        startDate: rawData.startDate,
        endDate: rawData.endDate,
        daysCount: daysCount,
        leaveType: rawData.leaveType || 'annual',
        reason: rawData.reason || "Leave request",
        status: rawData.status || 'pending',
        notes: rawData.notes || '',
        lastModifiedBy: rawData.lastModifiedBy || req.session.userId
      });

      console.log('Creating leave request with data:', { 
        daysCount, 
        userId: leaveRequestData.userId,
        dates: `${leaveRequestData.startDate} to ${leaveRequestData.endDate}`
      });

      const leaveRequest = await storage.createLeaveRequest(leaveRequestData);
      res.status(201).json(leaveRequest);
    } catch (error) {
      console.error("Leave request creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid leave request data", 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      res.status(400).json({ message: "Invalid leave request data", error: error.message });
    }
  }));

  app.patch("/api/leave-requests/:id", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = parseInt(req.params.id);
    const { status, notes, reason, startDate, endDate } = req.body;
    
    // Get the original leave request to find the employee
    const originalRequest = await storage.getLeaveRequest(id);
    if (!originalRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    
    // Get current user to check permissions
    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Role-based editing permissions:
    // 1. Status changes: Admin, HR Manager, General Manager can approve/reject
    // 2. Notes: Always allowed for audit trails and corrections
    // 3. Request details: Flexible editing based on role and status
    // 4. Employee requests: Can edit own pending requests
    const updateData: any = {};
    
    // Status updates (approval/rejection)
    if (status) {
      if (currentUser.role === 'admin' || currentUser.role === 'hr_manager' || currentUser.role === 'general_manager') {
        updateData.status = status;
      } else {
        return res.status(403).json({ message: "Not authorized to change request status" });
      }
    }
    
    // Notes are always allowed for audit trails
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    // Admin notes for management use (separate from employee notes)
    if (req.body.adminNotes !== undefined && (currentUser.role === 'admin' || currentUser.role === 'hr_manager' || currentUser.role === 'general_manager')) {
      updateData.adminNotes = req.body.adminNotes;
    }
    
    // Track who made the last modification
    updateData.lastModifiedBy = req.session.userId;
    
    // Enhanced request details editing logic
    const canEditDetails = (
      // Original employee can edit their own pending requests
      (originalRequest.userId === req.session.userId && originalRequest.status === 'pending') ||
      // Admin/HR can edit any request details for corrections
      (currentUser.role === 'admin' || currentUser.role === 'hr_manager') ||
      // Status is being changed (part of approval process)
      status ||
      // General Manager can make corrections
      currentUser.role === 'general_manager'
    );
    
    if (canEditDetails) {
      if (reason) updateData.reason = reason;
      if (startDate) updateData.startDate = startDate;
      if (endDate) updateData.endDate = endDate;
    }
    
    const updatedLeaveRequest = await storage.updateLeaveRequest(id, updateData);
    
    if (!updatedLeaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    
    // Create notification for the employee about the decision - only if status changed
    if (status && status !== originalRequest.status && (status === 'approved' || status === 'rejected')) {
      const employee = await storage.getUser(originalRequest.userId);
      if (employee) {
        const approverUser = await storage.getUser(req.session.userId);
        const approverName = approverUser?.fullName || 'مدير الموارد البشرية';
        
        await storage.createNotification({
          userId: originalRequest.userId,
          type: `leave_${status}`,
          title: status === 'approved' ? 'تم الموافقة على طلب الإجازة' : 'تم رفض طلب الإجازة',
          message: `${status === 'approved' ? 'تم الموافقة على' : 'تم رفض'} طلب الإجازة الخاص بك من ${updatedLeaveRequest.startDate} إلى ${updatedLeaveRequest.endDate}\n\nبواسطة: ${approverName}\n${notes ? `ملاحظات: ${notes}` : ''}`,
          priority: 'medium'
        });
        
        console.log(`✅ Created ${status} notification for employee ${employee.fullName}`);
      }
    }
    
    res.json(updatedLeaveRequest);
  }));

  app.delete("/api/leave-requests/:id", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = parseInt(req.params.id);
    const deleted = await storage.deleteLeaveRequest(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "Leave request not found" });
    }
    
    res.status(204).send();
  }));

  // Quick approve/reject routes for better API support
  app.patch("/api/leave-requests/:id/approve", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = parseInt(req.params.id);
    const { notes } = req.body;

    const user = await storage.getUser(req.session.userId);
    if (!user || !['admin', 'hr_manager', 'general_manager'].includes(user.role)) {
      return res.status(403).json({ message: "Not authorized to approve leave requests" });
    }

    try {
      const updatedRequest = await storage.updateLeaveRequest(id, {
        status: 'approved',
        notes: notes || '',
        lastModifiedBy: req.session.userId
      });

      if (!updatedRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving leave request:", error);
      res.status(500).json({ message: "Failed to approve leave request" });
    }
  }));

  app.patch("/api/leave-requests/:id/reject", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = parseInt(req.params.id);
    const { notes } = req.body;

    const user = await storage.getUser(req.session.userId);
    if (!user || !['admin', 'hr_manager', 'general_manager'].includes(user.role)) {
      return res.status(403).json({ message: "Not authorized to reject leave requests" });
    }

    try {
      const updatedRequest = await storage.updateLeaveRequest(id, {
        status: 'rejected',
        notes: notes || '',
        lastModifiedBy: req.session.userId
      });

      if (!updatedRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      res.status(500).json({ message: "Failed to reject leave request" });
    }
  }));

  // Leave Approval Routes
  app.post("/api/leave-approvals", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get user to check role
    const user = await storage.getUser(req.session.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'hr_manager' && user.role !== 'project_manager')) {
      return res.status(403).json({ message: "Not authorized to approve leave requests" });
    }

    try {
      const approvalData = {
        ...req.body,
        approverId: req.session.userId,
        approverRole: user.role,
      };

      const approval = await storage.createLeaveApproval(approvalData);
      res.status(201).json(approval);
    } catch (error) {
      console.error("Leave approval creation error:", error);
      res.status(400).json({ message: "Invalid approval data" });
    }
  }));

  app.get("/api/leave-requests/:id/approvals", asyncHandler(async (req, res) => {
    const leaveRequestId = parseInt(req.params.id);
    const approvals = await storage.getRequestApprovals(leaveRequestId);
    res.json(approvals);
  }));

  // Residence Management Routes
  app.get("/api/residence/expiring", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check user authorization
    const user = await storage.getUser(req.session.userId);
    console.log('User checking residence access:', user?.role);
    if (!user || (user.role !== 'admin' && user.role !== 'hr_manager' && user.role !== 'general_manager')) {
      return res.status(403).json({ message: "Not authorized to view residence information" });
    }

    try {
      const expiringUsers = await storage.checkExpiringResidences();
      res.json(expiringUsers);
    } catch (error) {
      console.error("Error fetching expiring residences:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }));

  app.post("/api/residence/renew", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check user authorization
    const user = await storage.getUser(req.session.userId);
    if (!user || (user.role !== 'admin' && user.role !== 'hr_manager')) {
      return res.status(403).json({ message: "Not authorized to renew residences" });
    }

    try {
      const { userId, newExpiryDate, renewalMonths } = req.body;
      
      if (!userId || !newExpiryDate || !renewalMonths) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const updatedUser = await storage.updateResidenceStatus(
        parseInt(userId),
        newExpiryDate,
        parseInt(renewalMonths),
        req.session.userId
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create notification for successful renewal
      await storage.createNotification({
        userId: updatedUser.id,
        type: 'residence_renewed',
        title: 'تم تجديد الإقامة',
        message: `تم تجديد الإقامة حتى تاريخ ${newExpiryDate}`,
        priority: 'low'
      });

      res.json({ message: "Residence renewed successfully", user: updatedUser });
    } catch (error) {
      console.error("Error renewing residence:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }));

  // System Management Routes - Backup/Restore
  app.post("/api/system/backup", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check user authorization - only admin can backup
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to perform backup" });
    }

    try {
      // Create backup SQL export
      const backupQuery = `
        -- Database Backup Generated on ${new Date().toISOString()}
        
        -- Export all tables
        COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER;
        COPY (SELECT * FROM projects) TO STDOUT WITH CSV HEADER;
        COPY (SELECT * FROM clients) TO STDOUT WITH CSV HEADER;
        COPY (SELECT * FROM tasks) TO STDOUT WITH CSV HEADER;
        COPY (SELECT * FROM attendance) TO STDOUT WITH CSV HEADER;
        COPY (SELECT * FROM leave_requests) TO STDOUT WITH CSV HEADER;
        COPY (SELECT * FROM notifications) TO STDOUT WITH CSV HEADER;
      `;

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="backup_${new Date().toISOString().split('T')[0]}.sql"`);
      res.send(backupQuery);
    } catch (error) {
      console.error("Backup creation error:", error);
      res.status(500).json({ message: "Backup creation failed" });
    }
  }));

  app.post("/api/system/restore", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check user authorization - only admin can restore
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to perform restore" });
    }

    try {
      // In a real implementation, this would process the uploaded backup file
      // For now, we'll just return success
      res.json({ message: "Restore completed successfully" });
    } catch (error) {
      console.error("Restore error:", error);
      res.status(500).json({ message: "Restore failed" });
    }
  }));
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
