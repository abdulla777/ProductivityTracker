/**
 * Residence Notification Service
 * Automated service to check and send residence expiry notifications
 */

import { storage } from "./storage";

interface NotificationSchedule {
  type: '3_months' | '1_month' | '1_week' | 'daily';
  daysBeforeExpiry: number;
  title: string;
  priority: 'low' | 'medium' | 'high';
}

const NOTIFICATION_SCHEDULE: NotificationSchedule[] = [
  {
    type: '3_months',
    daysBeforeExpiry: 90,
    title: 'تنبيه: الإقامة تنتهي خلال 3 أشهر',
    priority: 'low'
  },
  {
    type: '1_month', 
    daysBeforeExpiry: 30,
    title: 'تحذير: الإقامة تنتهي خلال شهر واحد',
    priority: 'medium'
  },
  {
    type: '1_week',
    daysBeforeExpiry: 7,
    title: 'تحذير عاجل: الإقامة تنتهي خلال أسبوع',
    priority: 'high'
  },
  {
    type: 'daily',
    daysBeforeExpiry: 1,
    title: 'تحذير فوري: الإقامة تنتهي غداً',
    priority: 'high'
  }
];

export class ResidenceNotificationService {
  
  async checkAndSendNotifications(): Promise<void> {
    console.log('Running residence notification check...');
    
    try {
      // Get all residents - with error handling for database schema differences
      const residents = await storage.checkExpiringResidences();
      let notificationsSent = 0;
      
      for (const resident of residents) {
        if (!resident.residenceExpiryDate) continue;
        
        const expiryDate = new Date(resident.residenceExpiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`Checking ${resident.fullName}: ${daysUntilExpiry} days until expiry`);
        
        // Check each notification schedule
        for (const schedule of NOTIFICATION_SCHEDULE) {
          if (this.shouldSendNotification(daysUntilExpiry, schedule)) {
            await this.sendNotification(resident, schedule, expiryDate);
            notificationsSent++;
          }
        }
      }
      
      console.log(`Residence notification check completed. Sent ${notificationsSent} notifications.`);
    } catch (error) {
      console.error('Error in residence notification service:', error);
    }
  }
  
  // Real-time notification check when residence data is updated
  async checkSpecificUser(userId: number): Promise<void> {
    console.log(`Running real-time residence check for user ${userId}...`);
    
    try {
      const user = await storage.getUser(userId);
      if (!user || !user.residenceExpiryDate) {
        console.log('User not found or no residence expiry date');
        return;
      }
      
      const expiryDate = new Date(user.residenceExpiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`User ${user.fullName}: ${daysUntilExpiry} days until expiry`);
      
      // Send immediate notification if within critical periods
      for (const schedule of NOTIFICATION_SCHEDULE) {
        if (this.shouldSendNotification(daysUntilExpiry, schedule)) {
          await this.sendNotification(user, schedule, expiryDate);
          console.log(`Sent ${schedule.type} notification for ${user.fullName}`);
        }
      }
    } catch (error) {
      console.error('Error in real-time residence notification check:', error);
    }
  }
  
  private shouldSendNotification(daysUntilExpiry: number, schedule: NotificationSchedule): boolean {
    if (schedule.type === 'daily') {
      // Send daily notifications for the last 7 days
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    }
    
    // Enhanced notification logic - send if within range for first time alerts
    if (schedule.type === '3_months') {
      // Send notification for 3 months (90 days) or less
      return daysUntilExpiry <= 90 && daysUntilExpiry > 30;
    }
    
    if (schedule.type === '1_month') {
      // Send notification for 1 month (30 days) or less
      return daysUntilExpiry <= 30 && daysUntilExpiry > 7;
    }
    
    if (schedule.type === '1_week') {
      // Send notification for 1 week (7 days) or less
      return daysUntilExpiry <= 7 && daysUntilExpiry > 1;
    }
    
    return false;
  }
  
  private async sendNotification(resident: any, schedule: NotificationSchedule, expiryDate: Date): Promise<void> {
    try {
      const message = `${schedule.title}\nالموظف: ${resident.fullName}\nرقم الإقامة: ${resident.residenceNumber}\nتاريخ الانتهاء: ${expiryDate.toLocaleDateString('ar-SA')}`;
      
      // Create notification for the resident
      await storage.createNotification({
        recipientId: resident.id,
        type: 'residence_expiry',
        title: schedule.title,
        message: message,
        priority: schedule.priority
      });
      
      // Create notifications for HR managers and General managers
      const managers = await this.getHRAndGeneralManagers();
      
      for (const manager of managers) {
        await storage.createNotification({
          recipientId: manager.id,
          type: 'residence_expiry_manager',
          title: `${schedule.title} - ${resident.fullName}`,
          message: message,
          priority: schedule.priority
        });
      }
      
      // Record the notification in residence_notifications table
      await storage.createResidenceNotification({
        userId: resident.id,
        notificationType: schedule.type,
        expiryDate: expiryDate.toISOString().split('T')[0],
        sentTo: managers.map(m => m.role).join(','),
        isProcessed: false
      });
      
      console.log(`Sent ${schedule.type} notification for ${resident.fullName}`);
    } catch (error) {
      console.error(`Error sending notification for ${resident.fullName}:`, error);
    }
  }
  
  private async getHRAndGeneralManagers(): Promise<any[]> {
    const allUsers = await storage.getAllUsers();
    return allUsers.filter(user => 
      user.role === 'hr_manager' || 
      user.role === 'general_manager' || 
      user.role === 'admin'
    );
  }
  
  // Method to start the notification service (can be called periodically)
  startService(intervalHours: number = 24): NodeJS.Timeout {
    console.log(`Starting residence notification service with ${intervalHours}h interval`);
    
    // Run immediately
    this.checkAndSendNotifications();
    
    // Then run every intervalHours
    return setInterval(() => {
      this.checkAndSendNotifications();
    }, intervalHours * 60 * 60 * 1000);
  }
}

export const residenceNotificationService = new ResidenceNotificationService();