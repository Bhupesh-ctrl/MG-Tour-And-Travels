import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-driver-dashboard',
  template: `
    <div class="fade-in">
      <!-- HUD Header -->
      <div style="margin-bottom: 2rem;">
        <h1 class="text-gradient">Driver HUD</h1>
        <p style="color: var(--text-secondary);">Manage active shifts, start trips, and log earnings</p>
      </div>

      <!-- Quick Stats -->
      <div class="dashboard-grid" *ngIf="stats" style="margin-bottom: 1.5rem; gap: 1rem;">
        <div class="glass-card stats-card" style="padding: 1rem 1.25rem;">
          <div>
            <div class="stats-label" style="font-size: 0.75rem;">Today's Earnings</div>
            <div class="stats-number" style="font-size: 1.75rem; color: var(--accent);">{{ stats.todayEarnings | currency }}</div>
          </div>
        </div>
        <div class="glass-card stats-card" style="padding: 1rem 1.25rem;">
          <div>
            <div class="stats-label" style="font-size: 0.75rem;">Today's Trips</div>
            <div class="stats-number" style="font-size: 1.75rem; color: var(--primary);">{{ stats.todayTripsCount }}</div>
          </div>
        </div>
        <div class="glass-card stats-card" style="padding: 1rem 1.25rem;">
          <div>
            <div class="stats-label" style="font-size: 0.75rem;">Approved Expenses</div>
            <div class="stats-number" style="font-size: 1.75rem; color: var(--danger);">{{ stats.todayExpenses | currency }}</div>
          </div>
        </div>
        <div class="glass-card stats-card" style="padding: 1rem 1.25rem;">
          <div>
            <div class="stats-label" style="font-size: 0.75rem;">Today's Net Profit</div>
            <div class="stats-number" [style.color]="(stats.todayEarnings - stats.todayExpenses) >= 0 ? 'var(--accent)' : 'var(--danger)'" style="font-size: 1.75rem;">
              {{ (stats.todayEarnings - stats.todayExpenses) | currency }}
            </div>
          </div>
        </div>
      </div>

      <!-- Error / Notice Alert -->
      <div *ngIf="errorMsg" class="badge badge-danger" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1.5rem; justify-content: center; text-transform: none; font-size: 0.85rem; text-align: center;">
        {{ errorMsg }}
      </div>

      <!-- Assigned Cab Card -->
      <div class="glass-card" style="margin-bottom: 1.5rem; border-color: var(--primary-glow);" *ngIf="stats && stats.currentCab">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h4 style="margin: 0; color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">ASSIGNED VEHICLE</h4>
            <h2 style="margin: 0.25rem 0 0 0; color: var(--primary);">{{ stats.currentCab.vehicleNumber }}</h2>
            <div style="font-size: 0.9rem; color: var(--text-secondary);">{{ stats.currentCab.make }} {{ stats.currentCab.model }} ({{ stats.currentCab.year }})</div>
          </div>
          <span class="badge badge-success">READY FOR DUTY</span>
        </div>
      </div>

      <div class="glass-card" style="margin-bottom: 1.5rem; border-color: var(--danger-glow);" *ngIf="stats && !stats.currentCab">
        <h4 style="margin: 0; color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">ASSIGNED VEHICLE</h4>
        <h3 style="margin-top: 0.25rem; color: var(--danger);">NO CAB ASSIGNED</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">Please contact the administrator to assign a vehicle to your account before starting trips.</p>
      </div>

      <!-- ACTIVE TRIP HUD -->
      <div class="glass-card" style="margin-bottom: 1.5rem; border-color: var(--accent);" *ngIf="stats && stats.activeTrip">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
          <div>
            <span class="badge badge-warning" style="animation: pulse 1.5s infinite; font-weight: 800; font-size: 0.8rem; padding: 0.35rem 0.75rem; text-transform: none;">🔴 ACTIVE TRIP SHIFT</span>
            <h3 style="margin-top: 0.5rem; font-size: 1.2rem;">Currently Driving: {{ stats.activeTrip.vehicleNumber }}</h3>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.8rem; color: var(--text-secondary);">STARTED AT</div>
            <strong>{{ stats.activeTrip.startTime | date:'shortTime' }}</strong>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; font-size: 0.9rem;">
          <div>
            <span style="color: var(--text-secondary);">Start Location:</span> <strong>{{ stats.activeTrip.startLocation }}</strong>
          </div>
          <div>
            <span style="color: var(--text-secondary);">Start Odometer:</span> <strong>{{ stats.activeTrip.startOdometer }} km</strong>
          </div>
        </div>

        <!-- End/Cancel Trip Action Form -->
        <div style="background: rgba(255, 255, 255, 0.02); padding: 1.25rem; border-radius: 12px; border: 1px solid var(--border-color);">
          <h4 style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.85rem; text-transform: uppercase;">Complete / Cancel Active Trip</h4>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">End Location *</label>
              <input type="text" class="form-control" [(ngModel)]="endTripForm.endLocation" placeholder="e.g. Connaught Place" style="padding: 0.65rem;" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">End Odometer (km) *</label>
              <input type="number" class="form-control" [(ngModel)]="endTripForm.endOdometer" placeholder="Current Odometer" style="padding: 0.65rem;" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Remarks (Optional)</label>
            <input type="text" class="form-control" [(ngModel)]="endTripForm.notes" placeholder="Any remarks on cancellation/completion..." style="padding: 0.65rem;" />
          </div>

          <div style="display: flex; gap: 1rem; justify-content: center;">
            <button class="btn btn-danger" style="flex-grow: 1; padding: 0.85rem;" (click)="cancelActiveTrip()" [disabled]="loading">
              CANCEL TRIP
            </button>
            <button class="btn btn-accent" style="flex-grow: 1; padding: 0.85rem;" (click)="endTrip()" [disabled]="loading">
              {{ loading ? 'COMPLETING...' : 'COMPLETE TRIP' }}
            </button>
          </div>
        </div>
      </div>

      <!-- START / LOG TRIP FORM CONTAINER -->
      <div class="glass-card" style="margin-bottom: 1.5rem;" *ngIf="stats && !stats.activeTrip && stats.currentCab">
        <!-- Tabs Header -->
        <div style="display: flex; gap: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
          <button 
            (click)="activeTab = 'live'" 
            [style.color]="activeTab === 'live' ? 'var(--primary)' : 'var(--text-secondary)'" 
            [style.border-bottom-color]="activeTab === 'live' ? 'var(--primary)' : 'transparent'"
            style="background: transparent; border: none; border-bottom: 2px solid; padding: 0.25rem 0.5rem; font-weight: 700; cursor: pointer; transition: all 0.3s; font-size: 0.95rem; display: flex; align-items: center; gap: 0.35rem;">
            🟢 START LIVE TRIP
          </button>
          <button 
            (click)="activeTab = 'past'" 
            [style.color]="activeTab === 'past' ? 'var(--accent)' : 'var(--text-secondary)'" 
            [style.border-bottom-color]="activeTab === 'past' ? 'var(--accent)' : 'transparent'"
            style="background: transparent; border: none; border-bottom: 2px solid; padding: 0.25rem 0.5rem; font-weight: 700; cursor: pointer; transition: all 0.3s; font-size: 0.95rem; display: flex; align-items: center; gap: 0.35rem;">
            💾 LOG PAST / OFFLINE TRIP
          </button>
        </div>

        <!-- Live Start Form -->
        <div *ngIf="activeTab === 'live'">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Trip ID (provided by vendor) *</label>
              <input type="number" class="form-control" [(ngModel)]="startTripForm.tripId" placeholder="Vendor Trip ID" style="padding: 0.65rem;" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Service Type *</label>
              <select class="form-control" [(ngModel)]="startTripForm.pickupOrDrop" style="padding: 0.65rem; height: auto;">
                <option value="Pickup">Pickup</option>
                <option value="Drop">Drop</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Start Location *</label>
              <input type="text" class="form-control" [(ngModel)]="startTripForm.startLocation" placeholder="e.g. Airport Terminal 3" style="padding: 0.65rem;" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Odometer Reading (km) *</label>
              <input type="number" class="form-control" [(ngModel)]="startTripForm.startOdometer" placeholder="Current Odometer" style="padding: 0.65rem;" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Remarks (Optional)</label>
            <input type="text" class="form-control" [(ngModel)]="startTripForm.notes" placeholder="Any remarks or instructions..." style="padding: 0.65rem;" />
          </div>

          <button class="btn btn-primary" style="width: 100%; padding: 0.85rem;" (click)="startTrip()" [disabled]="loading">
            {{ loading ? 'INITIALIZING SHIFT...' : 'START TRIP' }}
          </button>
        </div>

        <!-- Offline/Past Trip Form -->
        <div *ngIf="activeTab === 'past'">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Trip ID (provided by vendor) *</label>
              <input type="number" class="form-control" [(ngModel)]="pastTripForm.tripId" placeholder="Vendor Trip ID" style="padding: 0.65rem;" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Service Type *</label>
              <select class="form-control" [(ngModel)]="pastTripForm.pickupOrDrop" style="padding: 0.65rem; height: auto;">
                <option value="Pickup">Pickup</option>
                <option value="Drop">Drop</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Start Location *</label>
              <input type="text" class="form-control" [(ngModel)]="pastTripForm.startLocation" placeholder="e.g. Airport Terminal 3" style="padding: 0.65rem;" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">End Location *</label>
              <input type="text" class="form-control" [(ngModel)]="pastTripForm.endLocation" placeholder="e.g. Connaught Place" style="padding: 0.65rem;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Start Odometer Reading *</label>
              <input type="number" class="form-control" [(ngModel)]="pastTripForm.startOdometer" placeholder="e.g. 12050" style="padding: 0.65rem;" />
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">End Odometer Reading *</label>
              <input type="number" class="form-control" [(ngModel)]="pastTripForm.endOdometer" placeholder="e.g. 12080" style="padding: 0.65rem;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Trip Status *</label>
              <select class="form-control" [(ngModel)]="pastTripForm.status" style="padding: 0.65rem; height: auto;">
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.9rem;">Remarks (Optional)</label>
              <input type="text" class="form-control" [(ngModel)]="pastTripForm.notes" placeholder="Any offline/past remarks..." style="padding: 0.65rem;" />
            </div>
          </div>

          <button class="btn btn-accent" style="width: 100%; padding: 0.85rem;" (click)="logPastTrip()" [disabled]="loading">
            {{ loading ? 'SAVING TRIP RECORD...' : 'LOG PAST TRIP' }}
          </button>
        </div>
      </div>

      <!-- ACTIVE TARGETS LIST -->
      <div class="glass-card" *ngIf="targets.length > 0">
        <h3 style="margin-bottom: 1rem;">My Active Goals & Targets</h3>
        <div *ngFor="let tg of targets" style="border-bottom: 1px solid var(--border-color); padding: 0.75rem 0; margin-bottom: 0.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <div>
              <strong style="color: var(--text-primary);">{{ getTargetTypeLabel(tg.targetType) }} {{ getMetricTypeLabel(tg.metricType) }} Target</strong>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">Goal: {{ getFormattedValue(tg.targetValue, tg.metricType) }} (Deadline: {{ tg.endDate | date:'shortDate' }})</div>
            </div>
            <span style="font-weight: 700; color: var(--accent);">{{ tg.currentValue }} / {{ tg.targetValue }}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="flex-grow: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; position: relative;">
              <div [style.width.%]="getProgressPercent(tg.currentValue, tg.targetValue)" style="height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.3s;"></div>
            </div>
            <span style="font-size: 0.8rem; font-weight: 700;">{{ getProgressPercent(tg.currentValue, tg.targetValue) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Spinner -->
    <div *ngIf="!stats" style="display: flex; align-items: center; justify-content: center; height: 50vh; flex-direction: column; gap: 1rem;">
      <div style="border: 4px solid var(--border-color); border-top-color: var(--accent); width: 35px; height: 35px; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="color: var(--text-secondary);">Connecting Driver HUD...</p>
    </div>

    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
    </style>
  `
})
export class DriverDashboardComponent implements OnInit {
  stats: any = null;
  targets: any[] = [];
  loading = false;
  errorMsg = '';
  activeTab: 'live' | 'past' = 'live';

