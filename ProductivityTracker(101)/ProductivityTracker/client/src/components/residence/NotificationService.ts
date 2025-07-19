// Residence Notification Service
// This service handles automatic notification creation for residence expiry

export interface ResidenceNotification {
  userId: number;
  type: 'residence_expiry';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  expiryDate: string;
  daysUntilExpiry: number;
}

export const createResidenceExpiryNotification = async (
  userId: number, 
  fullName: string, 
  expiryDate: string,
  daysUntilExpiry: number
): Promise<void> => {
  const notifications: ResidenceNotification[] = [];
  
  // Determine notification priority and message based on days until expiry
  let priority: 'low' | 'medium' | 'high' = 'low';
  let title = '';
  let message = '';

  if (daysUntilExpiry <= 0) {
    priority = 'high';
    title = 'إقامة منتهية الصلاحية';
    message = `إقامة الموظف ${fullName} منتهية الصلاحية. يرجى التجديد فوراً.`;
  } else if (daysUntilExpiry <= 7) {
    priority = 'high';
    title = 'إقامة تنتهي خلال أسبوع';
    message = `إقامة الموظف ${fullName} تنتهي خلال ${daysUntilExpiry} أيام. يرجى التجديد عاجلاً.`;
  } else if (daysUntilExpiry <= 30) {
    priority = 'medium';
    title = 'إقامة تنتهي خلال شهر';
    message = `إقامة الموظف ${fullName} تنتهي خلال ${daysUntilExpiry} يوم. يرجى بدء إجراءات التجديد.`;
  } else if (daysUntilExpiry <= 90) {
    priority = 'low';
    title = 'إقامة تنتهي خلال 3 أشهر';
    message = `إقامة الموظف ${fullName} تنتهي خلال ${daysUntilExpiry} يوم. يرجى التخطيط للتجديد.`;
  }

  if (title && message) {
    // Create notification for HR managers and admin
    const notificationData = {
      type: 'residence_expiry',
      title,
      message,
      priority,
      referenceType: 'residence',
      referenceId: userId.toString(),
      targetRoles: ['admin', 'hr_manager', 'general_manager']
    };

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      console.log(`Created residence expiry notification for ${fullName} (${daysUntilExpiry} days)`);
    } catch (error) {
      console.error('Error creating residence notification:', error);
    }
  }
};

export const checkAndCreateResidenceNotifications = async (users: any[]): Promise<void> => {
  if (!Array.isArray(users)) {
    console.log('No users data provided for residence notification check');
    return;
  }

  const today = new Date();
  console.log('🚨 CHECKING RESIDENCE NOTIFICATIONS for', users.length, 'users');
  
  for (const user of users) {
    if (user.nationality === 'resident' && user.residenceExpiryDate) {
      const expiryDate = new Date(user.residenceExpiryDate);
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`👤 User ${user.fullName}: residence expires in ${daysUntilExpiry} days`);
      
      // Create notifications for residence expiring within 3 months (90 days)
      if (daysUntilExpiry <= 90 && daysUntilExpiry >= 0) {
        console.log(`🚨 CREATING URGENT NOTIFICATION for ${user.fullName} - expires in ${daysUntilExpiry} days`);
        
        let urgencyLevel = '';
        let priority: 'low' | 'medium' | 'high' = 'medium';
        
        if (daysUntilExpiry <= 7) {
          urgencyLevel = 'خلال أسبوع واحد';
          priority = 'high';
        } else if (daysUntilExpiry <= 30) {
          urgencyLevel = 'خلال شهر واحد';
          priority = 'high';
        } else if (daysUntilExpiry <= 60) {
          urgencyLevel = 'خلال شهرين';
          priority = 'medium';
        } else {
          urgencyLevel = 'خلال 3 أشهر';
          priority = 'medium';
        }
        
        try {
          // Create residence alert notification
          const response = await fetch('/api/notifications/residence-alert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              type: 'residence_expiry_alert',
              title: `🚨 تحذير عاجل: انتهاء إقامة ${urgencyLevel}`,
              message: `الموظف: ${user.fullName}\nرقم الإقامة: ${user.residenceNumber || 'غير محدد'}\nتاريخ الانتهاء: ${expiryDate.toLocaleDateString('ar-SA')}\nالأيام المتبقية: ${daysUntilExpiry} يوم\n\n⚠️ يرجى اتخاذ الإجراءات اللازمة للتجديد فوراً`,
              priority: priority,
              metadata: {
                userId: user.id,
                expiryDate: user.residenceExpiryDate,
                daysUntilExpiry: daysUntilExpiry
              }
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ SUCCESS: Created ${result.notifications} residence notifications for ${user.fullName}`);
          } else {
            console.error(`❌ FAILED to create notification for ${user.fullName}:`, await response.text());
          }
        } catch (error) {
          console.error(`❌ NETWORK ERROR creating notification for ${user.fullName}:`, error);
        }
      } else if (daysUntilExpiry > 90) {
        console.log(`✅ User ${user.fullName}: residence expires in ${daysUntilExpiry} days (> 90 days, no notification needed)`);
      } else {
        console.log(`⚠️ User ${user.fullName}: residence expired ${Math.abs(daysUntilExpiry)} days ago`);
      }
    }
  }
  
  console.log('🏁 RESIDENCE NOTIFICATION CHECK COMPLETED');
};