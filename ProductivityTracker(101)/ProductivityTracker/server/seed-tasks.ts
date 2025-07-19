import { db } from "./db";
import { tasks, users, projects } from "@shared/schema";

// Script to add sample tasks for testing the Task Management system
export async function seedTasks() {
  try {
    // Get existing users and projects
    const allUsers = await db.select().from(users);
    const allProjects = await db.select().from(projects);

    if (allUsers.length === 0 || allProjects.length === 0) {
      console.log("No users or projects found. Please ensure sample data exists first.");
      return;
    }

    const admin = allUsers.find(u => u.role === 'admin') || allUsers[0];
    const engineer = allUsers.find(u => u.role === 'engineer') || allUsers[0];
    const project = allProjects[0];

    // Sample tasks data
    const sampleTasks = [
      {
        title: "Design Foundation Plan",
        description: "Create detailed foundation plans for the residential tower including soil analysis and structural calculations.",
        projectId: project.id,
        assignedTo: engineer.id,
        priority: "high" as const,
        status: "in_progress" as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        createdBy: admin.id,
      },
      {
        title: "Review Building Permits",
        description: "Review and process all required building permits and regulatory approvals for the project.",
        projectId: project.id,
        assignedTo: admin.id,
        priority: "medium" as const,
        status: "not_started" as const,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        createdBy: admin.id,
      },
      {
        title: "Site Survey Completion",
        description: "Complete topographical survey and site analysis for construction planning.",
        projectId: project.id,
        assignedTo: engineer.id,
        priority: "high" as const,
        status: "completed" as const,
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
        createdBy: admin.id,
      },
      {
        title: "Client Presentation Preparation",
        description: "Prepare presentation materials for client review meeting including 3D renderings and project timeline.",
        projectId: project.id,
        assignedTo: admin.id,
        priority: "medium" as const,
        status: "in_progress" as const,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
        createdBy: admin.id,
      }
    ];

    // Insert sample tasks
    for (const taskData of sampleTasks) {
      await db.insert(tasks).values(taskData);
    }

    console.log(`Successfully created ${sampleTasks.length} sample tasks`);
  } catch (error) {
    console.error("Error seeding tasks:", error);
  }
}

// Run if called directly
if (require.main === module) {
  seedTasks().then(() => process.exit(0));
}