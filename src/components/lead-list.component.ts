import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Lead } from '../services/gemini.service';
import { NapHealthMonitorComponent } from './nap-health.component';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NapHealthMonitorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Controls Toolbar -->
    @if (leads().length > 0) {
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-cyber-dark/50 p-4 rounded border border-cyber-gray/50 backdrop-blur-sm">
        
        <!-- Filter -->
        <div class="flex items-center gap-3 w-full sm:w-auto">
            <label class="text-xs font-mono text-gray-500 uppercase tracking-wider whitespace-nowrap">Status Protocol:</label>
            <div class="relative w-full sm:w-48">
              <select [(ngModel)]="filterStatus" class="w-full appearance-none bg-black border border-cyber-gray text-white text-xs font-mono rounded px-3 py-2 focus:border-cyber-primary outline-none cursor-pointer hover:border-gray-500 transition-colors">
                  <option value="All">ALL TARGETS</option>
                  <option value="Unsecured">UNSECURED</option>
                  <option value="Outdated">OUTDATED</option>
                  <option value="Vulnerable">VULNERABLE</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
        </div>
        
        <!-- Sort -->
        <div class="flex items-center gap-3 w-full sm:w-auto">
            <label class="text-xs font-mono text-gray-500 uppercase tracking-wider whitespace-nowrap">Risk Level:</label>
            <div class="flex bg-black border border-cyber-gray rounded overflow-hidden w-full sm:w-auto">
                <button (click)="sortDirection.set('desc')" 
                    class="flex-1 sm:flex-none px-4 py-2 text-xs font-mono transition-all duration-200"
                    [class.bg-cyber-primary]="sortDirection() === 'desc'"
                    [class.text-black]="sortDirection() === 'desc'"
                    [class.font-bold]="sortDirection() === 'desc'"
                    [class.text-gray-400]="sortDirection() !== 'desc'"
                    [class.hover:bg-cyber-gray]="sortDirection() !== 'desc'">
                    HIGHEST
                </button>
                <div class="w-px bg-cyber-gray"></div>
                <button (click)="sortDirection.set('asc')" 
                    class="flex-1 sm:flex-none px-4 py-2 text-xs font-mono transition-all duration-200"
                    [class.bg-cyber-primary]="sortDirection() === 'asc'"
                    [class.text-black]="sortDirection() === 'asc'"
                    [class.font-bold]="sortDirection() === 'asc'"
                    [class.text-gray-400]="sortDirection() !== 'asc'"
                    [class.hover:bg-cyber-gray]="sortDirection() !== 'asc'">
                    LOWEST
                </button>
            </div>
        </div>
        <button (click)="exportToCsv()" class="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded text-xs font-mono border border-gray-700 flex items-center gap-2 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          EXPORT CSV
        </button>
        <button (click)="exportAllLeadsToPdf()" class="bg-red-900/40 hover:bg-red-800/60 text-red-100 px-4 py-2 rounded text-xs font-mono border border-red-700/50 flex items-center gap-2 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          PDF COMPREHENSIVE AUDIT
        </button>
      </div>
    }

    <div class="grid grid-cols-1 gap-4">
      @if (leads().length === 0) {
        <div class="text-center py-20 border-2 border-dashed border-cyber-gray rounded-lg">
          <div class="text-gray-600 mb-2">
            <svg class="w-12 h-12 mx-auto mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <p class="text-gray-400 font-mono text-sm">NO TARGETS ACQUIRED</p>
          <p class="text-gray-600 text-xs mt-1">Initiate a scan to find vulnerable businesses.</p>
        </div>
      } @else if (displayedLeads().length === 0) {
        <div class="text-center py-12 border border-cyber-gray bg-cyber-dark/30 rounded-lg">
          <p class="text-gray-400 font-mono text-sm">NO MATCHES FOUND</p>
          <p class="text-gray-600 text-xs mt-1">Adjust your status filter parameters.</p>
        </div>
      }

      @for (lead of displayedLeads(); track lead.url) {
        <div class="bg-cyber-dark border border-cyber-gray rounded-lg p-5 hover:border-cyber-primary/50 transition-all group relative">
          
          <!-- Risk Indicator Bar (Left Border) -->
          <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" 
               [class.bg-red-500]="lead.riskScore > 75"
               [class.bg-yellow-500]="lead.riskScore > 40 && lead.riskScore <= 75"
               [class.bg-blue-500]="lead.riskScore <= 40">
          </div>

          <!-- Main Content -->
          <div class="pl-3 flex flex-col md:flex-row md:items-start justify-between gap-4">
             <div class="flex-1 min-w-0">
                <div class="flex items-center flex-wrap gap-3 mb-2">
                  <h3 class="font-bold text-white text-lg tracking-tight truncate">{{ lead.businessName }}</h3>
                  
                  <!-- Category Badge -->
                  <span class="text-[10px] font-mono bg-cyber-primary/10 text-cyber-primary px-2 py-0.5 rounded border border-cyber-primary/20 uppercase tracking-wider">
                    {{ lead.websiteCategory }}
                  </span>

                  <!-- Estimated Lead Loss Badge -->
                  <div class="relative group/tooltip cursor-help">
                      <div class="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-[10px] font-mono font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        LOSS: {{ lead.estimatedLeadLoss }}
                      </div>
                      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-neutral-900 border border-cyber-gray text-zinc-100 text-[11px] rounded shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 font-sans normal-case">
                        <strong class="text-red-400 block mb-1">Estimated Lead Loss:</strong>
                        Projected annual revenue leakage. This calculates missed conversions derived from the gap between current site performance and optimal B2B industry benchmarks.
                      </div>
                  </div>

                  <!-- Tech Debt Badge -->
                   <div class="relative group/tooltip cursor-help">
                     <div class="flex items-center gap-1.5 px-2 py-0.5 bg-gray-800 border border-gray-600 rounded text-[10px] font-mono font-bold"
                          [class.text-red-400]="lead.techDebtLevel === 'High'"
                          [class.text-yellow-400]="lead.techDebtLevel === 'Medium'"
                          [class.text-green-400]="lead.techDebtLevel === 'Low'">
                       DEBT: {{ lead.techDebtLevel }}
                     </div>
                     <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-neutral-900 border border-cyber-gray text-zinc-100 text-[11px] rounded shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 font-sans normal-case">
                       <strong class="block mb-1" [class.text-red-400]="lead.techDebtLevel === 'High'"
                          [class.text-yellow-400]="lead.techDebtLevel === 'Medium'"
                          [class.text-green-400]="lead.techDebtLevel === 'Low'">Technical Debt Level: {{ lead.techDebtLevel }}</strong>
                       Measures legacy infrastructure rot. High debt indicates outdated frameworks, unoptimized assets, and increased operational friction for future feature velocity.
                     </div>
                   </div>

                  <!-- Security Status Badge -->
                  <div class="relative group/tooltip cursor-help">
                    <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border block"
                      [class.border-red-500]="lead.securityStatus === 'Unsecured'"
                      [class.text-red-500]="lead.securityStatus === 'Unsecured'"
                      [class.bg-red-500/10]="lead.securityStatus === 'Unsecured'"
                      [class.border-yellow-500]="lead.securityStatus === 'Outdated'"
                      [class.text-yellow-500]="lead.securityStatus === 'Outdated'"
                      [class.bg-yellow-500/10]="lead.securityStatus === 'Outdated'"
                      [class.border-orange-500]="lead.securityStatus === 'Vulnerable'"
                      [class.text-orange-500]="lead.securityStatus === 'Vulnerable'"
                      [class.bg-orange-500/10]="lead.securityStatus === 'Vulnerable'">
                      {{ lead.securityStatus }}
                    </span>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-neutral-900 border border-cyber-gray text-zinc-100 text-[11px] rounded shadow-2xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 font-sans normal-case">
                      <strong class="block mb-1"
                      [class.text-red-500]="lead.securityStatus === 'Unsecured'"
                      [class.text-yellow-500]="lead.securityStatus === 'Outdated'"
                      [class.text-orange-500]="lead.securityStatus === 'Vulnerable'">Security Status: {{ lead.securityStatus }}</strong>
                      Audit findings: 'Unsecured' (No HTTPS/SSL encryption), 'Vulnerable' (Known exploitable components), or 'Outdated' (Legacy server-side software).
                    </div>
                  </div>

                  <!-- Outreach Status Selector -->
                  <div class="relative">
                    <select [value]="lead.outreachStatus || 'Not Contacted'" 
                            (change)="onOutreachStatusChange(lead, $event)" 
                            class="appearance-none text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 pr-6 rounded border bg-black cursor-pointer focus:outline-none transition-colors"
                            [class.border-gray-600]="(lead.outreachStatus || 'Not Contacted') === 'Not Contacted'"
                            [class.text-gray-400]="(lead.outreachStatus || 'Not Contacted') === 'Not Contacted'"
                            [class.border-blue-500]="lead.outreachStatus === 'Contacted'"
                            [class.text-blue-400]="lead.outreachStatus === 'Contacted'"
                            [class.border-yellow-500]="lead.outreachStatus === 'Ignored'"
                            [class.text-yellow-400]="lead.outreachStatus === 'Ignored'"
                            [class.border-amber-500]="lead.outreachStatus === 'Responded'"
                            [class.text-amber-400]="lead.outreachStatus === 'Responded'"
                            [class.border-emerald-500]="lead.outreachStatus === 'Won'"
                            [class.text-emerald-400]="lead.outreachStatus === 'Won'"
                            [class.border-red-500]="lead.outreachStatus === 'Lost'"
                            [class.text-red-400]="lead.outreachStatus === 'Lost'">
                      <option value="Not Contacted">NOT CONTACTED</option>
                      <option value="Contacted">CONTACTED</option>
                      <option value="Ignored">IGNORED</option>
                      <option value="Responded">RESPONDED</option>
                      <option value="Won">WON (CLOSED)</option>
                      <option value="Lost">LOST</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-500">
                      <svg class="h-2 w-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>

                  <!-- Visual Risk Score -->
                  <div class="relative group/tooltip cursor-help hidden md:block">
                    <div class="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-gray-800">
                      <span class="text-[10px] font-mono text-gray-400">RISK</span>
                      <div class="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-1000 ease-out"
                            [style.width.%]="lead.riskScore"
                            [class.bg-red-500]="lead.riskScore > 75"
                            [class.bg-yellow-500]="lead.riskScore > 40 && lead.riskScore <= 75"
                            [class.bg-blue-500]="lead.riskScore <= 40">
                        </div>
                      </div>
                      <span class="text-[10px] font-mono font-bold"
                        [class.text-red-500]="lead.riskScore > 75"
                        [class.text-yellow-500]="lead.riskScore <= 75">
                        {{ lead.riskScore }}%
                      </span>
                    </div>
                     <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-black border border-cyber-gray text-gray-300 text-[10px] rounded shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 font-sans normal-case text-center">
                       Risk Score calculation: 30% Security status, 25% Estimated revenue loss, 15% Tech debt status, 10% Issue density, 10% Social footprint, 10% Vulnerability scanner findings.
                     </div>
                  </div>
                </div>
                
                <a [href]="lead.url" target="_blank" class="text-xs text-gray-400 hover:text-cyber-primary font-mono mb-2 block truncate max-w-md">
                  {{ lead.url }}
                </a>
                
                <!-- Tech Stack & AI Proposal -->
                <div class="mb-3 space-y-2">
                    <div class="flex flex-wrap gap-2 items-center">
                        <span class="text-[10px] text-gray-500 font-mono uppercase">LEGACY STACK:</span>
                        @for (tech of lead.techStack; track tech) {
                            <span class="text-[10px] font-mono bg-gray-900 text-gray-300 px-1.5 py-0.5 rounded border border-gray-800">{{ tech }}</span>
                        }
                    </div>
                    <div class="flex items-start gap-2">
                        <span class="text-[10px] text-cyber-primary font-mono uppercase mt-0.5 whitespace-nowrap">AI UPGRADE:</span>
                        <p class="text-xs text-gray-300 leading-tight">{{ lead.aiUpgradeProposal }}</p>
                    </div>
                </div>

                <!-- Vulnerability Scanner Results -->
                @if (lead.vulnerabilities) {
                  <div class="mb-3 p-2 bg-red-500/5 border border-red-500/20 rounded">
                    <div class="flex items-center gap-2 mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      <span class="text-[10px] font-mono text-red-400 uppercase font-bold">Vulnerability Scan Results:</span>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div class="flex items-center gap-1.5">
                        <div class="w-1.5 h-1.5 rounded-full" [class.bg-red-500]="lead.vulnerabilities.unencryptedConnection" [class.bg-green-500]="!lead.vulnerabilities.unencryptedConnection"></div>
                        <span class="text-[9px] font-mono" [class.text-red-300]="lead.vulnerabilities.unencryptedConnection" [class.text-gray-500]="!lead.vulnerabilities.unencryptedConnection">SSL/HTTPS</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <div class="w-1.5 h-1.5 rounded-full" [class.bg-red-500]="lead.vulnerabilities.outdatedSoftware" [class.bg-green-500]="!lead.vulnerabilities.outdatedSoftware"></div>
                        <span class="text-[9px] font-mono" [class.text-red-300]="lead.vulnerabilities.outdatedSoftware" [class.text-gray-500]="!lead.vulnerabilities.outdatedSoftware">SOFTWARE</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <div class="w-1.5 h-1.5 rounded-full" [class.bg-red-500]="lead.vulnerabilities.missingSecurityHeaders" [class.bg-green-500]="!lead.vulnerabilities.missingSecurityHeaders"></div>
                        <span class="text-[9px] font-mono" [class.text-red-300]="lead.vulnerabilities.missingSecurityHeaders" [class.text-gray-500]="!lead.vulnerabilities.missingSecurityHeaders">HEADERS</span>
                      </div>
                    </div>
                    @if (lead.vulnerabilities.detectedSoftware && lead.vulnerabilities.detectedSoftware.length > 0) {
                      <div class="mt-2 flex flex-wrap gap-1">
                        @for (sw of lead.vulnerabilities.detectedSoftware; track sw) {
                          <span class="text-[8px] font-mono bg-red-900/20 text-red-300 px-1 rounded border border-red-800/30">{{ sw }}</span>
                        }
                      </div>
                    }
                  </div>
                }

                <div class="flex flex-wrap gap-2 mb-4">
                  @for (issue of lead.issues; track issue) {
                    <span class="text-[10px] uppercase font-bold tracking-wider bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      {{ issue }}
                    </span>
                  }
                </div>
             </div>

             <!-- Action Buttons -->
             <div class="flex flex-col gap-2 shrink-0">
                 <!-- Quick Send Email Button (Conditional Logic for FORM_ONLY) -->
                 <button 
                    (click)="sendEmail(lead)"
                    class="whitespace-nowrap px-4 py-2 rounded text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(0,255,157,0.2)] hover:shadow-[0_0_20px_rgba(0,255,157,0.4)]"
                    [class.bg-cyber-primary]="lead.email !== 'FORM_ONLY'"
                    [class.text-cyber-black]="lead.email !== 'FORM_ONLY'"
                    [class.hover:bg-emerald-400]="lead.email !== 'FORM_ONLY'"
                    [class.bg-orange-500]="lead.email === 'FORM_ONLY'"
                    [class.text-white]="lead.email === 'FORM_ONLY'"
                    [class.hover:bg-orange-600]="lead.email === 'FORM_ONLY'"
                  >
                    @if (lead.email === 'FORM_ONLY') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        OPEN CONTACT FORM
                    } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        SEND TECHSTRIKE EMAIL
                    }
                  </button>

                 <button 
                    (click)="onGenerate(lead)"
                    class="whitespace-nowrap bg-cyber-gray hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    CUSTOMIZE PITCH
                  </button>

                  <button 
                    (click)="onDeepScout(lead)"
                    class="whitespace-nowrap bg-purple-900/20 hover:bg-purple-600/20 text-purple-300 hover:text-purple-100 px-4 py-2 rounded text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-purple-800/50 hover:border-purple-500/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                    DEEP SCOUT
                  </button>
                  
                  <button 
                    (click)="onAnalyze(lead)"
                    class="whitespace-nowrap bg-purple-900/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-100 px-4 py-2 rounded text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-purple-800/50 hover:border-purple-400/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    RUN CORP INTEL
                  </button>

                  <button 
                    (click)="onAudit(lead)"
                    class="whitespace-nowrap bg-blue-900/20 hover:bg-blue-600/20 text-blue-300 hover:text-blue-100 px-4 py-2 rounded text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-blue-800/50 hover:border-blue-500/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    INSURTECH AUDIT
                  </button>

                  <button 
                    (click)="onScanVulnerabilities(lead)"
                    class="whitespace-nowrap bg-red-900/20 hover:bg-red-600/20 text-red-300 hover:text-red-100 px-4 py-2 rounded text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-red-800/50 hover:border-red-500/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    VULNERABILITY SCAN
                  </button>

                  <button 
                    (click)="selectedNapLead.set(lead)"
                    class="whitespace-nowrap bg-teal-900/20 hover:bg-teal-600/20 text-teal-300 hover:text-teal-100 px-4 py-2 rounded text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-teal-800/50 hover:border-teal-500/50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
                    NAP AUDIT
                  </button>
             </div>
          </div>

          @if (selectedNapLead() === lead) {
            <div class="mt-4 p-4 border border-teal-900/30 bg-zinc-950 rounded-lg">
              <div class="flex justify-between items-center mb-4">
                <h4 class="text-sm font-bold text-teal-400">NAP CONSISTENCY AUDIT: {{ lead.businessName }}</h4>
                <button (click)="selectedNapLead.set(null)" class="text-zinc-500 hover:text-white">Close</button>
              </div>
              <app-nap-health [lead]="lead"></app-nap-health>
            </div>
          }

          <!-- Contact Info Section -->
          <div class="mt-4 pt-4 border-t border-gray-800/50 flex flex-wrap gap-y-3 gap-x-6 pl-3">
             <div class="flex items-center gap-2 text-gray-400 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyber-primary/70"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span class="font-mono text-gray-300 truncate">{{ lead.ownerName }}</span>
             </div>
             
             <div class="flex items-center gap-2 text-gray-400 text-xs relative group/email">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyber-primary/70"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span class="font-mono truncate select-all" 
                    [class.text-cyber-primary]="lead.email !== 'FORM_ONLY'"
                    [class.text-orange-500]="lead.email === 'FORM_ONLY'"
                    [class.hover:underline]="lead.email !== 'FORM_ONLY'"
                    [class.cursor-pointer]="lead.email !== 'FORM_ONLY'">
                    {{ lead.email }}
                </span>
             </div>

             <div class="flex items-center gap-2 text-gray-400 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyber-primary/70"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span class="font-mono truncate">{{ lead.phone }}</span>
             </div>
             
             <!-- Social Profiles -->
             <div class="flex items-center gap-2 w-full sm:w-auto sm:ml-auto mt-3 sm:mt-0 justify-start sm:justify-end border-t border-dashed border-gray-800 sm:border-none pt-3 sm:pt-0">
               @if (lead.socialProfiles?.linkedin) {
                 <a [href]="lead.socialProfiles.linkedin" target="_blank" class="w-8 h-8 flex items-center justify-center rounded bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-blue-500 hover:bg-blue-600/20 transition-all duration-300 group/icon" title="LinkedIn Profile">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover/icon:scale-110 transition-transform"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                 </a>
               }
               @if (lead.socialProfiles?.twitter) {
                 <a [href]="lead.socialProfiles.twitter" target="_blank" class="w-8 h-8 flex items-center justify-center rounded bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-sky-500 hover:bg-sky-600/20 transition-all duration-300 group/icon" title="X (Twitter) Profile">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover/icon:scale-110 transition-transform"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
                 </a>
               }
               @if (lead.socialProfiles?.facebook) {
                 <a [href]="lead.socialProfiles.facebook" target="_blank" class="w-8 h-8 flex items-center justify-center rounded bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-blue-600 hover:bg-blue-700/20 transition-all duration-300 group/icon" title="Facebook Profile">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover/icon:scale-110 transition-transform"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                 </a>
               }
             </div>
          </div>

        </div>
      }
    </div>
  `
})
export class LeadListComponent {
  leads = input<Lead[]>([]);
  generate = output<Lead>();
  analyze = output<Lead>();
  auditInsurTech = output<Lead>();
  deepScout = output<Lead>();
  scanVulnerabilities = output<Lead>();
  updateOutreachStatus = output<{ lead: Lead, status: 'Not Contacted' | 'Contacted' | 'Ignored' | 'Responded' | 'Won' | 'Lost' }>();

  filterStatus = signal<string>('All');
  sortDirection = signal<'asc' | 'desc'>('desc');
  selectedNapLead = signal<Lead | null>(null);

  displayedLeads = computed(() => {
    let result = this.leads();
    const status = this.filterStatus();
    const direction = this.sortDirection();

    // Filter
    if (status !== 'All') {
      result = result.filter(l => l.securityStatus === status);
    }

    // Sort
    result = [...result].sort((a, b) => {
      const riskA = a.riskScore;
      const riskB = b.riskScore;
      return direction === 'desc' ? riskB - riskA : riskA - riskB;
    });

    return result;
  });

  exportToCsv() {
    const leads = this.displayedLeads();
    if (leads.length === 0) return;

    const headers = ['Business Name', 'URL', 'Category', 'Security Status', 'Risk Score', 'Estimated Loss', 'Tech Debt', 'Owner Name', 'Email', 'Phone'];
    
    const rows = leads.map(l => [
      `"${(l.businessName || '').replace(/"/g, '""')}"`,
      `"${(l.url || '').replace(/"/g, '""')}"`,
      `"${(l.websiteCategory || '').replace(/"/g, '""')}"`,
      `"${(l.securityStatus || '').replace(/"/g, '""')}"`,
      l.riskScore,
      `"${(l.estimatedLeadLoss || '').replace(/"/g, '""')}"`,
      `"${(l.techDebtLevel || '').replace(/"/g, '""')}"`,
      `"${(l.ownerName || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `lead-strike-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  exportAllLeadsToPdf() {
    const leads = this.displayedLeads();
    if (leads.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Lead Strike: Comprehensive Audit Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    let y = 40;
    leads.forEach((l, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      this.addLeadToDoc(doc, l, index + 1, y);
      y += 100; // Simplified y-increment for multi-lead
    });

    doc.save(`lead-strike-comprehensive-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  exportSingleLeadToPdf(l: Lead) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Lead Strike: Audit - ${l.businessName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    this.addLeadToDoc(doc, l, 1, 40);

    doc.save(`lead-strike-audit-${l.businessName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  private addLeadToDoc(doc: any, l: Lead, index: number, y: number) {
      doc.setFontSize(14);
      doc.text(`${index}. ${l.businessName}`, 14, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.text(`URL: ${l.url}`, 14, y);
      y += 5;
      doc.text(`Risk Score: ${l.riskScore}% | Status: ${l.securityStatus}`, 14, y);
      y += 8;

      // Corporate Intelligence
      doc.setFontSize(11);
      doc.text('1. Corporate Intelligence', 14, y);
      doc.setFontSize(9);
      y += 5;
      doc.text(`Proposal: ${l.aiUpgradeProposal?.substring(0, 100) || 'None Generated'}...`, 14, y);
      y += 10;
      
      // InsurTech Audit
      doc.setFontSize(11);
      doc.text('2. InsurTech Audit', 14, y);
      doc.setFontSize(9);
      y += 5;
      doc.text(`Category: ${l.websiteCategory || 'N/A'}`, 14, y);
      y += 10;

      // Vulnerability Scan
      doc.setFontSize(11);
      doc.text('3. Vulnerability Scan Results', 14, y);
      doc.setFontSize(9);
      y += 5;
      const vulns = l.vulnerabilities;
      doc.text(`SSL Check: ${vulns?.unencryptedConnection ? 'Vulnerable' : 'Secure'}`, 14, y);
      y += 5;
      doc.text(`Software: ${vulns?.outdatedSoftware ? 'Outdated' : 'Up to Date'}`, 14, y);
      y += 5;
      doc.text(`Headers: ${vulns?.missingSecurityHeaders ? 'Missing' : 'Present'}`, 14, y);
  }

  sendEmail(lead: Lead) {
    if (lead.email === 'FORM_ONLY') {
      // Fallback to main URL if contact form specific URL is missing but it's a form-only lead
      const targetUrl = lead.contactFormUrl || lead.url;
      if (targetUrl) {
         window.open(targetUrl, '_blank');
         this.updateOutreachStatus.emit({ lead, status: 'Contacted' });
      } else {
        alert('No contact URL available for this lead.');
      }
      return;
    }
    
    if (lead.email) {
        const subject = `Urgent: Security & Revenue Risk for ${lead.businessName}`;
        const body = lead.ceoPitch 
            ? lead.ceoPitch 
            : `Hi ${lead.ownerName || 'there'},\n\nI noticed your website ${lead.url} is running on legacy infrastructure that might be costing you leads.\n\nBest,\nTechStrike Audit Team`;
        
        const mailtoLink = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Use a hidden anchor tag to prevent potential navigation issues with window.location.href
        const a = document.createElement('a');
        a.href = mailtoLink;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.updateOutreachStatus.emit({ lead, status: 'Contacted' });
    } else {
        alert('No email address found for this lead. Try using the Deep Scout feature to find key personnel.');
    }
  }

  onGenerate(lead: Lead) {
    this.generate.emit(lead);
  }

  onAnalyze(lead: Lead) {
    this.analyze.emit(lead);
  }

  onAudit(lead: Lead) {
    this.auditInsurTech.emit(lead);
  }

  onDeepScout(lead: Lead) {
    this.deepScout.emit(lead);
  }

  onScanVulnerabilities(lead: Lead) {
    this.scanVulnerabilities.emit(lead);
  }

  onOutreachStatusChange(lead: Lead, event: Event) {
    const status = (event.target as HTMLSelectElement).value as 'Not Contacted' | 'Contacted' | 'Ignored' | 'Responded' | 'Won' | 'Lost';
    this.updateOutreachStatus.emit({ lead, status });
  }
}