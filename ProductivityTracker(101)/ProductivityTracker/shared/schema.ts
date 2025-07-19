import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// SQLite doesn't use enums - we'll use TEXT with CHECK constraints in database

// Users Schema - SQLite compatible
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default('admin_staff'),
  department: text("department"),
  position: text("position"),
  hireDate: text("hire_date"),
  salary: real("salary"),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  nationality: text("nationality").notNull().default('saudi'),
  residenceNumber: text("residence_number"),
  residenceExpiryDate: text("residence_expiry_date"),
  residenceStatus: text("residence_status").default('active'),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
});

// Clients Schema - SQLite compatible
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  notes: text("notes"),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
});

// Projects Schema - SQLite compatible
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  clientId: integer("client_id").notNull().references(() => clients.id),
  location: text("location"),
  status: text("status").notNull().default('new'),
  startDate: text("start_date"),
  targetEndDate: text("target_end_date"),
  actualEndDate: text("actual_end_date"),
  completionPercentage: real("completion_percentage").default(0),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
  updatedAt: text("updated_at").default("datetime('now', 'localtime')"),
});

// Project Phases Schema - SQLite compatible
export const projectPhases = sqliteTable("project_phases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  phaseType: text("phase_type").notNull(),
  phaseName: text("phase_name").notNull(),
  description: text("description"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  completionPercentage: real("completion_percentage").default(0),
  status: text("status").notNull().default('not_started'),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
});

// Project Staff Schema - SQLite compatible
export const projectStaff = sqliteTable("project_staff", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role"),
  assignedAt: text("assigned_at").default("datetime('now', 'localtime')"),
});

// Project Files Schema - SQLite compatible
export const projectFiles = sqliteTable("project_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  phaseId: integer("phase_id").references(() => projectPhases.id),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedAt: text("uploaded_at").default("datetime('now', 'localtime')"),
});

// Client Notes Schema - SQLite compatible
export const clientNotes = sqliteTable("client_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id").notNull().references(() => clients.id),
  projectId: integer("project_id").references(() => projects.id),
  note: text("note").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
});

// Attendance Schema - SQLite compatible
export const attendance = sqliteTable("attendance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(),
  status: text("status").default('present'),
  checkIn: text("check_in").default(''),
  clockInTime: text("clock_in_time"),
  clockOutTime: text("clock_out_time"),
  notes: text("notes").default(''),
  late: integer("late", { mode: 'boolean' }).default(false),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
});

// Notifications Schema - SQLite compatible
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  type: text("type").default('info'),
  referenceId: integer("reference_id"),
  referenceType: text("reference_type"),
  readStatus: integer("read_status", { mode: 'boolean' }).default(false),
  priority: text("priority").default('medium'),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
});

// Staff Evaluations Schema - SQLite compatible
export const staffEvaluations = sqliteTable("staff_evaluations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  rating: integer("rating").notNull(),
  comments: text("comments"),
  evaluatedBy: integer("evaluated_by").notNull().references(() => users.id),
  evaluatedAt: text("evaluated_at").default("datetime('now', 'localtime')"),
});

// Tasks Schema - SQLite compatible
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull().references(() => projects.id),
  assignedTo: integer("assigned_to").notNull().references(() => users.id),
  priority: text("priority").notNull().default('medium'),
  status: text("status").notNull().default('not_started'),
  dueDate: text("due_date"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
  updatedAt: text("updated_at").default("datetime('now', 'localtime')"),
});

// Business Development Tables - SQLite compatible
export const opportunities = sqliteTable("opportunities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  organization: text("organization"),
  type: text("type").notNull(),
  status: text("status").default('lead'),
  strength: text("strength").default('medium'),
  estimatedValue: real("estimated_value"),
  description: text("description"),
  notes: text("notes"),
  expectedCloseDate: text("expected_close_date"),
  actualCloseDate: text("actual_close_date"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  linkedProjectId: integer("linked_project_id").references(() => projects.id),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
  updatedAt: text("updated_at").default("datetime('now', 'localtime')"),
});

// Proposals Schema - SQLite compatible
export const proposals = sqliteTable("proposals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  opportunityId: integer("opportunity_id").references(() => opportunities.id).notNull(),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  workScope: text("work_scope").notNull(),
  proposedPrice: real("proposed_price").notNull(),
  status: text("status").default('draft'),
  submissionDate: text("submission_date"),
  submissionDeadline: text("submission_deadline"),
  technicalProposalPath: text("technical_proposal_path"),
  financialProposalPath: text("financial_proposal_path"),
  rejectionReason: text("rejection_reason"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
  updatedAt: text("updated_at").default("datetime('now', 'localtime')"),
});

