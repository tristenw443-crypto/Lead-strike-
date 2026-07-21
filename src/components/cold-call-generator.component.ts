import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { GeminiService, Lead } from '../services/gemini.service';

@Component({
  selector: 'app-cold-call-generator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-cyber-dark border border-cyber-gray p-6 rounded-lg shadow-lg">
      <h2 class="text-lg font-semibold mb-4 text-white">📞 Cold Call Script Architect</h2>
      <p class="text-xs text-gray-400 mb-6">Generate a battle-tested cold call script based on lead data.</p>
      
      <div class="space-y-4">
        <textarea 
          [formControl]="leadData" 
          rows="6"
          placeholder="Paste raw lead data here..."
          class="w-full bg-cyber-black border border-cyber-gray text-white p-4 rounded text-sm font-mono"
        ></textarea>
        
        <button 
          (click)="generate()"
          [disabled]="loading() || !leadData.value"
          class="w-full bg-cyber-primary hover:bg-emerald-400 text-cyber-black font-bold py-3 rounded text-sm transition-all active:scale-95"
        >
          {{ loading() ? 'Architecting...' : 'Generate Script' }}
        </button>
      </div>

      @if (script()) {
        <div class="mt-6 bg-cyber-black border border-zinc-800 p-4 rounded text-sm text-gray-300 font-mono whitespace-pre-wrap">
          {{ script() }}
        </div>
      }
    </div>
  `
})
export class ColdCallGeneratorComponent {
  private geminiService = inject(GeminiService);
  leadData = new FormControl('');
  script = signal('');
  loading = signal(false);

  async generate() {
    this.loading.set(true);
    try {
      const data = this.leadData.value || '';
      // Assuming gemini service has a method for cold call scripts
      const result = await this.geminiService.generateColdCallScript(data);
      this.script.set(result);
    } catch (e) {
      this.script.set('Error generating script.');
    } finally {
      this.loading.set(false);
    }
  }
}
