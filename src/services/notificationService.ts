
export const notificationService = {
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async sendLocalNotification(title: string, body: string, options: NotificationOptions = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3067/3067160.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3067/3067160.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  },

  isSupported() {
    return 'Notification' in window;
  },

  getPermissionStatus() {
    return Notification.permission;
  },

  checkAndTriggerScheduledNotifications(orders: any[]) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date();
    const curHour = now.getHours();
    const todayStr = now.toISOString().split('T')[0];

    // Retrieve from localStorage or initialize
    const stored = localStorage.getItem('manomay_notifications_sent');
    const sentLog = stored ? JSON.parse(stored) : { morning: '', evening: '', night: '' };

    const isSameDayStr = (d1: string, d2: string) => {
      if (!d1 || !d2) return false;
      return d1.split('T')[0] === d2.split('T')[0];
    };

    // 1. Morning Daily Agenda (7:00 AM - 11:59 AM)
    if (curHour >= 7 && curHour < 12) {
      if (sentLog.morning !== todayStr) {
        const pendingCount = orders.filter(o => ['pending', 'cutting', 'stitching', 'trial'].includes(o.status)).length;
        const scheduledTodayCount = orders.filter(o => 
          (o.cutting_date && isSameDayStr(o.cutting_date, todayStr)) || 
          (o.delivery_date && isSameDayStr(o.delivery_date, todayStr))
        ).length;

        this.sendLocalNotification(
          "Morning Tailoring Agenda! 👕",
          `You have ${pendingCount} pending orders and ${scheduledTodayCount} tasks scheduled for today. Have a productive day!`
        );

        sentLog.morning = todayStr;
        localStorage.setItem('manomay_notifications_sent', JSON.stringify(sentLog));
      }
    }

    // 2. Evening Workload Update (4:00 PM - 7:59 PM)
    if (curHour >= 16 && curHour < 20) {
      if (sentLog.evening !== todayStr) {
        const pendingCount = orders.filter(o => ['pending', 'cutting', 'stitching', 'trial', 'ready'].includes(o.status)).length;
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const dueTomorrowCount = orders.filter(o => o.delivery_date && isSameDayStr(o.delivery_date, tomorrowStr)).length;

        this.sendLocalNotification(
          "Evening Workload Update ✂️",
          `Currently, ${pendingCount} orders remain. You have ${dueTomorrowCount} due tomorrow.`
        );

        sentLog.evening = todayStr;
        localStorage.setItem('manomay_notifications_sent', JSON.stringify(sentLog));
      }
    }

    // 3. Nightly Log Reminder (8:05 PM - 11:59 PM)
    if (curHour >= 20 && curHour <= 23) {
      if (sentLog.night !== todayStr) {
        this.sendLocalNotification(
          "Daily Tailoring Checklist 📋",
          "Don't forget to update your cutting, stitching, and trial progress in the app before finishing for the day!"
        );

        sentLog.night = todayStr;
        localStorage.setItem('manomay_notifications_sent', JSON.stringify(sentLog));
      }
    }
  }
};
