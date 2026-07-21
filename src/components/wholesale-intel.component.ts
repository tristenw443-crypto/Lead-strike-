import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wholesale-intel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-zinc-950 text-zinc-100 p-6 font-sans border border-zinc-800 rounded-2xl max-w-2xl">
      <!-- HEADER SECTION -->
      <div class="flex justify-between items-start mb-6">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-white">{{ intelData.businessName }}</h1>
          <p class="text-zinc-400 text-xs font-mono">REVENUE_LEAK_SYSTEM // AUDIT_REPORT</p>
        </div>
        <div [class]="'px-3 py-1 font-bold text-xs rounded-full ' + (intelData.leakScore > 7 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20')">
          LEAK SCORE: {{ intelData.leakScore }}/10
        </div>
      </div>

      <!-- ANALYTICS GRID -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        
        <!-- FIRMOGRAPHIC FIT -->
        <div class="bg-zinc-900 p-4 border border-zinc-800 rounded-xl">
          <div class="flex items-center gap-2 mb-3 text-emerald-400">
            <span class="text-xs font-bold uppercase tracking-wider">Growth Signals</span>
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between items-center text-zinc-400">
              <span>Intent:</span>
              <span class="text-zinc-100 font-medium">{{ intelData.intentScore }}</span>
            </div>
            <div class="flex justify-between items-center text-zinc-400">
              <span>Market:</span>
              <span class="text-zinc-100 font-medium text-right">{{ intelData.firmographics.industry }}</span>
            </div>
          </div>
        </div>

        <!-- REVENUE LEAK SIGNALS -->
        <div class="bg-zinc-900 p-4 border border-zinc-800 rounded-xl">
          <div class="flex items-center gap-2 mb-3 text-red-400">
            <span class="text-xs font-bold uppercase tracking-wider">Detected Leakages</span>
          </div>
          <ul class="space-y-1 text-xs">
            @for (signal of intelData.leakSignals; track signal) {
              <li class="flex items-center gap-2 text-zinc-300">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {{ signal }}
              </li>
            }
          </ul>
        </div>
      </div>

      <!-- RECOMMENDATION ENGINE -->
      <div class="bg-zinc-900 p-4 border border-zinc-800 rounded-xl mb-6">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs font-bold text-zinc-300">THE REVENUE SAFETY NET</span>
        </div>
        <div class="p-3 text-xs text-zinc-200 border-l-2 border-red-500 bg-zinc-950/50 leading-relaxed italic mb-4">
          "{{ intelData.recommendation }}"
        </div>
        <a [href]="getHttpsDorkUrl()" target="_blank" class="inline-flex items-center gap-2 text-[10px] font-bold text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full hover:bg-sky-500/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          VERIFY HTTPS SECURITY (GOOGLE DORK)
        </a>
      </div>

      <!-- FUEL: HIGH INTENT PROSPECTS -->
      <div class="bg-zinc-900 p-4 border border-zinc-800 rounded-xl">
        <div class="flex items-center gap-2 mb-3 text-emerald-400">
           <span class="text-xs font-bold uppercase tracking-wider">High-Intent Fuel (SA Local)</span>
        </div>
        <div class="divide-y divide-zinc-800">
          @for (lead of intelData.fuelLeads; track lead.name) {
            <div class="py-2 flex justify-between items-center text-xs">
              <span class="font-medium text-zinc-100">{{ lead.name }} <span class="text-zinc-500 font-normal">({{ lead.location }})</span></span>
              <span class="text-zinc-400 italic">"Seeking {{ lead.need }}"</span>
            </div>
          }
        </div>
      </div>

      <!-- KINETIC AUDIT ENGINE -->
      <div class="bg-zinc-950 border border-red-900/30 p-4 rounded-xl mt-6">
        <div class="flex items-center gap-2 mb-3 text-red-500">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
           <span class="text-xs font-bold uppercase tracking-wider">Kinetic Audit: {{ intelData.kineticAuditModule.targetArea }}</span>
        </div>
        <div class="text-xs space-y-3">
          <p class="text-zinc-300"><strong class="text-white">Bottleneck:</strong> {{ intelData.kineticAuditModule.physicalBottleneck }}</p>
          <div class="p-3 bg-red-950/10 border border-red-900/30 rounded-lg text-zinc-200">
            <strong class="text-emerald-400">Solution:</strong> {{ intelData.kineticAuditModule.kineticSolution }}
          </div>
          <div class="flex justify-between items-center text-zinc-400">
            <span>Projected ROI:</span>
            <span class="text-emerald-400 font-medium">{{ intelData.kineticAuditModule.estimatedRoiMetric }}</span>
          </div>
          <p class="italic text-zinc-500 pt-2 border-t border-zinc-800">"{{ intelData.kineticAuditModule.upsellPitchCopy }}"</p>
        </div>
      </div>

      <!-- OSINT RECON MODULE -->
      <div class="bg-zinc-900 p-4 border border-zinc-800 rounded-xl mt-6">
        <div class="flex items-center gap-2 mb-4 text-orange-400">
           <span class="text-xs font-bold uppercase tracking-wider">OSINT Recon (Public Footprint)</span>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-3 bg-zinc-950 rounded border border-zinc-800">
            <div class="text-zinc-500">SSL Status</div>
            <div class="text-zinc-100 font-medium">{{ intelData.osintRecon.sslStatus }}</div>
          </div>
          <div class="p-3 bg-zinc-950 rounded border border-zinc-800">
            <div class="text-zinc-500">Hosting</div>
            <div class="text-zinc-100 font-medium">{{ intelData.osintRecon.hostingProvider }}</div>
          </div>
          <div class="col-span-2 p-3 bg-zinc-950 rounded border border-zinc-800">
            <div class="text-zinc-500 mb-1">Detected Tech</div>
            <div class="flex flex-wrap gap-2">
              @for (tech of intelData.osintRecon.detectedTech; track tech) {
                <span class="bg-orange-500/10 text-orange-400 px-2 py-1 rounded text-[10px]">{{ tech }}</span>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WholesaleIntelComponent {
  @Input() intelData = {
    businessName: "Alamo Chill Pros",
    websiteURL: "alamochillpros.com",
    leakScore: 9,
    intentScore: 85,
    firmographics: {
      industry: "HVAC - Residential",
    },
    leakSignals: [
      "No automated SMS lead follow-up",
      "Manual scheduling only",
      "Missed-call risk detected"
    ],
    recommendation: "Company is losing high-ticket residential installs due to response latency. Implementing a 15-second SMS Safety Net would recapture an estimated 20% of lost bookings immediately.",
    fuelLeads: [
      { name: "John D.", location: "Alamo Heights", need: "AC repair, high noise" },
      { name: "Sarah M.", location: "Stone Oak", need: "System upgrade, warranty check" },
      { name: "Robert T.", location: "Monte Vista", need: "Emergency leak, non-responsive" }
    ],
    ecosystemAggregator: [
      { name: "Local Air Quality Filter Subscription", provider: "SA Air Solutions API", roi: "Adds $150/mo ARR per client" },
      { name: "HVAC Emergency Response Dispatch Wrapper", provider: "RapidResponse AI", roi: "Reduces churn by 12%" }
    ],
    osintRecon: {
      dnsVerified: true,
      sslStatus: "Active - Valid",
      hostingProvider: "Cloudflare, Inc.",
      detectedTech: ["WordPress", "RankMath SEO", "Google Analytics"],
      securityHeaders: ["X-Frame-Options (Missing)"]
    },
    kineticAuditModule: {
      targetArea: "Loading Dock & Parking Lot",
      physicalBottleneck: "Faded 90-degree parking blocks delivery vans, causing a 5-minute staging lag per truck.",
      kineticSolution: "Re-engineer lot geometry to a 60-degree one-way loop with high-contrast optical markers and reflective albedo coating.",
      estimatedRoiMetric: "18% faster dock-to-stock times and 6% reduction in cooling costs.",
      upsellPitchCopy: "We noticed your fulfillment software is lagging because your physical loading dock staging lines are completely faded, forcing drivers to double-park. We mapped a new spatial configuration that aligns your pavement layout with your new automated booking system."
    }
  };

  getHttpsDorkUrl(): string {
    return `https://www.google.com/search?q=site:${this.intelData.websiteURL}+-inurl:https`;
  }
}
