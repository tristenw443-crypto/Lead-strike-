import { Component, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pitch-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" (click)="close()"></div>
        
        <!-- Modal Content -->
        <div class="bg-cyber-dark border border-cyber-primary/30 w-full max-w-2xl rounded-lg shadow-2xl relative flex flex-col max-h-[90vh] h-[600px]">
          
          <!-- Header -->
          <div class="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 shrink-0">
            <h3 class="text-white font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyber-primary"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
              {{ title() }}
            </h3>
            <button (click)="close()" class="text-gray-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 overflow-hidden flex-1 flex flex-col relative">
            @if (isLoading()) {
              <div class="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-cyber-dark/50 z-10">
                <div class="relative w-16 h-16">
                  <div class="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                  <div class="absolute inset-0 border-4 border-cyber-primary rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p class="text-cyber-primary animate-pulse font-mono text-sm">ANALYZING DATA...</p>
              </div>
            } 
            
            <div class="flex-1 flex flex-col">
                <label class="text-xs font-mono text-gray-500 mb-2 uppercase tracking-wider">Editor Mode Active</label>
                <textarea 
                    [(ngModel)]="editableContent"
                    class="w-full h-full bg-black/40 border border-gray-800 rounded p-4 text-gray-300 font-mono text-sm leading-relaxed focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary focus:outline-none resize-none transition-all placeholder-gray-700 custom-scrollbar"
                    placeholder="Generating content..."
                    spellcheck="false"
                ></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-5 border-t border-gray-800 flex justify-end gap-3 bg-gray-900/50 shrink-0">
            <button (click)="close()" class="px-4 py-2 rounded text-gray-400 hover:text-white transition-colors text-sm font-medium">
              DISCARD
            </button>
            <button 
              (click)="copyToClipboard()"
              [disabled]="isLoading() || !editableContent()"
              class="bg-cyber-primary text-cyber-black px-4 py-2 rounded text-sm font-bold hover:bg-emerald-400 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (copied()) {
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                COPIED
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                COPY TO CLIPBOARD
              }
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class PitchModalComponent {
  isOpen = input<boolean>(false);
  isLoading = input<boolean>(false);
  content = input<string>('');
  title = input<string>('GENERATED OUTREACH');
  closeModal = output<void>();

  editableContent = signal('');
  copied = signal(false);

  constructor() {
    effect(() => {
        // Update local state when parent content changes
        this.editableContent.set(this.content());
    });
  }

  close() {
    this.closeModal.emit();
    this.copied.set(false);
  }

  copyToClipboard() {
    if (this.editableContent()) {
      navigator.clipboard.writeText(this.editableContent());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}