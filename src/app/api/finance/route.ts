/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp({
      credential: cert(serviceAccount as any),
    });
  }
  return getApps()[0];
}

export async function GET(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const docSnap = await db.collection('finance').doc(id).get();
      if (!docSnap.exists) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    }

    let snapshot;
    try {
      snapshot = await db.collection('finance').orderBy('date', 'desc').limit(100).get();
    } catch (orderError) {
      snapshot = await db.collection('finance').limit(100).get();
    }

    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();
    const body = await request.json();

    const docRef = await db.collection('finance').add({
      ...body,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return NextResponse.json({ id: docRef.id, message: 'Document created' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const body = await request.json();
    await db.collection('finance').doc(id).update({
      ...body,
      updatedAt: Date.now(),
    });

    return NextResponse.json({ message: 'Document updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    getFirebaseApp();
    const db = getFirestore();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await db.collection('finance').doc(id).delete();

    return NextResponse.json({ message: 'Document deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}