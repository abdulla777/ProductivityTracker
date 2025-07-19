import {
  users, clients, projects, projectPhases, projectStaff, projectFiles,
  clientNotes, attendance, notifications, staffEvaluations, tasks,
  opportunities, proposals, events, opportunityFiles, opportunityNotes,
  leaveRequests, leaveApprovals, residenceRenewals, residenceNotifications,
  type User, type InsertUser, type Client, type InsertClient,
  type Project, type InsertProject, type ProjectPhase, type InsertProjectPhase,
  type ProjectStaff, type InsertProjectStaff, type ProjectFile, type InsertProjectFile,
  type ClientNote, type InsertClientNote, type Attendance, type InsertAttendance,
  type Notification, type InsertNotification, type StaffEvaluation, type InsertStaffEvaluation,
  type Task, type InsertTask, type Opportunity, type InsertOpportunity,
  type Proposal, type InsertProposal, type Event, type InsertEvent,
  type OpportunityFile, type InsertOpportunityFile,
  type OpportunityNote, type InsertOpportunityNote,
  type LeaveRequest, type InsertLeaveRequest,
  type LeaveApproval, type InsertLeaveApproval,
  type ResidenceRenewal, type InsertResidenceRenewal,
  type ResidenceNotification, type InsertResidenceNotification
} from "@shared/schema";

