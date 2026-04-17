import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
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
  limit
} from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get('collection') || 'events';
    const id = searchParams.get('id');
    const limitNum = parseInt(searchParams.get('limit') || '100');
    const orderByField = searchParams.get('orderBy');
    const orderDirection = searchParams.get('orderDirection') || 'desc';
    const whereField = searchParams.get('whereField');
    const whereValue = searchParams.get('whereValue');

    if (id) {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      
      return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    }

    let q = collection(db, collectionName);
    const constraints = [];

    if (whereField && whereValue) {
      constraints.push(where(whereField, '==', whereValue));
    }
    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection as 'asc' | 'desc'));
    }
    constraints.push(limit(limitNum));

    const finalQuery = query(q, ...constraints);
    const snapshot = await getDocs(finalQuery);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get('collection') || 'events';
    const body = await request.json();

    const docRef = await addDoc(collection(db, collectionName), {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: docRef.id, message: 'Document created' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get('collection');
    const id = searchParams.get('id');

    if (!collectionName || !id) {
      return NextResponse.json({ error: 'Collection and ID required' }, { status: 400 });
    }

    const body = await request.json();
    const docRef = doc(db, collectionName, id);

    await updateDoc(docRef, {
      ...body,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: 'Document updated' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get('collection');
    const id = searchParams.get('id');

    if (!collectionName || !id) {
      return NextResponse.json({ error: 'Collection and ID required' }, { status: 400 });
    }

    await deleteDoc(doc(db, collectionName, id));

    return NextResponse.json({ message: 'Document deleted' });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}