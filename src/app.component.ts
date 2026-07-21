import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header.component';
import { SearchBoxComponent } from './components/search-box.component';
import { SecureCheckerComponent } from './components/secure-checker.component';
import { LeadListComponent } from './components/lead-list.component';
import { PitchModalComponent } from './components/pitch-modal.component';
import { GeoLeadFinderComponent } from './components/geo-lead-finder.component';
import { DomainScannerComponent } from './components/domain-scanner.component';
import { ColdCallGeneratorComponent } from './components/cold-call-generator.component';
import { PresentationModeComponent } from './components/presentation-mode.component';
import { GeminiService, Lead } from './services/gemini.service';
import { PortfolioService } from './services/portfolio.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    HeaderComponent, 
    SearchBoxComponent, 
    SecureCheckerComponent,
    LeadListComponent,
    PitchModalComponent,
    GeoLeadFinderComponent,
    DomainScannerComponent,
    ColdCallGeneratorComponent,
    PresentationModeComponent
  ],
  template: `
    <div class="min-h-screen bg-[#050505] text-gray-200 pb-20 font-sans selection:bg-cyber-primary selection:text-cyber-black relative">
      <button 
        (click)="isPresentationMode.set(!isPresentationMode())"
        class="fixed top-4 right-4 z-50 text-xs font-mono bg-zinc-900/80 hover:bg-zinc-800 text-gray-400 p-2 rounded border border-zinc-700"
      >
        {{ isPresentationMode() ? 'Exit Presentation' : 'Presentation Mode' }}
      </button>

      @if (isPresentationMode()) {
        <app-presentation-mode [leads]="leads()" (exit)="isPresentationMode.set(false)" />
      }

      @if (!isPresentationMode()) {
        <app-header />
      }

      <main [class.mt-8]="!isPresentationMode()" class="max-w-7xl mx-auto px-4 space-y-8">
        
        @if (!isPresentationMode()) {
          <!-- Mode Switcher Tabs -->
          <div class="flex border-b border-zinc-800 gap-1 pb-px">
          <button 
            (click)="activeTab.set('search')"
            [class]="activeTab() === 'search' ? 'border-b-2 border-cyber-primary text-cyber-primary font-bold bg-cyber-primary/5' : 'text-gray-400 hover:text-white hover:bg-zinc-900/40'"
            class="px-5 py-3 text-xs font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 rounded-t"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Target Scout
          </button>
          
          <button 
            (click)="activeTab.set('geo')"
            [class]="activeTab() === 'geo' ? 'border-b-2 border-cyber-primary text-cyber-primary font-bold bg-cyber-primary/5' : 'text-gray-400 hover:text-white hover:bg-zinc-900/40'"
            class="px-5 py-3 text-xs font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 rounded-t"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            Geo Strike Radar
          </button>

          <button 
            (click)="activeTab.set('probe')"
            [class]="activeTab() === 'probe' ? 'border-b-2 border-cyber-primary text-cyber-primary font-bold bg-cyber-primary/5' : 'text-gray-400 hover:text-white hover:bg-zinc-900/40'"
            class="px-5 py-3 text-xs font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 rounded-t"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Advanced Domain Probe
          </button>
          
          <button 
            (click)="activeTab.set('cold')"
            [class]="activeTab() === 'cold' ? 'border-b-2 border-cyber-primary text-cyber-primary font-bold bg-cyber-primary/5' : 'text-gray-400 hover:text-white hover:bg-zinc-900/40'"
            class="px-5 py-3 text-xs font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 rounded-t"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Cold Call Script
          </button>
        </div>

        <!-- Interactive Panels depending on active tab -->
        @if (activeTab() === 'search') {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
              <!-- Search Section -->
              <app-search-box 
                (search)="onSearch($event)" 
                (findPartners)="onFindPartners($event)"
                (findInsurTech)="onFindInsurTech($event)"
                (brutalAudit)="onBrutalAudit($event)"
              />
            </div>
            <div class="lg:col-span-1">
              <!-- Real-Time Site Security Scanner -->
              <app-secure-checker />
            </div>
          </div>
        } @else if (activeTab() === 'geo') {
          <app-geo-lead-finder />
        } @else if (activeTab() === 'probe') {
          <app-domain-scanner />
        } @else if (activeTab() === 'cold') {
          <app-cold-call-generator />
        }
      }


        @if (!isPresentationMode()) {
          @if (isSearching()) {
            <div class="flex items-center justify-center py-20">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-primary"></div>
              <span class="ml-4 font-mono text-cyber-primary">ACQUIRING TARGETS...</span>
            </div>
          }

          <!-- Stats / Info -->
          @if (!isSearching() && leads().length > 0) {
            <div class="flex items-center justify-between text-xs font-mono text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2">
              <span>Targets Identified: {{ leads().length }}</span>
              <span>Sector: {{ currentNiche() }} / {{ currentCity() }}</span>
            </div>
          }
        }

        <!-- Results Section -->
        <app-lead-list 
          [leads]="leads()" 
          (generate)="onGeneratePitch($event)" 
          (analyze)="onAnalyzeCorp($event)"
          (auditInsurTech)="onAuditInsurTech($event)"
          (deepScout)="onDeepScout($event)"
          (scanVulnerabilities)="onScanVulnerabilities($event)"
          (equityTarget)="onTargetEquity($event)"
          (lookupContact)="onLookupContact($event)"
          (updateOutreachStatus)="onUpdateOutreachStatus($event)"
        />
      </main>

      <!-- Modal -->
      <app-pitch-modal 
        [isOpen]="isModalOpen()" 
        [isLoading]="isPitchLoading()"
        [content]="generatedPitch()"
        [title]="modalTitle()"
        (closeModal)="closeModal()"
      />
    </div>
  `
})
export class AppComponent implements OnInit {
  private geminiService = inject(GeminiService);
  private portfolioService = inject(PortfolioService);

