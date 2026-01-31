import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Entity } from '../store/entitySlice';

const COLLECTION_NAME = 'entities';

export const entityService = {
    async fetchEntities(orgId: string): Promise<Entity[]> {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where('orgId', '==', orgId)
            );
            const querySnapshot = await getDocs(q);
            const entities: Entity[] = [];
            querySnapshot.forEach((doc) => {
                entities.push({ id: doc.id, ...doc.data() } as Entity);
            });
            return entities;
        } catch (error) {
            console.error('Error fetching entities:', error);
            throw error;
        }
    },

    async createEntity(orgId: string, entity: Omit<Entity, 'id'>): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...entity,
                orgId,
                consolidationMethod: entity.consolidationMethod || 'full',
                createdAt: new Date().toISOString(),
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating entity:', error);
            throw error;
        }
    },

    async updateEntity(entityId: string, updates: Partial<Entity>): Promise<void> {
        try {
            const docRef = doc(db, COLLECTION_NAME, entityId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error updating entity:', error);
            throw error;
        }
    },

    async deleteEntity(entityId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, entityId));
        } catch (error) {
            console.error('Error deleting entity:', error);
            throw error;
        }
    }
};
