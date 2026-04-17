"use client";

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  DocumentData,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import { COLLECTIONS, Staff, Finance, Event } from "./types";

export interface PaginationResult<T> {
  data: T[];
  lastDoc: DocumentData | null;
  hasMore: boolean;
}

async function getAllDocs<T>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}

export async function getStaff(filters?: {
  department?: string;
  status?: string;
}): Promise<Staff[]> {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (filters?.department) {
    constraints.push(where("department", "==", filters.department));
  }
  if (filters?.status) {
    constraints.push(where("status", "==", filters.status));
  }
  return getAllDocs<Staff>(COLLECTIONS.STAFF, constraints);
}

export async function createStaff(
  data: Omit<Staff, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const now = Date.now();
  const docRef = await addDoc(collection(db, COLLECTIONS.STAFF), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateStaff(
  id: string,
  data: Partial<Staff>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.STAFF, id), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteStaff(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.STAFF, id));
}

export async function getFinance(filters?: {
  type?: "income" | "expense";
  category?: string;
  startDate?: number;
  endDate?: number;
}): Promise<Finance[]> {
  const constraints: QueryConstraint[] = [orderBy("date", "desc")];
  if (filters?.type) {
    constraints.push(where("type", "==", filters.type));
  }
  if (filters?.category) {
    constraints.push(where("category", "==", filters.category));
  }
  const data = await getAllDocs<Finance>(COLLECTIONS.FINANCE, constraints);
  if (filters?.startDate || filters?.endDate) {
    return data.filter((item) => {
      if (filters.startDate && item.date < filters.startDate) return false;
      if (filters.endDate && item.date > filters.endDate) return false;
      return true;
    });
  }
  return data;
}

export async function createFinance(
  data: Omit<Finance, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const now = Date.now();
  const docRef = await addDoc(collection(db, COLLECTIONS.FINANCE), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateFinance(
  id: string,
  data: Partial<Finance>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.FINANCE, id), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteFinance(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.FINANCE, id));
}

export async function getEvents(filters?: {
  upcoming?: boolean;
}): Promise<Event[]> {
  const constraints: QueryConstraint[] = [orderBy("date", "asc")];
  const data = await getAllDocs<Event>(COLLECTIONS.EVENTS, constraints);
  if (filters?.upcoming) {
    const now = Date.now();
    return data.filter((event) => event.date >= now);
  }
  return data;
}

export async function createEvent(
  data: Omit<Event, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const now = Date.now();
  const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateEvent(
  id: string,
  data: Partial<Event>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.EVENTS, id), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.EVENTS, id));
}