// Events Schema - SQLite compatible
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  location: text("location"),
  invitationPath: text("invitation_path"),
  qrCodePath: text("qr_code_path"),
  attendees: text("attendees"),
  reminderSent: integer("reminder_sent", { mode: 'boolean' }).default(false),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
  updatedAt: text("updated_at").default("datetime('now', 'localtime')"),
});

// Leave Request Tables - SQLite compatible
export const leaveRequests = sqliteTable("leave_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  daysCount: integer("days_count").notNull(),
  leaveType: text("leave_type").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("pending").notNull(),
  notes: text("notes").default(''),
  adminNotes: text("admin_notes").default(''),
  lastModifiedBy: integer("last_modified_by").references(() => users.id),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
  updatedAt: text("updated_at").default("datetime('now', 'localtime')"),
});

// Leave Approvals Schema - SQLite compatible
export const leaveApprovals = sqliteTable("leave_approvals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leaveRequestId: integer("leave_request_id").references(() => leaveRequests.id).notNull(),
  approverId: integer("approver_id").references(() => users.id).notNull(),
  approverRole: text("approver_role").notNull(),
  status: text("status").default("pending").notNull(),
  comments: text("comments"),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
});

// Residence Renewals Schema - SQLite compatible
export const residenceRenewals = sqliteTable("residence_renewals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  oldExpiryDate: text("old_expiry_date").notNull(),
  newExpiryDate: text("new_expiry_date").notNull(),
  renewalPeriodMonths: integer("renewal_period_months").notNull(),
  processedBy: integer("processed_by").notNull().references(() => users.id),
  processedAt: text("processed_at").default("datetime('now', 'localtime')"),
  notes: text("notes"),
});

// Residence Notifications Schema - SQLite compatible
export const residenceNotifications = sqliteTable("residence_notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  notificationType: text("notification_type").notNull(),
  expiryDate: text("expiry_date").notNull(),
  sentAt: text("sent_at").default("datetime('now', 'localtime')"),
  sentTo: text("sent_to").notNull(),
  isProcessed: integer("is_processed", { mode: 'boolean' }).default(false),
});

// Opportunity Files Schema - SQLite compatible
export const opportunityFiles = sqliteTable("opportunity_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  opportunityId: integer("opportunity_id").references(() => opportunities.id).notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type"),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: text("uploaded_at").default("datetime('now', 'localtime')"),
});

// Opportunity Notes Schema - SQLite compatible
export const opportunityNotes = sqliteTable("opportunity_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  opportunityId: integer("opportunity_id").references(() => opportunities.id).notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: text("created_at").default("datetime('now', 'localtime')"),
});

// Define Zod schemas from Drizzle tables
export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email format"),
  role: z.enum(['admin', 'project_manager', 'engineer', 'admin_staff', 'hr_manager', 'general_manager']),
  phone: z.string().nullable().optional().default(null),
  department: z.string().nullable().optional().default(null),
  position: z.string().nullable().optional().default(null),
  hireDate: z.string().nullable().optional().default(null),
  salary: z.number().nullable().optional().default(null),
  nationality: z.enum(['saudi', 'resident']).optional(),
  residenceNumber: z.string().nullable().optional().default(null),
  residenceExpiryDate: z.string().nullable().optional().default(null),
  residenceStatus: z.enum(['active', 'expired', 'expiring_soon']).optional(),
});

export const insertClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email format").nullable().optional().default(null),
  phone: z.string().nullable().optional().default(null),
  address: z.string().nullable().optional().default(null),
  city: z.string().nullable().optional().default(null),
  notes: z.string().nullable().optional().default(null),
});

export const insertProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional().default(null),
  clientId: z.number().min(1, "Client ID is required"),
  location: z.string().nullable().optional().default(null),
  status: z.enum(['new', 'in_progress', 'delayed', 'completed', 'cancelled']).optional(),
  startDate: z.string().nullable().optional().default(null),
  targetEndDate: z.string().nullable().optional().default(null),
  actualEndDate: z.string().nullable().optional().default(null),
  completionPercentage: z.number().optional(),
  createdBy: z.number().min(1, "Created by is required"),
});

export const insertTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  projectId: z.number().min(1, "Project ID is required"),
  assignedTo: z.number().min(1, "Assigned to is required"),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'cancelled']).optional(),
  dueDate: z.string().nullable().optional(),
  createdBy: z.number().min(1, "Created by is required"),
});