  leads = signal<Lead[]>([]);
  isSearching = signal(false); // Managed by search box internal state mostly, but good for global awareness
  activeTab = signal<'search' | 'geo' | 'probe' | 'cold'>('search');
  
  // Search Context
  currentCity = signal('');
  currentNiche = signal('');

  // Modal State
  isModalOpen = signal(false);
  isPitchLoading = signal(false);
  generatedPitch = signal('');
  modalTitle = signal('GENERATED OUTREACH');
  isPresentationMode = signal(false);

  async ngOnInit() {
    try {
      const count = await this.portfolioService.getLeadsCount();
      console.log('Total businesses audited:', count);
      // Try to load cached leads immediately to improve perceived latency
      const cached = localStorage.getItem('leads_cache');
      if (cached) {
        this.leads.set(JSON.parse(cached));
      }
      
      const savedLeads = await this.portfolioService.getLeads();
      this.leads.set(savedLeads);
      
      // Update cache
      localStorage.setItem('leads_cache', JSON.stringify(savedLeads));
    } catch (err) {
      console.error('Error loading saved leads', err);
    }
  }

  async onSearch(params: {city: string, niche: string, proprietary: boolean}) {
    // Reset state
    this.leads.set([]);
    this.currentCity.set(params.city);
    this.currentNiche.set(params.niche);
    
    this.isSearching.set(true);
    
    try {
      const results = await this.geminiService.findLeads(params.city, params.niche, params.proprietary);
      
      // Apply deterministic scoring algorithm
      const scoredLeads = results.map(lead => ({
        ...lead,
        riskScore: this.calculateLeadScore(lead),
        outreachStatus: 'Not Contacted' as const
      }));
      
      // Auto-persist each of these identified leads to Firestore
      const persistedLeads: Lead[] = [];
      for (const lead of scoredLeads) {
        try {
          const id = await this.portfolioService.upsertLead(lead);
          persistedLeads.push({
            ...lead,
            id
          });
        } catch (dbErr) {
          console.error('Failed to persist lead to Firestore:', dbErr);
          // Fallback to memory lead if DB fails
          persistedLeads.push(lead);
        }
      }
      
      this.leads.set(persistedLeads);
      localStorage.setItem('leads_cache', JSON.stringify(persistedLeads));
    } catch (err) {
      console.error('Error finding leads', err);
    } finally {
      this.isSearching.set(false);
    }
  }

