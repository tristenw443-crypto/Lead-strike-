import { Injectable } from '@angular/core';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, where, updateDoc, doc } from 'firebase/firestore';
import { Lead } from './gemini.service';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  constructor() {}

  async savePortfolioItem(item: any) {
    try {
      const docRef = await addDoc(collection(db, 'portfolio'), {
        ...item,
        createdAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (e) {
      console.error('Error adding document: ', e);
      throw e;
    }
  }

  async getLeadsCount(): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, 'leads'));
      return snapshot.size;
    } catch (e) {
      console.error('Error fetching leads count:', e);
      throw e;
    }
  }

  async getLeads() {
    console.log('Fetching leads from Firestore...');
    const q = query(collection(db, 'leads'), orderBy('savedAt', 'desc'), limit(25));
    try {
        const snapshot = await getDocs(q);
        console.log('Leads fetched, count:', snapshot.size);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as Lead));
    } catch (e) {
        console.error('Error fetching leads:', e);
        throw e;
    }
  }

  async getPitches() {
    const q = query(collection(db, 'pitches'), orderBy('savedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async upsertLead(lead: Lead): Promise<string> {
    try {
      const q = query(collection(db, 'leads'), where('url', '==', lead.url));
      const snapshot = await getDocs(q);
      
      const leadData = {
        ...lead,
        updatedAt: new Date().toISOString()
      };
      
      // Clean undefined values so Firestore doesn't complain
      Object.keys(leadData).forEach(key => {
        if ((leadData as any)[key] === undefined) {
          delete (leadData as any)[key];
        }
      });
      // Do not store local id in Firestore body
      if (leadData.id) {
        delete leadData.id;
      }

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, leadData);
        return docRef.id;
      } else {
        const docRef = await addDoc(collection(db, 'leads'), {
          ...leadData,
          outreachStatus: lead.outreachStatus || 'Not Contacted',
          savedAt: new Date().toISOString()
        });
        return docRef.id;
      }
    } catch (e) {
      console.error('Error upserting lead: ', e);
      throw e;
    }
  }

  async updateLeadStatus(leadId: string, status: 'Not Contacted' | 'Contacted' | 'Ignored' | 'Responded' | 'Won' | 'Lost'): Promise<void> {
    try {
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, {
        outreachStatus: status,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error updating lead status in Firestore: ', e);
      throw e;
    }
  }

  async saveLeadAndPitch(lead: Lead, pitch: string) {
    try {
      const leadId = await this.upsertLead(lead);
      await addDoc(collection(db, 'pitches'), {
        leadId,
        businessName: lead.businessName,
        pitch,
        savedAt: new Date().toISOString(),
      });
      return leadId;
    } catch (e) {
      console.error('Error saving lead and pitch: ', e);
      throw e;
    }
  }
}