export const insertOpportunitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientName: z.string().min(1, "Client name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  organization: z.string().optional(),
  type: z.enum(['architectural', 'structural', 'mep', 'consultation', 'supervision', 'other']),
  status: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  strength: z.enum(['low', 'medium', 'high']).optional(),
  estimatedValue: z.number().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  expectedCloseDate: z.string().nullable().optional(),
  actualCloseDate: z.string().nullable().optional(),
  createdBy: z.number().min(1, "Created by is required"),
  assignedTo: z.number().optional(),
  linkedProjectId: z.number().optional(),
});

export const insertAttendanceSchema = z.object({
  userId: z.number(),
  date: z.string(),
  status: z.string().optional(),
  clockInTime: z.string().optional().nullable(),
  clockOutTime: z.string().optional().nullable(),
  checkIn: z.string().optional(),
  notes: z.string().optional(),
  late: z.number().optional(),  // SQLite uses integers for booleans
  recordedBy: z.number(),
  createdBy: z.number().optional(),
});

export const insertLeaveRequestSchema = z.object({
  userId: z.number().min(1, "User ID is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  daysCount: z.number().min(1, "Days count is required"),
  leaveType: z.enum(['annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity']),
  reason: z.string().min(1, "Reason is required"),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  notes: z.string().optional(),
  adminNotes: z.string().optional(),
  lastModifiedBy: z.number().optional(),
});

export const insertProjectPhaseSchema = createInsertSchema(projectPhases).omit({ id: true, completionPercentage: true, createdAt: true });
export const insertProjectStaffSchema = createInsertSchema(projectStaff).omit({ id: true, assignedAt: true });
export const insertProjectFileSchema = createInsertSchema(projectFiles).omit({ id: true, uploadedAt: true });
export const insertClientNoteSchema = createInsertSchema(clientNotes).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, readStatus: true, createdAt: true });
export const insertStaffEvaluationSchema = createInsertSchema(staffEvaluations).omit({ id: true, evaluatedAt: true });
export const insertProposalSchema = createInsertSchema(proposals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeaveApprovalSchema = createInsertSchema(leaveApprovals).omit({ id: true, createdAt: true, approvedAt: true });
export const insertOpportunityFileSchema = createInsertSchema(opportunityFiles).omit({ id: true, uploadedAt: true });
export const insertOpportunityNoteSchema = createInsertSchema(opportunityNotes).omit({ id: true, createdAt: true });
export const insertResidenceRenewalSchema = createInsertSchema(residenceRenewals).omit({ id: true, processedAt: true });
export const insertResidenceNotificationSchema = createInsertSchema(residenceNotifications).omit({ id: true, sentAt: true });

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  createdProjects: many(projects, { relationName: "project_creator" }),
  projectAssignments: many(projectStaff),
  attendanceRecords: many(attendance, { relationName: "user_attendance" }),
  recordedAttendance: many(attendance, { relationName: "attendance_recorder" }),
  notifications: many(notifications),
  evaluations: many(staffEvaluations, { relationName: "evaluated_user" }),
  evaluationsGiven: many(staffEvaluations, { relationName: "evaluator" }),
  uploadedFiles: many(projectFiles),
  createdTasks: many(tasks, { relationName: "task_creator" }),
  assignedTasks: many(tasks, { relationName: "task_assignee" }),
  leaveRequests: many(leaveRequests),
  opportunities: many(opportunities, { relationName: "opportunity_creator" }),
  assignedOpportunities: many(opportunities, { relationName: "opportunity_assignee" }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  notes: many(clientNotes),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
    relationName: "project_client"
  }),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
    relationName: "project_creator"
  }),
  staff: many(projectStaff),
  tasks: many(tasks),
  phases: many(projectPhases),
  files: many(projectFiles),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
    relationName: "user_attendance"
  }),
  recorder: one(users, {
    fields: [attendance.createdBy],
    references: [users.id],
    relationName: "attendance_recorder"
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
  }),
  approvals: many(leaveApprovals),
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  creator: one(users, {
    fields: [opportunities.createdBy],
    references: [users.id],
    relationName: "opportunity_creator"
  }),
  assignee: one(users, {
    fields: [opportunities.assignedTo],
    references: [users.id],
    relationName: "opportunity_assignee"
  }),
  linkedProject: one(projects, {
    fields: [opportunities.linkedProjectId],
    references: [projects.id],
  }),
  proposals: many(proposals),
  files: many(opportunityFiles),
  notes: many(opportunityNotes),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "task_assignee"
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "task_creator"
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;