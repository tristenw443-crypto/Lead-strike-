import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AuditData {
  auditDate: string;
  roiMetric: string;
  fixValidation: string[];
  newLeaks: string;
  tier3Advancement: string;
}

@Component({
  selector: 'app-audit-scorecard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full max-w-4xl mx-auto my-6">
      <!-- Header -->
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-lg font-bold text-white tracking-tight">Bi-Weekly Value Leaks Scorecard</h2>
          <p class="text-sm text-zinc-400">Client: {{ clientName }} | {{ auditData.auditDate }}</p>
        </div>
        <div class="text-right">
          <div class="text-sm font-medium text-emerald-400">{{ auditData.roiMetric }}</div>
          <div class="text-[10px] uppercase tracking-wider text-zinc-600">Cumulative ROI</div>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Validation -->
        <div class="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
           <h3 class="text-xs font-bold uppercase text-sky-400 mb-3">Fix Validation</h3>
           <ul class="text-sm text-zinc-300 space-y-2">
             @for (fix of auditData.fixValidation; track fix) {
               <li class="flex items-center gap-2">
                 <span class="text-emerald-500">✓</span> {{ fix }}
               </li>
             }
           </ul>
        </div>

        <!-- Delta Analysis -->
        <div class="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
           <h3 class="text-xs font-bold uppercase text-orange-400 mb-3">Delta: New Leaks</h3>
           <p class="text-sm text-zinc-300">{{ auditData.newLeaks }}</p>
        </div>

        <!-- Next Advancement -->
        <div class="bg-zinc-950 p-4 rounded-xl border border-red-500/20">
           <h3 class="text-xs font-bold uppercase text-red-500 mb-3">Tier 3 Advancement</h3>
           <p class="text-sm text-zinc-300">{{ auditData.tier3Advancement }}</p>
        </div>
      </div>
    </div>
  `
})
export class AuditScorecardComponent {
  @Input({ required: true }) clientName!: string;
  @Input({ required: true }) auditData!: AuditData;
}
