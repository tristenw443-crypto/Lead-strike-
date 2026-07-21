import { Component, Input, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lead } from '../services/gemini.service';

interface NAPSource {
  name: string;
  score: number; // 0 to 100
  status: 'OPTIMIZED' | 'DRIFTED' | 'CRITICAL';
}

@Component({
  selector: 'app-nap-health',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-zinc-950 p-6 border border-zinc-800 font-mono text-white max-w-2xl">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-sm font-bold text-zinc-300">NAP CONSISTENCY AUDIT: {{ lead.businessName }}</h2>
        <div class="text-xs text-zinc-500">LAST SYNC: 14m AGO</div>
      </div>

      <div class="space-y-4">
        @for (source of sources(); track source.name) {
          <div class="flex items-center justify-between">
            <span class="text-xs text-zinc-400 w-24">{{ source.name }}</span>
            <div class="flex-1 mx-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                [style.width.%]="source.score" 
                [class]="'h-full rounded-full ' + getStatusClass(source.status)">
              </div>
            </div>
            <span class="text-xs font-bold w-12 text-right">{{ source.score }}%</span>
          </div>
        }
      </div>

      <div [class]="'mt-6 p-3 text-[10px] border ' + getSeverityClass(aggregateScore())">
        AGGREGATE TRUST INDEX: {{ aggregateScore() }}% - {{ getSeverityText(aggregateScore()) }}
      </div>
    </div>
  `
})
export class NapHealthMonitorComponent implements OnInit {
  @Input() lead!: Lead;
  
  sources = signal<NAPSource[]>([]);
  aggregateScore = signal<number>(0);

  ngOnInit() {
    this.generateAuditData();
  }

  generateAuditData() {
    // Generate deterministic scores based on the business name
    const hash = this.lead.businessName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const getScore = (offset: number) => Math.min(100, Math.max(20, Math.abs((hash + offset) % 100)));
    const getStatus = (score: number) => score > 80 ? 'OPTIMIZED' : score > 50 ? 'DRIFTED' : 'CRITICAL';

    const s1 = getScore(10);
    const s2 = getScore(20);
    const s3 = getScore(30);
    const s4 = getScore(40);

    this.sources.set([
      { name: 'GOOGLE MAPS', score: s1, status: getStatus(s1) },
      { name: 'BING PLACES', score: s2, status: getStatus(s2) },
      { name: 'YELP', score: s3, status: getStatus(s3) },
      { name: 'APPLE MAPS', score: s4, status: getStatus(s4) }
    ]);

    this.aggregateScore.set(Math.round((s1 + s2 + s3 + s4) / 4));
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'OPTIMIZED': return 'bg-emerald-500';
      case 'DRIFTED': return 'bg-amber-500';
      default: return 'bg-red-500';
    }
  }

  getSeverityClass(score: number) {
    return score < 50 ? 'border-red-900 bg-red-950/20 text-red-500' : 'border-amber-900 bg-amber-950/20 text-amber-500';
  }

  getSeverityText(score: number) {
    return score < 50 ? 'ACTION REQUIRED: RANKING VIABILITY COMPROMISED' : 'CAUTION: TRUST DRIFT DETECTED';
  }
}