  startTripForm: {
    tripId: number | null;
    startLocation: string;
    startOdometer: number | null;
    pickupOrDrop: string;
    notes: string;
  } = {
    tripId: null,
    startLocation: '',
    startOdometer: null,
    pickupOrDrop: 'Pickup',
    notes: ''
  };

  endTripForm: {
    endLocation: string;
    endOdometer: number | null;
    notes: string;
  } = {
    endLocation: '',
    endOdometer: null,
    notes: ''
  };

  pastTripForm: {
    tripId: number | null;
    startLocation: string;
    endLocation: string;
    startOdometer: number | null;
    endOdometer: number | null;
    pickupOrDrop: string;
    status: string;
    notes: string;
  } = {
    tripId: null,
    startLocation: '',
    endLocation: '',
    startOdometer: null,
    endOdometer: null,
    pickupOrDrop: 'Pickup',
    status: 'Completed',
    notes: ''
  };

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit() {
    this.loadDriverData();
  }

  loadDriverData() {
    this.apiService.getDashboardAnalytics().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats = res.data;

          if (this.stats.currentCab) {
            this.startTripForm.startOdometer = 12050; // Prefill fallback odometer
            this.pastTripForm.startOdometer = 12050; // Prefill fallback start odometer
            this.pastTripForm.endOdometer = 12065; // Prefill fallback end odometer
          }

          if (this.stats.activeTrip) {
            this.endTripForm.endOdometer = this.stats.activeTrip.startOdometer + 15; // Prefill fallback end odometer
          }
          
          // Load active targets for driver
          const driverId = this.authService.getDriverId();
          if (driverId) {
            this.apiService.getTargets(driverId).subscribe({
              next: (tRes) => {
                if (tRes.success) {
                  this.targets = tRes.data.filter((t: any) => t.status === 0); // Active only
                }
              }
            });
          }
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to fetch driver HUD data.';
      }
    });
  }

  startTrip() {
    if (!this.startTripForm.tripId) {
      this.errorMsg = 'Please input manual Trip ID.';
      return;
    }
    if (!this.startTripForm.pickupOrDrop) {
      this.errorMsg = 'Please select service type (Pickup/Drop).';
      return;
    }
    if (!this.startTripForm.startLocation) {
      this.errorMsg = 'Please specify Start Location.';
      return;
    }
    if (!this.startTripForm.startOdometer || this.startTripForm.startOdometer <= 0) {
      this.errorMsg = 'Please specify a valid Start Odometer reading.';
      return;
    }
    
    this.loading = true;
    this.errorMsg = '';

    const payload = {
      tripId: this.startTripForm.tripId ? parseInt(this.startTripForm.tripId.toString(), 10) : 0,
      cabId: this.stats.currentCab.id,
      startOdometer: this.startTripForm.startOdometer ? parseInt(this.startTripForm.startOdometer.toString(), 10) : 0,
      startLocation: this.startTripForm.startLocation,
      pickupOrDrop: this.startTripForm.pickupOrDrop,
      notes: this.startTripForm.notes
    };

    this.apiService.startTrip(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.startTripForm = {
          tripId: null,
          startLocation: '',
          startOdometer: null,
          pickupOrDrop: 'Pickup',
          notes: ''
        };
        this.loadDriverData();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Error starting trip.';
      }
    });
  }

  endTrip() {
    if (!this.stats || !this.stats.activeTrip) return;

    if (!this.endTripForm.endLocation) {
      this.errorMsg = 'Please specify End Location.';
      return;
    }

    if (!this.endTripForm.endOdometer || this.endTripForm.endOdometer <= 0) {
      this.errorMsg = 'Please enter a valid End Odometer reading.';
      return;
    }

    if (this.endTripForm.endOdometer < this.stats.activeTrip.startOdometer) {
      this.errorMsg = `End odometer must be greater than or equal to start odometer (${this.stats.activeTrip.startOdometer}).`;
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const payload = {
      endOdometer: parseInt(this.endTripForm.endOdometer.toString(), 10),
      endLocation: this.endTripForm.endLocation,
      fuelConsumed: 0,
      fareAmount: 0,
      tollAmount: 0,
      notes: this.endTripForm.notes
    };

    this.apiService.endTrip(this.stats.activeTrip.id, payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.endTripForm = {
          endLocation: '',
          endOdometer: null,
          notes: ''
        };
        this.loadDriverData();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Error ending trip.';
      }
    });
  }

  logPastTrip() {
    if (!this.pastTripForm.tripId) {
      this.errorMsg = 'Please input manual Trip ID.';
      return;
    }
    if (!this.pastTripForm.pickupOrDrop) {
      this.errorMsg = 'Please select service type (Pickup/Drop).';
      return;
    }
    if (!this.pastTripForm.startLocation) {
      this.errorMsg = 'Please specify Start Location.';
      return;
    }
    if (!this.pastTripForm.endLocation) {
      this.errorMsg = 'Please specify End Location.';
      return;
    }
    if (!this.pastTripForm.startOdometer || this.pastTripForm.startOdometer <= 0) {
      this.errorMsg = 'Please specify a valid Start Odometer reading.';
      return;
    }
    if (!this.pastTripForm.endOdometer || this.pastTripForm.endOdometer <= 0) {
      this.errorMsg = 'Please specify a valid End Odometer reading.';
      return;
    }
    if (this.pastTripForm.endOdometer < this.pastTripForm.startOdometer) {
      this.errorMsg = 'End Odometer reading cannot be less than Start Odometer reading.';
      return;
    }
    if (!this.pastTripForm.status) {
      this.errorMsg = 'Please select Trip Status.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const payload = {
      tripId: this.pastTripForm.tripId ? parseInt(this.pastTripForm.tripId.toString(), 10) : 0,
      cabId: this.stats.currentCab.id,
      startLocation: this.pastTripForm.startLocation,
      endLocation: this.pastTripForm.endLocation,
      startOdometer: this.pastTripForm.startOdometer ? parseInt(this.pastTripForm.startOdometer.toString(), 10) : 0,
      endOdometer: this.pastTripForm.endOdometer ? parseInt(this.pastTripForm.endOdometer.toString(), 10) : 0,
      pickupOrDrop: this.pastTripForm.pickupOrDrop,
      status: this.pastTripForm.status,
      notes: this.pastTripForm.notes
    };

    this.apiService.logPastTrip(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.pastTripForm = {
          tripId: null,
          startLocation: '',
          endLocation: '',
          startOdometer: null,
          endOdometer: null,
          pickupOrDrop: 'Pickup',
          status: 'Completed',
          notes: ''
        };
        this.loadDriverData();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Error logging past trip.';
      }
    });
  }

  getTargetTypeLabel(type: number): string {
    switch (type) {
      case 0: return 'Daily';
      case 1: return 'Weekly';
      case 2: return 'Monthly';
      default: return 'Custom';
    }
  }

  getMetricTypeLabel(metric: number): string {
    switch (metric) {
      case 0: return 'Trips';
      case 1: return 'Earnings';
      case 2: return 'Hours';
      default: return 'Other';
    }
  }

  getFormattedValue(val: number, metric: number): string {
    if (metric === 1) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    } else if (metric === 2) {
      return `${val} hrs`;
    }
    return `${val} trips`;
  }

  getProgressPercent(current: number, target: number): number {
    if (!target) return 0;
    const pct = Math.round((current / target) * 100);
    return Math.min(pct, 100);
  }

  cancelActiveTrip() {
    if (!this.stats || !this.stats.activeTrip) return;
    const tripId = this.stats.activeTrip.id;

    if (!this.endTripForm.endLocation) {
      this.errorMsg = 'Please specify End Location before cancelling.';
      return;
    }

    if (!this.endTripForm.endOdometer || this.endTripForm.endOdometer <= 0) {
      this.errorMsg = 'Please enter a valid End Odometer reading before cancelling.';
      return;
    }

    if (this.endTripForm.endOdometer < this.stats.activeTrip.startOdometer) {
      this.errorMsg = `End odometer must be greater than or equal to start odometer (${this.stats.activeTrip.startOdometer}) before cancelling.`;
      return;
    }

    if (confirm(`Are you sure you want to cancel Trip #${tripId}?`)) {
      this.loading = true;
      this.errorMsg = '';

      const payload = {
        endOdometer: parseInt(this.endTripForm.endOdometer.toString(), 10),
        endLocation: this.endTripForm.endLocation,
        notes: this.endTripForm.notes
      };

      this.apiService.cancelTrip(tripId, payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.endTripForm = {
            endLocation: '',
            endOdometer: null,
            notes: ''
          };
          this.loadDriverData();
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err.error?.message || 'Error cancelling active trip.';
        }
      });
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Scheduled';
      case 1: return 'Active';
      case 2: return 'Completed';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  }
}
