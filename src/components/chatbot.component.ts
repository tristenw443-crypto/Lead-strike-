import { Component, input, inject, signal, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, Lead } from '../services/gemini.service';
import { Content } from '@google/genai';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface AuditRecord {
  id: string;
  businessName: string;
  timestamp: any;
  summary: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Toggle Button -->
    <button 
      (click)="toggleChat()"
      [class.hidden]="isOpen()"
      class="fixed bottom-6 right-6 z-40 w-14 h-14 bg-cyber-primary text-cyber-black rounded-full shadow-[0_0_20px_rgba(0,255,157,0.4)] flex items-center justify-center hover:scale-110 transition-transform duration-200 border-2 border-white/20"
      title="Open AI Assistant"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </button>

    <!-- Chat Window -->
    @if (isOpen()) {
      <div class="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[400px] h-[600px] flex flex-col bg-cyber-dark border border-cyber-primary/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md animate-in slide-in-from-bottom-10 fade-in duration-300">
        
        <!-- Header -->
        <div class="h-14 bg-cyber-black/80 border-b border-cyber-gray flex items-center justify-between px-4 shrink-0">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></span>
            <h3 class="font-mono font-bold text-white tracking-wide">LEADSTRIKE AI</h3>
          </div>
          <button (click)="toggleChat()" class="text-gray-400 hover:text-white transition-colors p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="flex flex-col flex-1 overflow-hidden">
          <!-- Messages Area -->
          <div class="flex-[2] overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/40" #scrollContainer>
            <!-- ... same messages display ... -->
            @if (messages().length === 0) {
              <div class="text-center py-8 text-gray-500 text-sm font-mono">
                <p>SYSTEM ONLINE.</p>
                <p class="mt-2 text-xs">Ask me about your leads or security risks.</p>
              </div>
            }
            
            @for (msg of messages(); track $index) {
              <div [class.justify-end]="msg.role === 'user'" class="flex gap-2">
                 @if (msg.role === 'model') {
                   <div class="w-6 h-6 rounded bg-cyber-primary/20 flex items-center justify-center shrink-0 border border-cyber-primary/50 text-cyber-primary text-[10px] font-bold">AI</div>
                 }
                 
                 <div 
                   class="max-w-[80%] rounded-lg p-3 text-sm leading-relaxed"
                   [class.bg-cyber-primary]="msg.role === 'user'"
                   [class.text-cyber-black]="msg.role === 'user'"
                   [class.bg-gray-800]="msg.role === 'model'"
                   [class.text-gray-200]="msg.role === 'model'"
                   [class.border]="msg.role === 'model'"
                   [class.border-gray-700]="msg.role === 'model'"
                 >
                   {{ msg.text }}
                 </div>
              </div>
            }
  
            @if (isThinking()) {
              <div class="flex gap-2 items-center text-gray-500 text-xs font-mono animate-pulse">
                 <div class="w-6 h-6 rounded bg-cyber-primary/20 flex items-center justify-center shrink-0 border border-cyber-primary/50 text-cyber-primary text-[10px] font-bold">AI</div>
                 <span>PROCESSING DATA...</span>
              </div>
            }
          </div>

          <!-- Audit History Area -->
          <div class="flex-1 border-t border-cyber-gray bg-cyber-black/50 overflow-y-auto p-4">
            <h4 class="font-mono text-xs text-cyber-primary uppercase mb-3">Audit History</h4>
            @if (auditHistory().length === 0) {
              <p class="text-[10px] text-gray-600 font-mono italic">No recent audits</p>
            } @else {
              <div class="space-y-2">
                @for (audit of auditHistory(); track audit.id) {
                  <div class="p-2 bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-400">
                    <p class="text-white">{{ audit.businessName }}</p>
                    <p>{{ audit.summary | slice:0:50 }}...</p>
                    <p class="text-gray-600">{{ audit.timestamp?.toDate() | date:'short' }}</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Input Area -->
        <div class="p-3 bg-cyber-black/80 border-t border-cyber-gray shrink-0">
          <!-- ... same input area ... -->
          <div class="relative flex items-center">
            <input 
              type="text" 
              [(ngModel)]="currentInput" 
              (keyup.enter)="sendMessage()"
              placeholder="Query the database..."
              class="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-full pl-4 pr-10 py-3 focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all placeholder-gray-600"
              [disabled]="isThinking()"
            >
            <button 
              (click)="sendMessage()"
              [disabled]="!currentInput() || isThinking()"
              class="absolute right-2 p-1.5 bg-cyber-primary text-cyber-black rounded-full hover:bg-emerald-400 disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ChatbotComponent {
  leads = input<Lead[]>([]);
  
  private geminiService = inject(GeminiService);
  
  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  currentInput = signal('');
  isThinking = signal(false);
  auditHistory = signal<AuditRecord[]>([]);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor() {
    effect(() => {
      // Auto scroll when messages change
      if (this.messages().length > 0 && this.isOpen()) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });

    // Load audit history
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, 'vulnerability_audits'), 
          where('createdBy', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        onSnapshot(q, (snapshot) => {
          this.auditHistory.set(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditRecord)));
        });
      } else {
        this.auditHistory.set([]);
      }
    });
  }

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  scrollToBottom() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }

  async sendMessage() {
    // ... same send message logic ...
    const text = this.currentInput().trim();
    if (!text || this.isThinking()) return;

    // Add user message
    this.messages.update(msgs => [...msgs, { role: 'user', text }]);
    this.currentInput.set('');
    this.isThinking.set(true);

    try {
      const history: Content[] = this.messages()
        .slice(0, -1)
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const responseText = await this.geminiService.chatWithLeads(history, text, this.leads());
      
      this.messages.update(msgs => [...msgs, { role: 'model', text: responseText }]);
    } catch (err) {
      console.error(err);
      this.messages.update(msgs => [...msgs, { role: 'model', text: 'Error connecting to neural net.' }]);
    } finally {
      this.isThinking.set(false);
    }
  }
}
