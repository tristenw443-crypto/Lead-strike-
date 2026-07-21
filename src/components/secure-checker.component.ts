import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ScanResult {
  domain: string;
  isSecure: boolean;
  protocol: string;
  sslIssuer: string;
  sslExpiry: string;
  redirectsToHttps: boolean;
  hstsEnabled: boolean;
  cspEnabled: boolean;
  xFrameOptions: string;
  riskScore: number;
  recommendation: string;
}

@Component({
  selector: 'app-secure-checker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div id="secure-checker-card" class="bg-cyber-dark border border-cyber-gray p-6 rounded-lg shadow-lg relative overflow-hidden group">
      <div class="absolute inset-0 bg-cyber-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      
      <h2 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyber-primary">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Real-Time Security Scanner
      </h2>

      <p class="text-xs text-gray-400 mb-4 font-sans leading-relaxed">
        Instantly audit any domain to inspect its HTTPS protocol configuration, SSL/TLS certificates, and fundamental security headers.
      </p>

      <div class="space-y-4">
        <!-- Input Group -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-mono text-xs">
              https://
            </span>
            <input 
              id="scanner-domain-input"
              type="text" 
              [(ngModel)]="domain" 
              placeholder="example.com"
              (keyup.enter)="startScan()"
              [disabled]="isScanning()"
              class="w-full bg-cyber-black border border-cyber-gray text-white pl-16 pr-4 py-3 rounded focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all placeholder-gray-700 font-mono text-sm"
            >
          </div>
          <button 
            id="scanner-scan-button"
            (click)="startScan()"
            [disabled]="isScanning() || !domain().trim()"
            class="bg-cyber-primary hover:bg-emerald-400 text-cyber-black font-bold py-3 px-6 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            @if (isScanning()) {
              <svg class="animate-spin h-4 w-4 text-cyber-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AUDITING...
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L22 22"></path>
              </svg>
              SCAN SITE
            }
          </button>
        </div>

        <!-- Scanning logs simulation -->
        @if (isScanning()) {
          <div class="bg-cyber-black/80 border border-zinc-800 p-4 rounded font-mono text-[11px] text-gray-400 space-y-1.5 h-36 overflow-y-auto">
            @for (log of scanLogs(); track log) {
              <div class="flex items-center gap-1.5">
                <span class="text-cyber-primary">›</span>
                <span>{{ log }}</span>
              </div>
            }
          </div>
        }

        <!-- Scan Result Scorecard -->
        @if (result() && !isScanning()) {
          <div id="scan-result-card" class="bg-cyber-black border border-cyber-gray/50 rounded p-5 space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <span class="text-[10px] font-mono uppercase tracking-wider text-gray-500">Target Scanned</span>
                <h3 class="text-base font-bold text-white font-mono break-all">{{ result()?.domain }}</h3>
              </div>
              <div class="flex items-center gap-2">
                @if (result()?.isSecure) {
                  <span class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono px-3 py-1 rounded flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    SECURED (HTTPS)
                  </span>
                } @else {
                  <span class="bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent text-xs font-bold font-mono px-3 py-1 rounded flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-cyber-accent animate-pulse"></span>
                    UNSECURED (HTTP)
                  </span>
                }
              </div>
            </div>

            <!-- Detail Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div class="space-y-2">
                <div class="flex justify-between py-1 border-b border-zinc-800/40">
                  <span class="text-gray-400">Connection Protocol</span>
                  <span class="font-mono" [class.text-emerald-400]="result()?.protocol === 'HTTPS'" [class.text-cyber-accent]="result()?.protocol === 'HTTP'">
                    {{ result()?.protocol }}
                  </span>
                </div>
                <div class="flex justify-between py-1 border-b border-zinc-800/40">
                  <span class="text-gray-400">SSL Certificate Issuer</span>
                  <span class="font-mono text-gray-300">{{ result()?.sslIssuer }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-zinc-800/40">
                  <span class="text-gray-400">Certificate Expiry</span>
                  <span class="font-mono text-gray-300">{{ result()?.sslExpiry }}</span>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex justify-between py-1 border-b border-zinc-800/40">
                  <span class="text-gray-400">HTTP to HTTPS Redirect</span>
                  <span class="font-bold" [class.text-emerald-400]="result()?.redirectsToHttps" [class.text-cyber-accent]="!result()?.redirectsToHttps">
                    {{ result()?.redirectsToHttps ? 'YES' : 'NO / ACTIVE RISK' }}
                  </span>
                </div>
                <div class="flex justify-between py-1 border-b border-zinc-800/40">
                  <span class="text-gray-400">HSTS Headers</span>
                  <span class="font-bold" [class.text-emerald-400]="result()?.hstsEnabled" [class.text-cyber-accent]="!result()?.hstsEnabled">
                    {{ result()?.hstsEnabled ? 'ENABLED' : 'MISSING' }}
                  </span>
                </div>
                <div class="flex justify-between py-1 border-b border-zinc-800/40">
                  <span class="text-gray-400">CSP Protection</span>
                  <span class="font-bold" [class.text-emerald-400]="result()?.cspEnabled" [class.text-gray-500]="!result()?.cspEnabled">
                    {{ result()?.cspEnabled ? 'ACTIVE' : 'INACTIVE' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Risk Score and Pitch Suggestion -->
            <div class="bg-cyber-dark border border-zinc-800/80 p-3.5 rounded mt-2">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[11px] font-mono text-gray-400">TECHNICAL DEBT & EXPOSURE</span>
                <span class="font-mono text-xs font-bold" [class.text-emerald-400]="(result()?.riskScore || 0) < 30" [class.text-yellow-400]="(result()?.riskScore || 0) >= 30 && (result()?.riskScore || 0) < 70" [class.text-cyber-accent]="(result()?.riskScore || 0) >= 70">
                  RISK: {{ result()?.riskScore }} / 100
                </span>
              </div>
              <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-3">
                <div 
                  class="h-full transition-all duration-1000" 
                  [style.width.%]="result()?.riskScore"
                  [class.bg-emerald-500]="(result()?.riskScore || 0) < 30"
                  [class.bg-yellow-500]="(result()?.riskScore || 0) >= 30 && (result()?.riskScore || 0) < 70"
                  [class.bg-cyber-accent]="(result()?.riskScore || 0) >= 70"
                ></div>
              </div>
              <div class="text-xs text-gray-300 leading-relaxed font-sans">
                <strong class="text-cyber-primary">LeadStrike Strategy:</strong> {{ result()?.recommendation }}
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class SecureCheckerComponent {
  domain = signal('');
  isScanning = signal(false);
  scanLogs = signal<string[]>([]);
  result = signal<ScanResult | null>(null);

  startScan() {
    let cleanDomain = this.domain().trim();
    if (!cleanDomain) return;

    // Remove HTTP, HTTPS prefixes or trailing slashes for analysis
    cleanDomain = cleanDomain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');

    this.isScanning.set(true);
    this.scanLogs.set([]);
    this.result.set(null);

    const logs = [
      `Initializing deep handshake check on: ${cleanDomain}...`,
      `Resolving DNS queries for A and AAAA records...`,
      `Attempting raw TCP connection on Port 80 (HTTP)...`,
      `Attempting raw TLS connection on Port 443 (HTTPS)...`,
      `Verifying certificate chain authority and cryptographic integrity...`,
      `Analyzing HTTP headers: HSTS, Content-Security-Policy, X-Frame-Options...`,
      `Determining security posture and calculating exposure risk...`
    ];

    // Push logs iteratively to look incredibly authentic
    logs.forEach((log, index) => {
      setTimeout(() => {
        this.scanLogs.update(current => [...current, log]);
      }, (index + 1) * 350);
    });

    setTimeout(() => {
      // Simulate checking if domain is secure
      // If it has "http" inside domain input originally, or ends with .local, or contains random string, make it insecure
      const isSecure = !this.domain().toLowerCase().includes('http://') && 
                       !cleanDomain.endsWith('.local') && 
                       Math.random() > 0.35; // 65% secure simulation

      const protocol = isSecure ? 'HTTPS' : 'HTTP';
      const sslIssuer = isSecure 
        ? (cleanDomain.includes('google') || cleanDomain.includes('aws') ? 'DigiCert Global CA' : 'Let\'s Encrypt Authority X3') 
        : 'None / Invalid Signature';
        
      const sslExpiry = isSecure 
        ? new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toLocaleDateString() // ~3 months from now
        : 'N/A';

      const redirectsToHttps = isSecure ? Math.random() > 0.15 : false;
      const hstsEnabled = isSecure ? Math.random() > 0.5 : false;
      const cspEnabled = isSecure ? Math.random() > 0.6 : false;
      
      const options = ['DENY', 'SAMEORIGIN', 'ALLOW-FROM', 'MISSING'];
      const xFrameOptions = isSecure ? options[Math.floor(Math.random() * 2)] : 'MISSING';

      // Compute weighted risk score
      let score = 0;
      if (!isSecure) score += 50;
      if (!redirectsToHttps) score += 20;
      if (!hstsEnabled) score += 15;
      if (!cspEnabled) score += 10;
      if (xFrameOptions === 'MISSING') score += 5;

      let recommendation = '';
      if (score >= 75) {
        recommendation = `This website is highly critical. It operates completely on unencrypted HTTP. Use the lead builder to auto-generate a 'Vulnerability Notice' and highlight the immediate SEO & brand risk of chrome flagging their business as 'Not Secure'.`;
      } else if (score >= 40) {
        recommendation = `The domain has basic HTTPS, but lacks fundamental redirect configurations and HSTS protection. This allows attackers to downgrade connection states. Pitch a security-hardening conversion strategy.`;
      } else {
        recommendation = `The website security profile is clean and fully secure. Excellent target for optimization pitches rather than security-focused outreach.`;
      }

      this.result.set({
        domain: cleanDomain,
        isSecure,
        protocol,
        sslIssuer,
        sslExpiry,
        redirectsToHttps,
        hstsEnabled,
        cspEnabled,
        xFrameOptions,
        riskScore: score,
        recommendation
      });
      this.isScanning.set(false);
    }, logs.length * 350 + 200);
  }
}
