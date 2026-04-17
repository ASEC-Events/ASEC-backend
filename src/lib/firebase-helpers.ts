import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint
} from 'firebase/firestore';

export async function getCollection<T>(collectionName: string, constraints?: QueryConstraint[]): Promise<T[]> {
  const colRef = collection(db, collectionName);
  const q = constraints && constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T;
}

export async function createDocument(collectionName: string, data: Partial<unknown>): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateDocument(collectionName: string, id: string, data: Partial<unknown>): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

export function createQuery(constraints: {
  where?: { field: string; value: unknown }[];
  orderBy?: { field: string; direction?: 'asc' | 'desc' };
  limit?: number;
}): QueryConstraint[] {
  const q: QueryConstraint[] = [];
  
  if (constraints.where) {
    constraints.where.forEach(({ field, value }) => {
      q.push(where(field, '==', value));
    });
  }
  
  if (constraints.orderBy) {
    q.push(orderBy(constraints.orderBy.field, constraints.orderBy.direction || 'desc'));
  }
  
  if (constraints.limit) {
    q.push(limit(constraints.limit));
  }
  
  return q;
}