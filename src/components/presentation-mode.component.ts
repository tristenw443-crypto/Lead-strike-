import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeoLeadFinderComponent } from './geo-lead-finder.component';
import { DomainScannerComponent } from './domain-scanner.component';
import { ColdCallGeneratorComponent } from './cold-call-generator.component';
import { AuditScorecardComponent } from './audit-scorecard.component';
import { Lead } from '../services/gemini.service';

@Component({
  selector: 'app-presentation-mode',
  standalone: true,
  imports: [CommonModule, GeoLeadFinderComponent, DomainScannerComponent, ColdCallGeneratorComponent, AuditScorecardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-[#050505] z-[100] flex items-center overflow-x-auto snap-x snap-mandatory">
        <button 
          (click)="exit.emit()"
          class="fixed top-4 left-4 z-[101] text-xs font-mono bg-zinc-900/80 hover:bg-zinc-800 text-gray-400 p-2 rounded border border-zinc-700"
        >
          Exit Presentation
        </button>
        <!-- Step 1: Search -->
        <div class="min-w-[100vw] h-[100vh] bg-[#050505] text-gray-200 font-sans overflow-y-auto snap-center">
          <main class="max-w-7xl mx-auto px-4 mt-8 space-y-8">
            <h2 class="text-xl font-bold text-cyber-primary font-mono mb-6">01 // DISCOVER & SEARCH (Targets: {{leads.length}})</h2>
            <app-geo-lead-finder />
          </main>
        </div>
        <!-- Step 2: Scan -->
        <div class="min-w-[100vw] h-[100vh] bg-[#050505] text-gray-200 font-sans overflow-y-auto snap-center">
          <main class="max-w-7xl mx-auto px-4 mt-8 space-y-8">
            <h2 class="text-xl font-bold text-cyber-primary font-mono mb-6">02 // DOMAIN INTELLIGENCE</h2>
            <app-domain-scanner />
          </main>
        </div>
        <!-- Step 3: Audit -->
        <div class="min-w-[100vw] h-[100vh] bg-[#050505] text-gray-200 font-sans overflow-y-auto snap-center">
          <main class="max-w-7xl mx-auto px-4 mt-8 space-y-8">
            <h2 class="text-xl font-bold text-cyber-primary font-mono mb-6">03 // TRUST & NAP AUDIT</h2>
            <app-audit-scorecard clientName="DEMO CLIENT" [auditData]="{
              auditDate: '2026-07-13',
              roiMetric: '240%',
              fixValidation: ['Fixed NAP', 'Updated Maps'],
              newLeaks: 'None',
              tier3Advancement: 'Complete'
            }" />
          </main>
        </div>
        <!-- Step 4: Pitch -->
        <div class="min-w-[100vw] h-[100vh] bg-[#050505] text-gray-200 font-sans overflow-y-auto snap-center">
          <main class="max-w-7xl mx-auto px-4 mt-8 space-y-8">
            <h2 class="text-xl font-bold text-cyber-primary font-mono mb-6">04 // STRATEGIC PITCH</h2>
            <app-cold-call-generator />
          </main>
        </div>
    </div>
  `
})
export class PresentationModeComponent {
  @Input() leads: Lead[] = [];
  @Output() exit = new EventEmitter<void>();
}