  private calculateLeadScore(lead: Lead): number {
    let score = 0;

    // 1. Firmographic Fit (Weight: 40%)
    // Based on industry and estimated impact
    const isTargetNiche = ['B2B Service', 'Logistics', 'Restoration', 'Field Services'].includes(lead.websiteCategory);
    if (isTargetNiche) score += 20;
    
    // Geography proxy
    if (lead.address && (lead.address.includes('San Antonio') || lead.address.includes('TX'))) score += 10;
    
    // Revenue potential proxy
    const lossString = (lead.estimatedLeadLoss || '').replace(/[^0-9]/g, '');
    const loss = parseInt(lossString, 10) || 0;
    score += Math.min(Math.floor(loss / 25000) * 10, 10); // Max 10 pts for size

    // 2. Intent Signals (Weight: 40%)
    // Based on identifiable operational friction
    const intentKeywords = ['scheduling', 'communication', 'slow', 'manual', 'dispatch', 'admin', 'bottleneck'];
    const issueMatchCount = lead.issues.filter(issue => 
      intentKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    ).length;
    score += Math.min(issueMatchCount * 15, 40);

    // 3. Operational Debt (Weight: 20%)
    // High tech debt level indicates they are overdue for modernization
    switch (lead.techDebtLevel) {
      case 'High': score += 20; break;
      case 'Medium': score += 10; break;
      default: score += 0;
    }

    // 4. Negative Scoring (Disqualification)
    if (lead.issues.some(issue => issue.includes('Already using enterprise CRM'))) score -= 50;

    return Math.min(Math.max(Math.round(score), 0), 100);
  }

  async onGeneratePitch(lead: Lead) {
    this.modalTitle.set('GENERATED OUTREACH');
    this.isModalOpen.set(true);
    this.isPitchLoading.set(true);
    this.generatedPitch.set('');

    try {
      const pitch = await this.geminiService.generatePitch(lead);
      this.generatedPitch.set(pitch);
      await this.portfolioService.saveLeadAndPitch(lead, pitch);
    } catch (err) {
      this.generatedPitch.set('Error generating pitch. System malfunction.');
    } finally {
      this.isPitchLoading.set(false);
    }
  }

  async onAnalyzeCorp(lead: Lead) {
    this.modalTitle.set('CORPORATE INTELLIGENCE REPORT');
    this.isModalOpen.set(true);
    this.isPitchLoading.set(true);
    this.generatedPitch.set('');

    try {
      const report = await this.geminiService.getCorporateReport(lead.businessName);
      this.generatedPitch.set(report);
    } catch (err) {
       this.generatedPitch.set('Error accessing corporate database. Intelligence gathering failed.');
    } finally {
      this.isPitchLoading.set(false);
    }
  }

  async onFindPartners(location: string) {
    this.modalTitle.set('STRATEGIC PARTNERSHIP REPORT');
    this.isModalOpen.set(true);
    this.isPitchLoading.set(true);
    this.generatedPitch.set('');

    try {
      const report = await this.geminiService.findStrategicPartners(location);
      this.generatedPitch.set(report);
    } catch (err) {
       this.generatedPitch.set('Error scanning partnership networks. Scout system offline.');
    } finally {
      this.isPitchLoading.set(false);
    }
  }

  async onFindInsurTech(location: string) {
    this.modalTitle.set('INSURTECH MODERNIZATION AUDIT');
    this.isModalOpen.set(true);
    this.isPitchLoading.set(true);
    this.generatedPitch.set('');

    try {
      const report = await this.geminiService.findInsurTechOpportunities(location);
      this.generatedPitch.set(report);
    } catch (err) {
       this.generatedPitch.set('Error scanning insurance protocols. Network interference detected.');
    } finally {
      this.isPitchLoading.set(false);
    }
  }

  async onAuditInsurTech(lead: Lead) {
    this.modalTitle.set('TARGETED INSURTECH AUDIT');
    this.isModalOpen.set(true);
    this.isPitchLoading.set(true);
    this.generatedPitch.set('');

    try {
      const report = await this.geminiService.auditLeadInsurTech(lead);
      this.generatedPitch.set(report);
    } catch (err) {
       this.generatedPitch.set('Error running targeted audit. Scout system offline.');
    } finally {
      this.isPitchLoading.set(false);
    }
  }

