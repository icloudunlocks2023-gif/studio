'use client';
import { useState, useEffect } from 'react';
import {
  onSnapshot,
  collection,
  query,
  Query,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

interface UseCollectionOptions {
  constraints?: QueryConstraint[];
}

export function useCollection<T>(
  collectionName: string,
  options?: UseCollectionOptions
) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Note: Users should memoize constraints in their components using useMemo 
  // to prevent infinite listener restarts.
  const memoizedConstraints = options?.constraints;

  useEffect(() => {
    let q: Query<DocumentData>;
    const collectionRef = collection(firestore, collectionName);

    if (memoizedConstraints && memoizedConstraints.length > 0) {
      q = query(collectionRef, ...memoizedConstraints);
    } else {
      q = query(collectionRef);
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as T)
        );
        setData(docs);
        setLoading(false);
      },
      (serverError) => {
        setError(serverError);
        setLoading(false);
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [firestore, collectionName, memoizedConstraints]);

  return { data, loading, error };
}