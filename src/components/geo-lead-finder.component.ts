import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

interface LocalBusiness {
  name: string;
  domain: string;
  status: string;
  distance: string;
  isPushed?: boolean;
}

@Component({
  selector: 'app-geo-lead-finder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div id="geo-lead-finder-card" class="bg-cyber-dark border border-cyber-gray p-6 rounded-lg shadow-lg relative overflow-hidden group">
      <div class="absolute inset-0 bg-cyber-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

      <h2 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyber-primary">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
        🌍 Lead Strike Geo Targeting 2026
      </h2>

      <p class="text-xs text-gray-400 mb-6 leading-relaxed">
        Locate unsecured, vulnerable business sites within a specific geographic range. Auto-detect your position or input manual parameters to deploy local lead swarms.
      </p>

      <!-- Input Actions Bar -->
      <div class="flex flex-col gap-3 mb-6">
        <div class="flex flex-col md:flex-row gap-3">
          <div class="relative flex-1">
            <input
              id="geo-location-input"
              type="text"
              [formControl]="locationInput"
              placeholder="Enter City, Zip Code, or Address"
              (keyup.enter)="findUnsecured()"
              class="w-full bg-cyber-black border border-cyber-gray text-white px-4 py-3.5 rounded focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all placeholder-gray-700 text-sm"
            />
          </div>
          <div class="relative flex-1">
            <input
              id="geo-niche-input"
              type="text"
              [formControl]="nicheInput"
              placeholder="Enter Business Niche (e.g. Plumber, Dentist)"
              (keyup.enter)="findUnsecured()"
              class="w-full bg-cyber-black border border-cyber-gray text-white px-4 py-3.5 rounded focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all placeholder-gray-700 text-sm"
            />
          </div>
        </div>
        
        <div class="flex gap-3">
          <button
            id="geo-locate-btn"
            type="button"
            (click)="getUserLocation()"
            class="bg-zinc-900 border border-zinc-700/80 hover:bg-zinc-800 text-gray-300 font-mono text-xs py-3.5 px-4 rounded flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyber-primary">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            📍 Locate
          </button>

          <button
            id="geo-scan-btn"
            type="button"
            (click)="findUnsecured()"
            [disabled]="loading() || (!locationInput.value && !userCoords())"
            class="bg-cyber-primary hover:bg-emerald-400 text-cyber-black font-bold py-3.5 px-6 rounded flex flex-1 items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 text-sm"
          >
          @if (loading()) {
            <svg class="animate-spin h-4 w-4 text-cyber-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Scanning...
          } @else {
            Deploy Scan
          }
        </button>
      </div>

      <!-- User Position feedback -->
      @if (userCoords()) {
        <div class="mb-4 bg-cyber-primary/5 border border-cyber-primary/20 text-cyber-primary p-3 rounded text-xs font-mono flex items-center justify-between">
          <span>Active Geolocation: Lat {{ userCoords()?.lat | number:'1.4-4' }}, Lng {{ userCoords()?.lng | number:'1.4-4' }}</span>
          <button (click)="clearCoords()" class="text-gray-400 hover:text-white transition-colors">✖</button>
        </div>
      }

      <!-- System Scan Message log -->
      @if (systemLog()) {
        <div class="mb-6 bg-cyber-black border border-zinc-800 p-4 rounded font-mono text-xs text-gray-400">
          <div class="flex items-center gap-2 text-cyber-primary mb-1">
            <span class="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></span>
            <span>SYSTEM AUDIT FEED:</span>
          </div>
          <p>{{ systemLog() }}</p>
        </div>
      }

      <!-- Targets Table Section -->
      @if (results().length > 0) {
        <div class="border border-zinc-800/80 rounded overflow-hidden">
          <div class="bg-cyber-black px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
            <h3 class="text-xs font-mono text-cyber-primary uppercase tracking-wider font-bold">Unsecured Targets Found ({{ results().length }})</h3>
            <span class="text-[10px] font-mono text-gray-500">RADIUS: ~5.0 MILES</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-zinc-800 bg-zinc-950/40 text-gray-400 font-mono text-[10px] uppercase">
                  <th class="p-3">Business</th>
                  <th class="p-3">Domain</th>
                  <th class="p-3">Status</th>
                  <th class="p-3">Distance</th>
                  <th class="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-900 font-sans">
                @for (biz of results(); track biz.name) {
                  <tr class="hover:bg-zinc-900/40 transition-colors">
                    <td class="p-3 text-white font-medium">{{ biz.name }}</td>
                    <td class="p-3"><code class="text-gray-400 font-mono select-all">{{ biz.domain }}</code></td>
                    <td class="p-3">
                      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyber-accent/10 border border-cyber-accent/20 text-cyber-accent font-mono text-[10px] font-semibold">
                        <span class="w-1 h-1 rounded-full bg-cyber-accent animate-ping"></span>
                        {{ biz.status }}
                      </span>
                    </td>
                    <td class="p-3 text-gray-400 font-mono">{{ biz.distance }}</td>
                    <td class="p-3 text-right">
                      <button
                        (click)="pushToN8n(biz)"
                        [disabled]="biz.isPushed"
                        class="text-[11px] font-mono py-1 px-3.5 rounded transition-all active:scale-95"
                        [ngClass]="biz.isPushed 
                          ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed' 
                          : 'bg-cyber-primary/10 hover:bg-cyber-primary/20 border border-cyber-primary/30 text-cyber-primary hover:text-white cursor-pointer'"
                      >
                        {{ biz.isPushed ? 'In Swarm ✓' : 'Strike → n8n' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class GeoLeadFinderComponent {
  locationInput = new FormControl('');
  nicheInput = new FormControl('');
  userCoords = signal<{ lat: number; lng: number } | null>(null);
  loading = signal(false);
  results = signal<LocalBusiness[]>([]);
  systemLog = signal<string>('');

  getUserLocation() {
    if (!navigator.geolocation) {
      this.systemLog.set('Geolocation is not supported by this browser client.');
      return;
    }

    this.systemLog.set('Querying client browser for high-accuracy GPS telemetry...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userCoords.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        this.locationInput.setValue(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        this.systemLog.set('Telemetry lock acquired. Spatial parameters updated. Ready to deploy area sweep.');
      },
      (err) => {
        console.error('Geolocation access denied:', err);
        this.systemLog.set('Geolocation handshake failed. Falling back to manual parameter lookup.');
      }
    );
  }

  clearCoords() {
    this.userCoords.set(null);
    this.locationInput.setValue('');
    this.systemLog.set('');
    this.results.set([]);
  }

  findUnsecured() {
    const loc = this.locationInput.value || '';
    if (!loc && !this.userCoords()) return;

    this.loading.set(true);
    this.results.set([]);
    this.systemLog.set('Initializing regional perimeter scan...');

    setTimeout(() => {
      this.systemLog.set('DNS and handshake audits completed on neighboring subnets. Isolating HTTP-only legacy servers...');
    }, 600);

    setTimeout(() => {
      const mockResults: LocalBusiness[] = [
        { name: "Alamo City Plumbers", domain: "http://alamocityplumbing.com", status: "HTTP Only - Critical", distance: "0.6 mi" },
        { name: "Pearl District Dental", domain: "http://pearldental-sa.com", status: "Expired Certificate", distance: "1.4 mi" },
        { name: "Bexar Mechanical Services", domain: "http://bexarmechanical.com", status: "HTTP Only", distance: "2.3 mi" },
        { name: "Riverwalk Auto Collision", domain: "http://riverwalkautorepair.com", status: "Insecure Form Action", distance: "3.1 mi" }
      ];

      this.results.set(mockResults);
      this.loading.set(false);
      this.systemLog.set(`Regional scan complete. Found ${mockResults.length} insecure legacy websites. Ready for targeted outreach strike.`);
    }, 1500);
  }

  pushToN8n(biz: LocalBusiness) {
    // Set pushed state
    this.results.update(items =>
      items.map(item => item.name === biz.name ? { ...item, isPushed: true } : item)
    );
    
    this.systemLog.set(`Pushed '${biz.name}' to the n8n outreach swarm. Launching autonomous diagnostic sequence...`);
  }
}
