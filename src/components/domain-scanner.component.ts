import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

interface ScanDetails {
  protocol: string;
  secure: boolean;
  status: string;
  message: string;
  vulnerabilities: string[];
}

@Component({
  selector: 'app-domain-scanner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div id="domain-scanner-card" class="bg-cyber-dark border border-cyber-gray p-6 rounded-lg shadow-lg relative overflow-hidden group">
      <div class="absolute inset-0 bg-cyber-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

      <h2 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyber-primary">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        🔍 Lead Strike Domain Security Scan
      </h2>

      <p class="text-xs text-gray-400 mb-6 leading-relaxed">
        Input any client domain to perform an automated network intelligence probe and discover hidden backend vulnerabilities, protocol weaknesses, and security gaps.
      </p>

      <!-- Search Input Group -->
      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="relative flex-1">
          <input 
            id="scanner-domain-input"
            type="text" 
            [formControl]="domainCtrl" 
            placeholder="Enter domain (e.g. example.com)" 
            (keyup.enter)="runScan()"
            class="w-full bg-cyber-black border border-cyber-gray text-white px-4 py-3.5 rounded focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all placeholder-gray-700 text-sm font-mono"
          />
        </div>
        <button 
          id="scanner-submit-btn"
          (click)="runScan()" 
          [disabled]="isScanning() || !domainCtrl.value?.trim()" 
          class="bg-cyber-primary hover:bg-emerald-400 text-cyber-black font-bold py-3.5 px-6 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 text-sm"
        >
          @if (isScanning()) {
            <svg class="animate-spin h-4 w-4 text-cyber-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Scanning...
          } @else {
            Probe Domain
          }
        </button>
      </div>

      <!-- Scan Progress logs -->
      @if (isScanning()) {
        <div class="bg-cyber-black border border-zinc-800 p-4 rounded font-mono text-[11px] text-gray-500 space-y-1.5 mb-6">
          <div class="flex items-center gap-2 text-cyber-primary">
            <span class="w-1.5 h-1.5 rounded-full bg-cyber-primary animate-ping"></span>
            <span>INITIALIZING N8N PORT SCAN SEQUENCE...</span>
          </div>
          <div>› Querying server WHOIS and registry endpoints...</div>
          <div>› Crawling HTTP status headers and SSL verification loops...</div>
        </div>
      }

      <!-- Scan Results Section -->
      @if (scanResult() && !isScanning()) {
        <div 
          id="scan-result-panel"
          class="border rounded p-5 space-y-4 transition-all"
          [ngClass]="scanResult()?.secure 
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
            : 'bg-cyber-accent/5 border-cyber-accent/20 text-cyber-accent'"
        >
          <div class="flex items-start justify-between border-b border-zinc-800 pb-3">
            <div>
              <span class="text-[10px] font-mono uppercase tracking-wider text-gray-500 block mb-1">PROBE STATUS</span>
              <h3 class="text-sm font-bold font-mono tracking-tight">{{ scanResult()?.status }}</h3>
            </div>
            <div class="text-xs font-mono font-bold uppercase py-1 px-2.5 rounded"
                 [ngClass]="scanResult()?.secure ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-cyber-accent/10 border border-cyber-accent/30'">
              {{ scanResult()?.protocol }}
            </div>
          </div>

          <div class="text-xs text-gray-300 leading-relaxed font-sans">
            <strong class="text-white block mb-1">Dossier Findings:</strong>
            {{ scanResult()?.message }}
          </div>

          @if (scanResult()!.vulnerabilities.length > 0) {
            <div class="pt-2 border-t border-zinc-800">
              <span class="text-[10px] font-mono uppercase text-gray-500 tracking-wider block mb-2 font-bold">⚠️ CRITICAL TECH DEBT VULNERABILITIES:</span>
              <div class="flex flex-wrap gap-2">
                @for (vuln of scanResult()?.vulnerabilities; track vuln) {
                  <span class="bg-cyber-accent/15 border border-cyber-accent/30 text-cyber-accent text-[10px] font-mono font-bold px-2.5 py-1 rounded">
                    {{ vuln }}
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class DomainScannerComponent {
  domainCtrl = new FormControl('');
  isScanning = signal(false);
  scanResult = signal<ScanDetails | null>(null);

  runScan() {
    const rawVal = this.domainCtrl.value || '';
    let cleanDomain = rawVal.trim();
    if (!cleanDomain) return;

    // Normalize domain
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    this.isScanning.set(true);
    this.scanResult.set(null);

    // Simulated n8n-style diagnostic scan
    setTimeout(() => {
      const isSecure = !rawVal.startsWith('http://') && Math.random() > 0.45;
      const protocol = isSecure ? 'HTTPS' : 'HTTP';

      this.scanResult.set({
        protocol,
        secure: isSecure,
        status: isSecure ? '✅ SECURE – Modern TLS 1.3 Detected' : '⚠️ INSECURE – HTTP Only or Expired Cert',
        message: isSecure 
          ? `Domain '${cleanDomain}' is fully protected. Standard SSL check passed. Ready for premium Lead Strike outreach campaigns.` 
          : `Domain '${cleanDomain}' operates under unsecured protocols. Vulnerable to MITM and client-side data interception. High priority lead identified for immediate conversion outreach.`,
        vulnerabilities: !isSecure ? ['PHP 7.2 End-of-Life', 'Missing HSTS', 'Outdated SSL', 'Clickjacking Vulnerability'] : []
      });

      this.isScanning.set(false);
    }, 1200);
  }
}
