import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  Unsubscribe,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';

export type NotificationType = 
  | 'booking_created' 
  | 'booking_confirmed' 
  | 'booking_cancelled'
  | 'booking_updated'
  | 'staff_added'
  | 'finance_added';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  data?: Record<string, unknown>;
}

const NOTIFICATIONS_COLLECTION = 'notifications';

export async function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<string> {
  const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    type,
    title,
    message,
    read: false,
    createdAt: Date.now(),
    data: data || {},
  });
  return docRef.id;
}

export function subscribeToNotifications(
  callback: (notifications: Notification[]) => void,
  onlyUnread: boolean = false
): Unsubscribe {
  const constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
  ];

  if (onlyUnread) {
    constraints.push(where('read', '==', false));
  }

  const q = query(collection(db, NOTIFICATIONS_COLLECTION), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
    callback(notifications);
  });
}

export async function getUnreadCount(): Promise<number> {
  const { getDocs, query, where, orderBy, limit } = require('firebase/firestore');
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where('read', '==', false),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export const NOTIFICATION_TYPES: Record<NotificationType, { title: string; message: string }> = {
  booking_created: {
    title: 'New Booking',
    message: 'A new booking has been submitted',
  },
  booking_confirmed: {
    title: 'Booking Confirmed',
    message: 'A booking has been confirmed',
  },
  booking_cancelled: {
    title: 'Booking Cancelled',
    message: 'A booking has been cancelled',
  },
  booking_updated: {
    title: 'Booking Updated',
    message: 'A booking has been updated',
  },
  staff_added: {
    title: 'New Staff',
    message: 'A new staff member has been added',
  },
  finance_added: {
    title: 'New Finance Entry',
    message: 'A new finance entry has been added',
  },
};

export function formatNotificationMessage(
  type: NotificationType,
  data: Record<string, unknown>
): string {
  const base = NOTIFICATION_TYPES[type];
  
  switch (type) {
    case 'booking_created':
      return `${data.fullName || 'A guest'} booked for ${data.eventType || 'an event'} on ${data.eventDate ? new Date(data.eventDate as number).toLocaleDateString() : 'TBD'}`;
    case 'booking_confirmed':
    case 'booking_cancelled':
      return `Booking #${data.bookingId?.toString().slice(0, 8) || ''}`;
    case 'booking_updated':
      return `Booking updated to ${data.status || 'pending'}`;
    case 'staff_added':
      return `${data.name || 'New staff member'} - ${data.department || 'Staff'}`;
    case 'finance_added':
      return `${data.type === 'income' ? '+' : '-'}$${data.amount || 0} - ${data.category || 'Finance'}`;
    default:
      return base.message;
  }
}