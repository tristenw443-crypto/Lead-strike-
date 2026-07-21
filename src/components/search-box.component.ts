import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type SearchType = 'general' | 'partners' | 'insurtech' | 'audit';

interface HistoryItem {
  label: string;
  type: SearchType;
  params: any;
}

@Component({

  selector: 'app-search-box',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="bg-cyber-dark border border-cyber-gray p-6 rounded-lg shadow-lg relative overflow-hidden group">
      <div class="absolute inset-0 bg-cyber-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      
      <h2 class="text-lg font-semibold mb-4 text-white flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cyber-primary"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Target Parameters
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-mono text-gray-500 uppercase tracking-wider">Target City / Zip</label>
            <button 
              type="button"
              (click)="getCurrentLocation()" 
              [disabled]="isLocating()"
              class="text-[10px] font-mono text-cyber-primary hover:text-white flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
              title="Detect current location"
            >
              @if (isLocating()) {
                <span class="animate-pulse">LOCATING...</span>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                AUTO-DETECT
              }
            </button>
          </div>
          <input 
            type="text" 
            [(ngModel)]="city" 
            placeholder="e.g. Austin, TX or 78701"
            (keyup.enter)="onSubmit()"
            class="w-full bg-cyber-black border border-cyber-gray text-white px-4 py-3 rounded focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all placeholder-gray-700"
          >
        </div>
        <div>
          <label class="block text-xs font-mono text-gray-500 mb-1 uppercase tracking-wider">Business Niche</label>
          <input 
            type="text" 
            [(ngModel)]="niche"
            list="niche-options"
            placeholder="e.g. Healthcare or Probate"
            class="w-full bg-cyber-black border border-cyber-gray text-white px-4 py-3 rounded focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all placeholder-gray-700"
          >
          <datalist id="niche-options">
            <option value="Healthcare/Medical">
            <option value="Legal/Professional">
            <option value="Retail/Local Biz">
            <option value="Probate Real Estate">
          </datalist>
        </div>
        <div>
          <label class="block text-xs font-mono text-gray-500 mb-1 uppercase tracking-wider">Brutal Audit Target</label>
          <input 
            type="text" 
            [(ngModel)]="auditTarget" 
            placeholder="Business Name"
            (keyup.enter)="onBrutalAudit()"
            class="w-full bg-cyber-black border border-cyber-accent/30 text-white px-4 py-3 rounded focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent transition-all placeholder-gray-700"
          >
        </div>
        <div>
          <label class="block text-xs font-mono text-gray-500 mb-1 uppercase tracking-wider">Proprietary Filter</label>
          <div class="flex items-center h-[52px]">
            <input type="checkbox" [(ngModel)]="proprietarySearch" class="accent-cyber-primary w-5 h-5 cursor-pointer">
            <span class="ml-2 text-xs font-mono text-gray-300">Enable Distressed Mode</span>
          </div>
        </div>
      </div>

      <div class="mt-6 flex flex-col sm:flex-row justify-end gap-3 flex-wrap">
         <button 
          (click)="onBrutalAudit()"
          [disabled]="isSearching() || !auditTarget()"
          class="bg-transparent border border-cyber-accent/50 text-cyber-accent hover:bg-cyber-accent/10 font-mono text-sm py-3 px-4 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed grow sm:grow-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          BRUTAL AUDIT
        </button>

         <button 
          (click)="onFindInsurTech()"
          [disabled]="isSearching()"
          class="bg-transparent border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 font-mono text-sm py-3 px-4 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed grow sm:grow-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          INSURTECH SCOUT
        </button>
      
         <button 
          (click)="onFindPartners()"
          [disabled]="isSearching()"
          class="bg-transparent border border-cyber-primary/50 text-cyber-primary hover:bg-cyber-primary/10 font-mono text-sm py-3 px-4 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed grow sm:grow-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          PARTNERS
        </button>

        <button 
          (click)="onSubmit()"
          [disabled]="isSearching()"
          class="bg-cyber-primary hover:bg-emerald-400 text-cyber-black font-bold py-3 px-6 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] min-w-[160px] grow sm:grow-0"
        >
          @if (isSearching()) {
            <svg class="animate-spin h-5 w-5 text-cyber-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            SCANNING...
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            INITIATE SCAN
          }
        </button>
      </div>

      @if (searchHistory().length > 0) {
        <div class="mt-6 border-t border-zinc-800 pt-4">
          <button (click)="toggleFolder()" class="text-xs font-mono text-cyber-primary hover:text-white flex items-center gap-2 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            {{ isFolderOpen() ? 'Close' : 'View' }} Search Folder ({{ searchHistory().length }})
          </button>

          @if (isFolderOpen()) {
            <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               @for (item of searchHistory(); track item.label) {
                 <div (click)="onHistoryClick(item); toggleFolder()" class="bg-zinc-900/60 border border-zinc-700/80 hover:bg-zinc-900 p-5 rounded-xl cursor-pointer hover:border-cyber-primary transition-all group flex flex-col justify-between gap-3 shadow-md">
                   <div>
                     <div class="flex items-center justify-between mb-2">
                       <span class="text-[10px] tracking-wider text-cyber-primary font-bold uppercase font-mono px-2 py-0.5 rounded bg-cyber-primary/10 border border-cyber-primary/20">
                         {{ item.type }}
                       </span>
                       <svg class="w-4 h-4 text-zinc-500 group-hover:text-cyber-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                       </svg>
                     </div>
                     @if (item.type === 'general') {
                       <div class="text-base text-white font-semibold font-sans tracking-tight break-words">
                         {{ item.params?.niche || 'Unknown Niche' }}
                       </div>
                       <div class="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-1">
                         <svg class="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                         </svg>
                         {{ item.params?.city }}
                       </div>
                     } @else {
                       <div class="text-sm text-white font-semibold font-sans break-words line-clamp-3">
                         {{ item.label }}
                       </div>
                     }
                   </div>
                 </div>
               }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class SearchBoxComponent {
  city = signal('');
  niche = signal('');
  auditTarget = signal('');
  proprietarySearch = signal(false);
  isSearching = signal(false);
  isLocating = signal(false);
  
  isFolderOpen = signal(false);

  getCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    this.isLocating.set(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (response.ok) {
            const data = await response.json();
            const address = data.address;
            const cityValue = address.city || address.town || address.village || address.suburb;
            const postcode = address.postcode;
            
            if (cityValue && postcode) {
              this.city.set(`${cityValue}, ${postcode}`);
            } else if (cityValue) {
              this.city.set(cityValue);
            } else if (postcode) {
              this.city.set(postcode);
            } else {
              this.city.set(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            }
          } else {
            this.city.set(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          }
        } catch (e) {
          console.error('Error in reverse geocoding:', e);
          this.city.set(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        } finally {
          this.isLocating.set(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.isLocating.set(false);
        // Clean fallback
        this.city.set('San Antonio, TX');
      },
      { timeout: 8000 }
    );
  }

  search = output<{city: string, niche: string, proprietary: boolean}>();
  findPartners = output<string>();
  findInsurTech = output<string>();
  brutalAudit = output<string>();

  searchHistory = signal<HistoryItem[]>([]);

  constructor() {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      try {
        this.searchHistory.set(JSON.parse(history));
      } catch (e) {
        console.error('Failed to parse search history', e);
      }
    }
  }

  toggleFolder() {
    this.isFolderOpen.update(v => !v);
  }

  addToHistory(item: HistoryItem) {
    const current = this.searchHistory();
    // Improved duplicate check: remove any existing item with the same label
    const updated = [item, ...current.filter(i => i.label !== item.label)].slice(0, 10); // Keep last 10
    this.searchHistory.set(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
  }

  onHistoryClick(item: HistoryItem) {
    switch(item.type) {
      case 'general':
        this.city.set(item.params.city);
        this.niche.set(item.params.niche);
        this.proprietarySearch.set(item.params.proprietary);
        this.onSubmit();
        break;
      case 'partners':
        this.city.set(item.params);
        this.onFindPartners();
        break;
      case 'insurtech':
        this.city.set(item.params);
        this.onFindInsurTech();
        break;
      case 'audit':
        this.auditTarget.set(item.params);
        this.onBrutalAudit();
        break;
    }
  }

  onSubmit() {
    if (this.city() && this.niche() && !this.isSearching()) {
      const params = { city: this.city(), niche: this.niche(), proprietary: this.proprietarySearch() };
      this.addToHistory({ label: `${this.city()} - ${this.niche()}`, type: 'general', params });
      this.isSearching.set(true);
      this.search.emit(params);
      
      // Mock network delay visual feedback, then reset.
      setTimeout(() => {
        this.isSearching.set(false);
      }, 3000);
    }
  }

  onFindPartners() {
    if (!this.isSearching()) {
        const location = this.city() || 'Texas';
        this.addToHistory({ label: `Partners in ${location}`, type: 'partners', params: location });
        this.findPartners.emit(location);
    }
  }

  onFindInsurTech() {
    if (!this.isSearching()) {
        const location = this.city() || 'San Antonio';
        this.addToHistory({ label: `InsurTech in ${location}`, type: 'insurtech', params: location });
        this.findInsurTech.emit(location);
    }
  }

  onBrutalAudit() {
    if (this.auditTarget() && !this.isSearching()) {
      this.addToHistory({ label: this.auditTarget(), type: 'audit', params: this.auditTarget() });
      this.brutalAudit.emit(this.auditTarget());
    }
  }
}
