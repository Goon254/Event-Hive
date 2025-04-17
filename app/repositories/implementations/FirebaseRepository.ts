// app/repositories/implementations/FirebaseRepository.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  DocumentReference,
  CollectionReference,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { IRepository } from '../interfaces/IRepository';
import { sanitizeForFirestore } from '../../services/migrationService';

/**
 * Base Firebase repository implementation
 * @template T The entity type
 * @template ID The ID type (usually string for Firebase)
 */
export abstract class FirebaseRepository<T extends { id: string }, ID = string> implements IRepository<T, ID> {
  protected collectionName: string;
  protected collectionRef: CollectionReference;

  /**
   * Constructor
   * @param collectionName The Firestore collection name
   */
  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
  }

  /**
   * Create a new entity
   * @param entity The entity to create
   * @returns Promise resolving to the created entity with ID
   */
  async create(entity: Omit<T, 'id'>): Promise<T> {
    try {
      // Sanitize the entity data to remove any undefined values
      const sanitizedData = sanitizeForFirestore({
        ...entity,
        createdAt: serverTimestamp()
      });

      // Add document to Firestore
      const docRef = await addDoc(this.collectionRef, sanitizedData);
      
      // Return the created entity with the generated ID
      return {
        id: docRef.id,
        ...entity,
        createdAt: Timestamp.now() // Replace serverTimestamp with current timestamp for immediate use
      } as unknown as T;
    } catch (error) {
      console.error(`Error creating ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get an entity by ID
   * @param id The entity ID
   * @returns Promise resolving to the entity or null if not found
   */
  async getById(id: ID): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id as string);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as T;
    } catch (error) {
      console.error(`Error getting ${this.collectionName} by ID:`, error);
      throw error;
    }
  }

  /**
   * Update an existing entity
   * @param id The entity ID
   * @param entity The updated entity data
   * @returns Promise resolving to the updated entity
   */
  async update(id: ID, entity: Partial<T>): Promise<T> {
    try {
      const docRef = doc(db, this.collectionName, id as string);
      
      // Check if document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error(`${this.collectionName} with ID ${id} not found`);
      }
      
      // Sanitize the entity data to remove any undefined values
      const sanitizedData = sanitizeForFirestore({
        ...entity,
        updatedAt: serverTimestamp()
      });
      
      // Update document in Firestore
      await updateDoc(docRef, sanitizedData);
      
      // Get the updated document
      const updatedDocSnap = await getDoc(docRef);
      
      return {
        id: updatedDocSnap.id,
        ...updatedDocSnap.data()
      } as T;
    } catch (error) {
      console.error(`Error updating ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Delete an entity by ID
   * @param id The entity ID
   * @returns Promise resolving when the entity is deleted
   */
  async delete(id: ID): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id as string);
      
      // Check if document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error(`${this.collectionName} with ID ${id} not found`);
      }
      
      // Delete document from Firestore
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get all entities (with optional filtering)
   * @param options Optional query options
   * @returns Promise resolving to an array of entities
   */
  async getAll(options?: {
    whereConditions?: [string, string, any][];
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    limitCount?: number;
  }): Promise<T[]> {
    try {
      const constraints: QueryConstraint[] = [];
      
      // Add where conditions if provided
      if (options?.whereConditions) {
        for (const [field, operator, value] of options.whereConditions) {
          constraints.push(where(field, operator as any, value));
        }
      }
      
      // Add orderBy if provided
      if (options?.orderByField) {
        constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
      }
      
      // Add limit if provided
      if (options?.limitCount) {
        constraints.push(limit(options.limitCount));
      }
      
      // Create query
      const q = constraints.length > 0
        ? query(this.collectionRef, ...constraints)
        : this.collectionRef;
      
      // Execute query
      const querySnapshot = await getDocs(q);
      
      // Map results to entities
      const entities: T[] = [];
      querySnapshot.forEach((doc) => {
        entities.push({
          id: doc.id,
          ...doc.data()
        } as T);
      });
      
      return entities;
    } catch (error) {
      console.error(`Error getting all ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to get a document reference
   * @param id The document ID
   * @returns The document reference
   */
  protected getDocRef(id: string): DocumentReference<DocumentData> {
    return doc(db, this.collectionName, id);
  }
}

// Add default export
export default FirebaseRepository;