// Import DB and operators
import { db } from "./db";
import { eq, and, gte, lte, desc, inArray, or, isNotNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Residence operations  
  createResidenceRenewal(renewal: InsertResidenceRenewal): Promise<ResidenceRenewal>;
  createResidenceNotification(notification: InsertResidenceNotification): Promise<ResidenceNotification>;
  checkExpiringResidences(): Promise<User[]>;
  updateResidenceStatus(userId: number, newExpiryDate: string, renewalMonths: number, processedBy: number): Promise<User | undefined>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  getAllClients(): Promise<Client[]>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  getProjectsByClient(clientId: number): Promise<Project[]>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  
  // Project Phase operations
  getProjectPhase(id: number): Promise<ProjectPhase | undefined>;
  createProjectPhase(phase: InsertProjectPhase): Promise<ProjectPhase>;
  updateProjectPhase(id: number, phase: Partial<InsertProjectPhase>): Promise<ProjectPhase | undefined>;
  getPhasesByProject(projectId: number): Promise<ProjectPhase[]>;
  
  // Project Staff operations
  assignStaffToProject(projectStaff: InsertProjectStaff): Promise<ProjectStaff>;
  removeStaffFromProject(projectId: number, userId: number): Promise<boolean>;
  getProjectStaff(projectId: number): Promise<(ProjectStaff & { user: User })[]>;
  
  // Project Files operations
  addProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  getProjectFiles(projectId: number): Promise<ProjectFile[]>;
  getPhaseFiles(phaseId: number): Promise<ProjectFile[]>;
  
  // Client Notes operations
  addClientNote(note: InsertClientNote): Promise<ClientNote>;
  getClientNotes(clientId: number): Promise<ClientNote[]>;
  getProjectClientNotes(projectId: number): Promise<ClientNote[]>;
  
  // Attendance operations
  recordAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getDailyAttendance(date: Date): Promise<(Attendance & { user: User })[]>;
  getUserAttendance(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  getRecentAttendance(): Promise<(Attendance & { user: User })[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Staff Evaluation operations
  evaluateStaff(evaluation: InsertStaffEvaluation): Promise<StaffEvaluation>;
  getStaffEvaluations(userId: number): Promise<StaffEvaluation[]>;
  getProjectEvaluations(projectId: number): Promise<(StaffEvaluation & { user: User })[]>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTask(id: number): Promise<Task | undefined>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getAllTasks(): Promise<(Task & { project: Project; assignee: User; creator: User })[]>;
  getTasksByProject(projectId: number): Promise<(Task & { assignee: User; creator: User })[]>;
  getTasksByUser(userId: number): Promise<(Task & { project: Project; creator: User })[]>;
  getTasksByStatus(status: string): Promise<(Task & { project: Project; assignee: User; creator: User })[]>;
  getTasksByPriority(priority: string): Promise<(Task & { project: Project; assignee: User; creator: User })[]>;
  
  // Opportunity operations
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  getOpportunity(id: number): Promise<Opportunity | undefined>;
  updateOpportunity(id: number, opportunity: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;
  deleteOpportunity(id: number): Promise<boolean>;
  getAllOpportunities(): Promise<Opportunity[]>;
  
  // Proposal operations
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  getProposal(id: number): Promise<Proposal | undefined>;
  updateProposal(id: number, proposal: Partial<InsertProposal>): Promise<Proposal | undefined>;
  deleteProposal(id: number): Promise<boolean>;
  getAllProposals(): Promise<Proposal[]>;
  getProposalsByOpportunity(opportunityId: number): Promise<Proposal[]>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEvent(id: number): Promise<Event | undefined>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getAllEvents(): Promise<Event[]>;
  
  // Leave Request operations
  createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest>;
  getLeaveRequest(id: number): Promise<LeaveRequest | undefined>;
  updateLeaveRequest(id: number, leaveRequest: Partial<InsertLeaveRequest>): Promise<LeaveRequest | undefined>;
  deleteLeaveRequest(id: number): Promise<boolean>;
  getAllLeaveRequests(): Promise<LeaveRequest[]>;
  getUserLeaveRequests(userId: number): Promise<LeaveRequest[]>;
  getPendingLeaveRequests(): Promise<LeaveRequest[]>;
  
  // Leave Approval operations
  createLeaveApproval(leaveApproval: InsertLeaveApproval): Promise<LeaveApproval>;
  getLeaveApproval(id: number): Promise<LeaveApproval | undefined>;
  updateLeaveApproval(id: number, leaveApproval: Partial<InsertLeaveApproval>): Promise<LeaveApproval | undefined>;
  getRequestApprovals(leaveRequestId: number): Promise<LeaveApproval[]>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // For SQLite, use sequential deletion instead of transactions
      // Delete related records first
      await db.delete(attendance).where(eq(attendance.userId, id));
      await db.delete(leaveRequests).where(eq(leaveRequests.userId, id));
      await db.delete(notifications).where(eq(notifications.recipientId, id));
      await db.delete(projectStaff).where(eq(projectStaff.userId, id));
      await db.delete(staffEvaluations).where(eq(staffEvaluations.userId, id));
      
      // Finally delete the user
      const result = await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      // For SQLite, use sequential deletion instead of transactions
      // Delete related records first
      await db.delete(clientNotes).where(eq(clientNotes.clientId, id));
      
      // Get all projects for this client and delete their related data
      const clientProjects = await db.select().from(projects).where(eq(projects.clientId, id));
      
      for (const project of clientProjects) {
        // Delete project-related data
        await db.delete(projectFiles).where(eq(projectFiles.projectId, project.id));
        await db.delete(projectStaff).where(eq(projectStaff.projectId, project.id));
        await db.delete(projectPhases).where(eq(projectPhases.projectId, project.id));
        await db.delete(tasks).where(eq(tasks.projectId, project.id));
      }
      
      // Delete projects themselves
      await db.delete(projects).where(eq(projects.clientId, id));
      
      // Finally delete the client
      const result = await db.delete(clients).where(eq(clients.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    try {
      // For SQLite, we need to manually add createdAt timestamp
      const projectWithDefaults = {
        ...insertProject,
        completionPercentage: insertProject.completionPercentage || 0,
        createdAt: new Date().toISOString(),
      };
      
      const [project] = await db
        .insert(projects)
        .values(projectWithDefaults)
        .returning();
      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(id: number, projectData: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async deleteProject(id: number): Promise<boolean> {
    try {
      // First, delete related records (in proper order to avoid constraint violations)
      await db.delete(projectStaff).where(eq(projectStaff.projectId, id));
      await db.delete(projectPhases).where(eq(projectPhases.projectId, id));
      await db.delete(projectFiles).where(eq(projectFiles.projectId, id));
      await db.delete(tasks).where(eq(tasks.projectId, id));
      
      // Delete client notes if they exist and have project_id column
      try {
        await db.delete(clientNotes).where(eq(clientNotes.projectId, id));
      } catch (error: any) {
        if (!error.message.includes('relation "client_notes" does not exist')) {
          console.error('Error deleting client notes:', error);
        }
      }
      
      // Finally, delete the project itself
      const result = await db.delete(projects).where(eq(projects.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  async getProjectsByClient(clientId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.clientId, clientId));
  }

  async getProjectsByUser(userId: number): Promise<Project[]> {
    // Get all projects where user is assigned as staff
    const projectStaffAssignments = await db.select().from(projectStaff).where(eq(projectStaff.userId, userId));
    
    if (projectStaffAssignments.length === 0) {
      return [];
    }
    
    const projectIds = projectStaffAssignments.map(assignment => assignment.projectId);
    
    // Just fetch all projects and filter them in memory
    // This is a workaround since we're having issues with the in-array operator
    const allProjects = await db.select().from(projects);
    return allProjects.filter(project => projectIds.includes(project.id));
  }

  async getProjectPhase(id: number): Promise<ProjectPhase | undefined> {
    const [phase] = await db.select().from(projectPhases).where(eq(projectPhases.id, id));
    return phase || undefined;
  }

  async createProjectPhase(insertPhase: InsertProjectPhase): Promise<ProjectPhase> {
    const [phase] = await db
      .insert(projectPhases)
      .values({ ...insertPhase, completionPercentage: 0 })
      .returning();
    
    // Update project completion percentage
    await this.updateProjectCompletionPercentage(insertPhase.projectId);
    
    return phase;
  }

  async updateProjectPhase(id: number, phaseData: Partial<InsertProjectPhase>): Promise<ProjectPhase | undefined> {
    const [phase] = await db
      .update(projectPhases)
      .set(phaseData)
      .where(eq(projectPhases.id, id))
      .returning();
    
    if (phase) {
      // Update project completion percentage if one of the phases was updated
      await this.updateProjectCompletionPercentage(phase.projectId);
    }
    
    return phase || undefined;
  }

  async getPhasesByProject(projectId: number): Promise<ProjectPhase[]> {
    try {
      return await db.select().from(projectPhases).where(eq(projectPhases.projectId, projectId));
    } catch (error) {
      console.error('Error getting phases for project:', projectId, error);
      // إذا كان هناك خطأ في عمود description، إرجاع مصفوفة فارغة
      if (error.message && error.message.includes('column "description" does not exist')) {
        console.log('Description column missing, returning empty array');
        return [];
      }
      throw error;
    }
  }

  private async updateProjectCompletionPercentage(projectId: number): Promise<void> {
    // Get all phases for the project
    const phases = await db.select().from(projectPhases).where(eq(projectPhases.projectId, projectId));
    
    if (phases.length === 0) {
      return;
    }
    
    // Calculate average completion percentage
    const totalPercentage = phases.reduce(
      (sum, phase) => sum + (phase.completionPercentage || 0), 
      0
    );
    const averagePercentage = totalPercentage / phases.length;
    
    // Update project with new completion percentage
    await db
      .update(projects)
      .set({ completionPercentage: averagePercentage })
      .where(eq(projects.id, projectId));
  }

  async assignStaffToProject(projectStaffData: InsertProjectStaff): Promise<ProjectStaff> {
    const [assignment] = await db
      .insert(projectStaff)
      .values(projectStaffData)
      .returning();
    return assignment;
  }

  async removeStaffFromProject(projectId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(projectStaff)
      .where(
        and(
          eq(projectStaff.projectId, projectId),
          eq(projectStaff.userId, userId)
        )
      );
    return true; // Returning true as the operation was executed, even if no records were deleted
  }

  async getProjectStaff(projectId: number): Promise<(ProjectStaff & { user: User })[]> {
    const assignments = await db
      .select()
      .from(projectStaff)
      .where(eq(projectStaff.projectId, projectId));
    
    const result: (ProjectStaff & { user: User })[] = [];
    
    for (const assignment of assignments) {
      const [user] = await db.select().from(users).where(eq(users.id, assignment.userId));
      if (user) {
        result.push({ ...assignment, user });
      }
    }
    
    return result;
  }

  async addProjectFile(insertFile: InsertProjectFile): Promise<ProjectFile> {
    try {
      // تسجيل البيانات المدخلة للتشخيص
      console.log('Adding project file with data:', insertFile);
      
      const [file] = await db
        .insert(projectFiles)
        .values({
          projectId: insertFile.projectId,
          phaseId: insertFile.phaseId || null,
          fileName: insertFile.fileName,
          filePath: insertFile.filePath,
          fileType: insertFile.fileType || null,
          fileSize: insertFile.fileSize || null,
          uploadedBy: insertFile.uploadedBy,
        })
        .returning();
      
      console.log('Project file added successfully:', file);
      return file;
    } catch (error) {
      console.error('Error adding project file:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    try {
      return await db.select().from(projectFiles).where(eq(projectFiles.projectId, projectId));
    } catch (error) {
      console.error('Error getting project files:', projectId, error);
      // إذا كان هناك خطأ في عمود phase_id، إرجاع مصفوفة فارغة
      if (error.message && error.message.includes('column "phase_id" does not exist')) {
        console.log('Phase_id column missing, returning empty array');
        return [];
      }
      throw error;
    }
  }

  async getPhaseFiles(phaseId: number): Promise<ProjectFile[]> {
    return await db.select().from(projectFiles).where(eq(projectFiles.phaseId, phaseId));
  }

  async addClientNote(insertNote: InsertClientNote): Promise<ClientNote> {
    const [note] = await db
      .insert(clientNotes)
      .values(insertNote)
      .returning();
    return note;
  }

  async getClientNotes(clientId: number): Promise<ClientNote[]> {
    return await db.select().from(clientNotes).where(eq(clientNotes.clientId, clientId));
  }

  async getProjectClientNotes(projectId: number): Promise<ClientNote[]> {
    return await db.select().from(clientNotes).where(eq(clientNotes.projectId, projectId));
  }

  async recordAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    // Ensure all data is SQLite-compatible
    const cleanData = {
      userId: attendanceData.userId,
      date: typeof attendanceData.date === 'string' ? attendanceData.date : attendanceData.date.toISOString().split('T')[0],
      status: attendanceData.status || 'present',
      checkIn: attendanceData.checkIn || '',
      clockInTime: attendanceData.clockInTime || null,
      clockOutTime: attendanceData.clockOutTime || null,
      notes: attendanceData.notes || '',
      createdBy: attendanceData.recordedBy || attendanceData.createdBy
    };
    
    // Calculate if the user is late based on check-in time - convert boolean to integer for SQLite
    const isLate = cleanData.clockInTime
      ? parseInt(cleanData.clockInTime.split(':')[0]) >= 9
      : false;
    
    console.log('Storing attendance with times:', {
      clockInTime: cleanData.clockInTime,
      clockOutTime: cleanData.clockOutTime,
      isLate: isLate ? 1 : 0
    });
    
    // Final data object with only valid SQLite types
    const finalData = {
      ...cleanData,
      late: isLate ? 1 : 0  // Convert boolean to integer for SQLite
    };
    
    const [record] = await db
      .insert(attendance)
      .values(finalData)
      .returning();
    return record;
  }

  async getDailyAttendance(date: Date): Promise<(Attendance & { user: User })[]> {
    const dateString = date.toISOString().split('T')[0];
    
    const records = await db
      .select()
      .from(attendance)
      .where(eq(attendance.date, dateString));
    
    const result: (Attendance & { user: User })[] = [];
    
    for (const record of records) {
      const [user] = await db.select().from(users).where(eq(users.id, record.userId));
      if (user) {
        result.push({ ...record, user });
      }
    }
    
    return result;
  }

  async getRecentAttendance(): Promise<(Attendance & { user: User })[]> {
    // Get the most recent date with attendance records
    const recentDate = await db
      .select({ date: attendance.date })
      .from(attendance)
      .orderBy(desc(attendance.date))
      .limit(1);
      
    if (recentDate.length === 0) {
      return [];
    }
    
    // Get all attendance records for that date
    const records = await db
      .select()
      .from(attendance)
      .where(eq(attendance.date, recentDate[0].date));
    
    const result: (Attendance & { user: User })[] = [];
    
    for (const record of records) {
      const [user] = await db.select().from(users).where(eq(users.id, record.userId));
      if (user) {
        result.push({ ...record, user });
      }
    }
    
    return result;
  }

  async getUserAttendance(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]> {
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          gte(attendance.date, startDateString),
          lte(attendance.date, endDateString)
        )
      );
  }

  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    // Ensure proper data formatting
    const cleanData: any = { ...attendanceData };
    
    // Handle date formatting if provided
    if (cleanData.date) {
      cleanData.date = typeof cleanData.date === 'string' ? new Date(cleanData.date) : cleanData.date;
    }
    
    // Calculate if the user is late based on check-in time if clockInTime is being updated
    if (cleanData.clockInTime) {
      cleanData.isLate = parseInt(cleanData.clockInTime.split(':')[0]) >= 9;
    }
    
    console.log('Updating attendance with times:', {
      id,
      clockInTime: cleanData.clockInTime,
      clockOutTime: cleanData.clockOutTime,
      isLate: cleanData.isLate
    });
    
    const [updated] = await db
      .update(attendance)
      .set(cleanData)
      .where(eq(attendance.id, id))
      .returning();
    
    return updated || undefined;
  }

  async getRecentAttendance(): Promise<(Attendance & { user: User })[]> {
    // Get the most recent attendance records (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0];
    
    const records = await db
      .select()
      .from(attendance)
      .where(gte(attendance.date, sevenDaysAgoString))
      .orderBy(desc(attendance.date));
    
    const result: (Attendance & { user: User })[] = [];
    
    for (const record of records) {
      const [user] = await db.select().from(users).where(eq(users.id, record.userId));
      if (user) {
        result.push({ ...record, user });
      }
    }
    
    return result;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ readStatus: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ readStatus: true })
      .where(eq(notifications.recipientId, userId));
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    return result.rowCount > 0;
  }

  async evaluateStaff(insertEvaluation: InsertStaffEvaluation): Promise<StaffEvaluation> {
    const [evaluation] = await db
      .insert(staffEvaluations)
      .values(insertEvaluation)
      .returning();
    return evaluation;
  }

  async getStaffEvaluations(userId: number): Promise<StaffEvaluation[]> {
    return await db
      .select()
      .from(staffEvaluations)
      .where(eq(staffEvaluations.userId, userId));
  }

  async getProjectEvaluations(projectId: number): Promise<(StaffEvaluation & { user: User })[]> {
    const evaluations = await db
      .select()
      .from(staffEvaluations)
      .where(eq(staffEvaluations.projectId, projectId));
    
    const result: (StaffEvaluation & { user: User })[] = [];
    
    for (const evaluation of evaluations) {
      const [user] = await db.select().from(users).where(eq(users.id, evaluation.userId));
      if (user) {
        result.push({ ...evaluation, user });
      }
    }
    
    return result;
  }

  // Task operations implementation
  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllTasks(): Promise<(Task & { project: Project; assignee: User; creator: User })[]> {
    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    const result: (Task & { project: Project; assignee: User; creator: User })[] = [];

    for (const task of allTasks) {
      const [project] = await db.select().from(projects).where(eq(projects.id, task.projectId));
      const [assignee] = await db.select().from(users).where(eq(users.id, task.assignedTo));
      const [creator] = await db.select().from(users).where(eq(users.id, task.createdBy));

      if (project && assignee && creator) {
        result.push({ ...task, project, assignee, creator });
      }
    }

    return result;
  }

  async getTasksByProject(projectId: number): Promise<(Task & { assignee: User; creator: User })[]> {
    const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId));
    const result: (Task & { assignee: User; creator: User })[] = [];

    for (const task of projectTasks) {
      const [assignee] = await db.select().from(users).where(eq(users.id, task.assignedTo));
      const [creator] = await db.select().from(users).where(eq(users.id, task.createdBy));

      if (assignee && creator) {
        result.push({ ...task, assignee, creator });
      }
    }

    return result;
  }

  async getTasksByUser(userId: number): Promise<(Task & { project: Project; creator: User })[]> {
    const userTasks = await db.select().from(tasks).where(eq(tasks.assignedTo, userId));
    const result: (Task & { project: Project; creator: User })[] = [];

    for (const task of userTasks) {
      const [project] = await db.select().from(projects).where(eq(projects.id, task.projectId));
      const [creator] = await db.select().from(users).where(eq(users.id, task.createdBy));

      if (project && creator) {
        result.push({ ...task, project, creator });
      }
    }

    return result;
  }

  async getTasksByStatus(status: string): Promise<(Task & { project: Project; assignee: User; creator: User })[]> {
    const allTasks = await db.select().from(tasks);
    const statusTasks = allTasks.filter(task => task.status === status);
    const result: (Task & { project: Project; assignee: User; creator: User })[] = [];

    for (const task of statusTasks) {
      const [project] = await db.select().from(projects).where(eq(projects.id, task.projectId));
      const [assignee] = await db.select().from(users).where(eq(users.id, task.assignedTo));
      const [creator] = await db.select().from(users).where(eq(users.id, task.createdBy));

      if (project && assignee && creator) {
        result.push({ ...task, project, assignee, creator });
      }
    }

    return result;
  }

  async getTasksByPriority(priority: string): Promise<(Task & { project: Project; assignee: User; creator: User })[]> {
    const allTasks = await db.select().from(tasks);
    const priorityTasks = allTasks.filter(task => task.priority === priority);
    const result: (Task & { project: Project; assignee: User; creator: User })[] = [];

    for (const task of priorityTasks) {
      const [project] = await db.select().from(projects).where(eq(projects.id, task.projectId));
      const [assignee] = await db.select().from(users).where(eq(users.id, task.assignedTo));
      const [creator] = await db.select().from(users).where(eq(users.id, task.createdBy));

      if (project && assignee && creator) {
        result.push({ ...task, project, assignee, creator });
      }
    }

    return result;
  }

  // Opportunity operations
  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    const [created] = await db
      .insert(opportunities)
      .values(opportunity)
      .returning();
    return created;
  }

  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, id));
    return opportunity || undefined;
  }

  async updateOpportunity(id: number, opportunityData: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const [opportunity] = await db
      .update(opportunities)
      .set(opportunityData)
      .where(eq(opportunities.id, id))
      .returning();
    return opportunity || undefined;
  }

  async deleteOpportunity(id: number): Promise<boolean> {
    const result = await db.delete(opportunities).where(eq(opportunities.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllOpportunities(): Promise<Opportunity[]> {
    return await db.select().from(opportunities).orderBy(desc(opportunities.createdAt));
  }

  // Proposal operations
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const [created] = await db
      .insert(proposals)
      .values(proposal)
      .returning();
    return created;
  }

  async getProposal(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal || undefined;
  }

  async updateProposal(id: number, proposalData: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const [proposal] = await db
      .update(proposals)
      .set(proposalData)
      .where(eq(proposals.id, id))
      .returning();
    return proposal || undefined;
  }

  async deleteProposal(id: number): Promise<boolean> {
    const result = await db.delete(proposals).where(eq(proposals.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllProposals(): Promise<Proposal[]> {
    return await db.select().from(proposals).orderBy(desc(proposals.createdAt));
  }

  async getProposalsByOpportunity(opportunityId: number): Promise<Proposal[]> {
    return await db.select().from(proposals).where(eq(proposals.opportunityId, opportunityId));
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db
      .insert(events)
      .values(event)
      .returning();
    return created;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async updateEvent(id: number, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.startDate));
  }

  // Leave Request operations
  async createLeaveRequest(leaveRequestData: InsertLeaveRequest): Promise<LeaveRequest> {
    const [leaveRequest] = await db
      .insert(leaveRequests)
      .values(leaveRequestData)
      .returning();
    return leaveRequest;
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const [leaveRequest] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return leaveRequest || undefined;
  }

  async updateLeaveRequest(id: number, leaveRequestData: Partial<InsertLeaveRequest>): Promise<LeaveRequest | undefined> {
    const [updatedLeaveRequest] = await db
      .update(leaveRequests)
      .set(leaveRequestData)
      .where(eq(leaveRequests.id, id))
      .returning();
    return updatedLeaveRequest || undefined;
  }

  async deleteLeaveRequest(id: number): Promise<boolean> {
    const result = await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
    return result.rowCount > 0;
  }

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    const requests = await db
      .select()
      .from(leaveRequests)
      .orderBy(desc(leaveRequests.createdAt));
    
    // Add user information to each request
    const requestsWithUsers = [];
    for (const request of requests) {
      const [user] = await db.select().from(users).where(eq(users.id, request.userId));
      requestsWithUsers.push({
        ...request,
        user: user ? { fullName: user.fullName, role: user.role } : null
      });
    }
    
    return requestsWithUsers;
  }

  async getUserLeaveRequests(userId: number): Promise<LeaveRequest[]> {
    const requests = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, userId))
      .orderBy(desc(leaveRequests.createdAt));
    
    // Add user information to each request
    const requestsWithUsers = [];
    for (const request of requests) {
      const [user] = await db.select().from(users).where(eq(users.id, request.userId));
      requestsWithUsers.push({
        ...request,
        user: user ? { fullName: user.fullName, role: user.role } : null
      });
    }
    
    return requestsWithUsers;
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return await db.select().from(leaveRequests).where(eq(leaveRequests.status, 'pending'))
      .orderBy(desc(leaveRequests.createdAt));
  }

  // Leave Approval operations
  async createLeaveApproval(leaveApprovalData: InsertLeaveApproval): Promise<LeaveApproval> {
    const [leaveApproval] = await db
      .insert(leaveApprovals)
      .values(leaveApprovalData)
      .returning();
    return leaveApproval;
  }

  async getLeaveApproval(id: number): Promise<LeaveApproval | undefined> {
    const [leaveApproval] = await db.select().from(leaveApprovals).where(eq(leaveApprovals.id, id));
    return leaveApproval || undefined;
  }

  async updateLeaveApproval(id: number, leaveApprovalData: Partial<InsertLeaveApproval>): Promise<LeaveApproval | undefined> {
    const [updatedLeaveApproval] = await db
      .update(leaveApprovals)
      .set(leaveApprovalData)
      .where(eq(leaveApprovals.id, id))
      .returning();
    return updatedLeaveApproval || undefined;
  }

  async getRequestApprovals(leaveRequestId: number): Promise<LeaveApproval[]> {
    return await db.select().from(leaveApprovals).where(eq(leaveApprovals.leaveRequestId, leaveRequestId))
      .orderBy(desc(leaveApprovals.createdAt));
  }

  // Residence operations
  async createResidenceRenewal(renewalData: InsertResidenceRenewal): Promise<ResidenceRenewal> {
    const [renewal] = await db
      .insert(residenceRenewals)
      .values(renewalData)
      .returning();
    return renewal;
  }

  async createResidenceNotification(notificationData: InsertResidenceNotification): Promise<ResidenceNotification> {
    const [notification] = await db
      .insert(residenceNotifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async checkExpiringResidences(): Promise<User[]> {
    try {
      const today = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(today.getMonth() + 3);

      // Get all users with residence expiry dates (both saudi and resident)
      // who have residence permits expiring within 3 months
      const expiringUsers = await db.select()
        .from(users)
        .where(
          and(
            // Include both saudi and resident nationalities with residence permits
            or(
              eq(users.nationality, 'resident'),
              eq(users.nationality, 'saudi')
            ),
            // Must have a residence expiry date
            isNotNull(users.residenceExpiryDate),
            // Expiry date must be within 3 months
            lte(users.residenceExpiryDate, threeMonthsFromNow.toISOString().split('T')[0]),
            // Must be active users (SQLite uses 1 for true)
            eq(users.isActive, 1)
          )
        );

      console.log(`Found ${expiringUsers.length} users with expiring residences`);
      return expiringUsers;
    } catch (error) {
      console.error('Error in checkExpiringResidences:', error);
      // Return empty array if database query fails
      return [];
    }
  }

  async updateResidenceStatus(userId: number, newExpiryDate: string, renewalMonths: number, processedBy: number): Promise<User | undefined> {
    // Get current user data
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!currentUser) return undefined;

    // Create renewal record
    await this.createResidenceRenewal({
      userId,
      oldExpiryDate: currentUser.residenceExpiryDate || new Date().toISOString().split('T')[0],
      newExpiryDate,
      renewalPeriodMonths: renewalMonths,
      processedBy,
      notes: `تجديد الإقامة لمدة ${renewalMonths} شهر`
    });

    // Update user record
    const [updatedUser] = await db
      .update(users)
      .set({
        residenceExpiryDate: newExpiryDate,
        residenceStatus: 'active'
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }
}

export const storage = new DatabaseStorage();