  async onDeepScout(lead: Lead) {
    this.modalTitle.set('DEEP SCOUT ANALYSIS');
    this.isModalOpen.set(true);
    this.isPitchLoading.set(true);
    this.generatedPitch.set('');

    try {
      const report = await this.geminiService.deepScoutLead(lead);
      this.generatedPitch.set(report);
    } catch (err) {
       this.generatedPitch.set('Deep Scout System Error. Could not connect to intelligence network.');
    } finally {
      this.isPitchLoading.set(false);
    }
  }

  async onScanVulnerabilities(lead: Lead) {
    this.modalTitle.set('VULNERABILITY SCAN REPORT');
    this.isModalOpen.set(true);
    this.isPitchLoading.set(true);
    this.generatedPitch.set('');

    try {
      const report = await this.geminiService.scanVulnerabilities(lead);
      this.generatedPitch.set(report);
    } catch (err) {
       this.generatedPitch.set('Vulnerability Scanner Error. Could not complete security audit.');
    } finally {
      this.isPitchLoading.set(false);
    }
  }

  async onTargetEquity(lead: Lead) {
    this.modalTitle.set('EQUITY OPPORTUNITY AUDIT');
    this.isModalOpen.set(true);
    this.isPitchLoading.set(true);
    this.generatedPitch.set('');

    try {
      const report = await this.geminiService.targetEquityOpportunity(lead);
      this.generatedPitch.set(report);
    } catch (err) {
       this.generatedPitch.set('Equity Targeter System Error. Could not complete equity audit.');
    } finally {
      this.isPitchLoading.set(false);
    }
  }

  async onBrutalAudit(businessName: string) {
    this.modalTitle.set('BRUTAL REALITY AUDIT');
    this.isModalOpen.set(true);
    this.isPitchLoading.set(true);
    this.generatedPitch.set('');

    try {
      const report = await this.geminiService.generateBrutalAudit(businessName);
      this.generatedPitch.set(report);
      
      // Auto-save to portfolio if it's a "lead strike" audit
      if (report.includes('Lead Strike')) {
        await this.portfolioService.savePortfolioItem({
            category: 'Value-Capture',
            title: `Audit: ${businessName}`,
            summary: report,
            createdBy: 'user', // Need user auth ID
            createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
       this.generatedPitch.set('Audit System Failure. Neural link severed.');
    } finally {
      this.isPitchLoading.set(false);
    }
  }

  async onLookupContact(lead: Lead) {
    try {
      const contactInfo = await this.geminiService.lookupContactInfo(lead);
      const currentLeads = this.leads();
      const index = currentLeads.findIndex(l => l.url === lead.url);
      if (index !== -1) {
        const updatedLeads = [...currentLeads];
        updatedLeads[index] = { ...updatedLeads[index], ...contactInfo };
        this.leads.set(updatedLeads);
      }
    } catch (err) {
      console.error('Error enriching contact info', err);
    }
  }

  async onUpdateOutreachStatus(event: { lead: Lead, status: 'Not Contacted' | 'Contacted' | 'Ignored' | 'Responded' | 'Won' | 'Lost' }) {
    try {
      // Update local state first for instant response
      const updatedLeads = this.leads().map(l => {
        if (l.url === event.lead.url) {
          return { ...l, outreachStatus: event.status };
        }
        return l;
      });
      this.leads.set(updatedLeads);
      localStorage.setItem('leads_cache', JSON.stringify(updatedLeads));

      // Update in Firestore
      if (event.lead.id) {
        await this.portfolioService.updateLeadStatus(event.lead.id, event.status);
      } else {
        // If it doesn't have an ID, upsert it
        const id = await this.portfolioService.upsertLead({ ...event.lead, outreachStatus: event.status });
        // Update local state with the ID
        const finalLeads = this.leads().map(l => {
          if (l.url === event.lead.url) {
            return { ...l, id, outreachStatus: event.status };
          }
          return l;
        });
        this.leads.set(finalLeads);
        localStorage.setItem('leads_cache', JSON.stringify(finalLeads));
      }
    } catch (err) {
      console.error('Error updating outreach status', err);
    }
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.generatedPitch.set('');
  }
}