import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-trip-management',
  template: `
    <div class="fade-in">
      <div style="margin-bottom: 2rem;">
        <h1>Trips Ledger</h1>
        <p style="color: var(--text-secondary);">Monitor active trips, odometer values, and historical passenger fares</p>
      </div>

      <!-- Filters -->
      <div class="glass-card" style="margin-bottom: 1.5rem; padding: 1rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div style="flex-grow: 1; min-width: 200px;">
          <select class="form-control" [(ngModel)]="statusFilter" (change)="loadTrips()">
            <option value="">All Trip Statuses</option>
            <option value="Active">Active Shifts</option>
            <option value="Completed">Completed Trips</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container glass-card" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Cab Plate</th>
              <th>Driver</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Odometer (Start ➜ End)</th>
              <th>Financials</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
            <!-- Column-specific filters -->
            <tr style="background: rgba(255,255,255,0.01);">
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter ID..." [(ngModel)]="filters.id" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Plate..." [(ngModel)]="filters.vehicleNumber" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Driver..." [(ngModel)]="filters.driverName" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Start..." [(ngModel)]="filters.startTime" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter End..." [(ngModel)]="filters.endTime" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Odo..." [(ngModel)]="filters.odometer" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Cost..." [(ngModel)]="filters.financials" (input)="applyFilters()" />
              </td>
              <td>
                <select class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" [(ngModel)]="filters.status" (change)="applyFilters()">
                  <option value="">All</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="trips.length === 0">
              <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                No trips matching search filters.
              </td>
            </tr>
            <tr *ngFor="let trip of trips">
              <td><strong>#{{ trip.id }}</strong></td>
              <td><code>{{ trip.vehicleNumber }}</code></td>
              <td>{{ trip.driverName }}</td>
              <td>{{ trip.startTime | date:'short' }}</td>
              <td>{{ trip.endTime ? (trip.endTime | date:'short') : 'Ongoing...' }}</td>
              <td>
                {{ trip.startOdometer }} ➜ {{ trip.endOdometer || '...' }}
                <div style="font-size: 0.75rem; color: var(--text-secondary);" *ngIf="trip.endOdometer">
                  Distance: {{ trip.endOdometer - trip.startOdometer }} km
                </div>
              </td>
              <td>
                <div *ngIf="trip.fareAmount">Fare: <strong>{{ trip.fareAmount | currency }}</strong></div>
                <div *ngIf="trip.tollAmount" style="font-size: 0.8rem; color: var(--text-secondary);">Tolls: {{ trip.tollAmount | currency }}</div>
              </td>
              <td>
                <span class="badge" [class.badge-info]="trip.status === 1" [class.badge-success]="trip.status === 2" [class.badge-danger]="trip.status === 3">
                  {{ getStatusLabel(trip.status) }}
                </span>
              </td>
              <td style="text-align: right;">
                <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="openEditModal(trip)">EDIT</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; color: var(--text-secondary); font-size: 0.9rem;">
        <div>
          Showing page {{ page }} of {{ totalPages }} ({{ totalCount }} total items)
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" [disabled]="page === 1" (click)="prevPage()">PREVIOUS</button>
          <button class="btn btn-secondary" [disabled]="page === totalPages" (click)="nextPage()">NEXT</button>
        </div>
      </div>

      <!-- Edit Trip Modal -->
      <div *ngIf="showEditModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <h2>Edit Trip Details</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Update trip logs, financial data, and driver allocations. Recalculates earnings and targets automatically.
          </p>

          <div *ngIf="modalError" class="badge badge-danger" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; justify-content: center; text-transform: none; text-align: center;">
            {{ modalError }}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Cab</label>
              <select class="form-control" [(ngModel)]="tripForm.cabId">
                <option value="" disabled>-- Select Cab --</option>
                <option *ngFor="let cab of cabsList" [value]="cab.id">
                  {{ cab.vehicleNumber }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Driver</label>
              <select class="form-control" [(ngModel)]="tripForm.driverId">
                <option value="" disabled>-- Select Driver --</option>
                <option *ngFor="let driver of driversList" [value]="driver.id">
                  {{ driver.name }}
                </option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Start Location</label>
              <input type="text" class="form-control" [(ngModel)]="tripForm.startLocation" />
            </div>
            <div class="form-group">
              <label class="form-label">End Location</label>
              <input type="text" class="form-control" [(ngModel)]="tripForm.endLocation" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Start Odometer</label>
              <input type="number" class="form-control" [(ngModel)]="tripForm.startOdometer" />
            </div>
            <div class="form-group">
              <label class="form-label">End Odometer</label>
              <input type="number" class="form-control" [(ngModel)]="tripForm.endOdometer" placeholder="Ongoing" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Start Time</label>
              <input type="datetime-local" class="form-control" [(ngModel)]="tripForm.startTime" />
            </div>
            <div class="form-group">
              <label class="form-label">End Time</label>
              <input type="datetime-local" class="form-control" [(ngModel)]="tripForm.endTime" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Pickup / Drop</label>
              <select class="form-control" [(ngModel)]="tripForm.pickupOrDrop">
                <option value="Pickup">Pickup</option>
                <option value="Drop">Drop</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" [(ngModel)]="tripForm.status">
                <option [value]="0">Scheduled</option>
                <option [value]="1">Active</option>
                <option [value]="2">Completed</option>
                <option [value]="3">Cancelled</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Fare Amount (₹)</label>
              <input type="number" class="form-control" [(ngModel)]="tripForm.fareAmount" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">Toll Amount (₹)</label>
              <input type="number" class="form-control" [(ngModel)]="tripForm.tollAmount" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label class="form-label">Fuel Consumed (L)</label>
              <input type="number" class="form-control" [(ngModel)]="tripForm.fuelConsumed" placeholder="0.00" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Notes / Remarks</label>
            <textarea class="form-control" [(ngModel)]="tripForm.notes" rows="2" placeholder="Trip remarks..."></textarea>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn btn-secondary" (click)="closeEditModal()" [disabled]="loading">CANCEL</button>
            <button class="btn btn-primary" (click)="saveTrip()" [disabled]="loading">
              {{ loading ? 'SAVING...' : 'SAVE CHANGES' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TripManagementComponent implements OnInit {
  trips: any[] = [];
  allTrips: any[] = [];
  filteredTrips: any[] = [];
  statusFilter = '';

  filters = {
    id: '',
    vehicleNumber: '',
    driverName: '',
    startTime: '',
    endTime: '',
    odometer: '',
    financials: '',
    status: ''
  };

  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  showEditModal = false;
  editingTripId: number | null = null;
  loading = false;
  modalError = '';
  cabsList: any[] = [];
  driversList: any[] = [];

  tripForm = {
    cabId: '',
    driverId: '',
    startTime: '',
    endTime: '',
    startOdometer: 0,
    endOdometer: null as number | null,
    startLocation: '',
    endLocation: '',
    pickupOrDrop: 'Pickup',
    status: 1,
    fuelConsumed: null as number | null,
    fareAmount: null as number | null,
    tollAmount: null as number | null,
    notes: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadTrips();
    this.loadCabs();
    this.loadDrivers();
  }

  loadCabs() {
    this.apiService.getCabs(1, 1000, '', 'vehicleNumber', 'asc').subscribe({
      next: (res) => {
        if (res.success) this.cabsList = res.data.items;
      }
    });
  }

  loadDrivers() {
    this.apiService.getDrivers(1, 1000, '', '', 'name', 'asc').subscribe({
      next: (res) => {
        if (res.success) this.driversList = res.data.items;
      }
    });
  }

  loadTrips() {
    this.apiService.getTrips(1, 1000, this.statusFilter).subscribe({
      next: (res) => {
        if (res.success) {
          this.allTrips = res.data.items;
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Error loading trips', err);
      }
    });
  }

  applyFilters() {
    this.filteredTrips = this.allTrips.filter(trip => {
      const matchId = !this.filters.id || trip.id.toString().includes(this.filters.id);
      const matchVehicle = !this.filters.vehicleNumber || trip.vehicleNumber.toLowerCase().includes(this.filters.vehicleNumber.toLowerCase());
      const matchDriver = !this.filters.driverName || trip.driverName.toLowerCase().includes(this.filters.driverName.toLowerCase());
      
      const matchStart = !this.filters.startTime || 
        new Date(trip.startTime).toLocaleDateString().toLowerCase().includes(this.filters.startTime.toLowerCase()) ||
        new Date(trip.startTime).toLocaleTimeString().toLowerCase().includes(this.filters.startTime.toLowerCase());
      
      const matchEnd = !this.filters.endTime || 
        (trip.endTime ? (new Date(trip.endTime).toLocaleDateString().toLowerCase().includes(this.filters.endTime.toLowerCase()) ||
                         new Date(trip.endTime).toLocaleTimeString().toLowerCase().includes(this.filters.endTime.toLowerCase()))
                      : 'ongoing'.includes(this.filters.endTime.toLowerCase()));

      const matchOdo = !this.filters.odometer || 
        trip.startOdometer.toString().includes(this.filters.odometer) ||
        (trip.endOdometer && trip.endOdometer.toString().includes(this.filters.odometer));

      const matchFinancials = !this.filters.financials ||
        (trip.fareAmount && trip.fareAmount.toString().includes(this.filters.financials)) ||
        (trip.tollAmount && trip.tollAmount.toString().includes(this.filters.financials));

      let statusLabel = this.getStatusLabel(trip.status);
      const matchStatus = !this.filters.status || statusLabel.toLowerCase() === this.filters.status.toLowerCase();

      return matchId && matchVehicle && matchDriver && matchStart && matchEnd && matchOdo && matchFinancials && matchStatus;
    });

    this.totalCount = this.filteredTrips.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
    this.paginate();
  }

  paginate() {
    const startIndex = (this.page - 1) * this.pageSize;
    this.trips = this.filteredTrips.slice(startIndex, startIndex + this.pageSize);
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.paginate();
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.paginate();
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

  formatDateTimeLocal(dateStr: string | null | Date): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  }

  openEditModal(trip: any) {
    this.editingTripId = trip.id;
    this.modalError = '';
    this.tripForm = {
      cabId: trip.cabId ? trip.cabId.toString() : '',
      driverId: trip.driverId ? trip.driverId.toString() : '',
      startTime: this.formatDateTimeLocal(trip.startTime),
      endTime: this.formatDateTimeLocal(trip.endTime),
      startOdometer: trip.startOdometer,
      endOdometer: trip.endOdometer,
      startLocation: trip.startLocation || '',
      endLocation: trip.endLocation || '',
      pickupOrDrop: trip.pickupOrDrop || 'Pickup',
      status: trip.status,
      fuelConsumed: trip.fuelConsumed,
      fareAmount: trip.fareAmount,
      tollAmount: trip.tollAmount,
      notes: trip.notes || ''
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingTripId = null;
    this.modalError = '';
  }

  saveTrip() {
    if (!this.tripForm.cabId || !this.tripForm.driverId) {
      this.modalError = 'Please select a cab and a driver.';
      return;
    }
    if (!this.tripForm.startLocation || this.tripForm.startOdometer <= 0) {
      this.modalError = 'Please input start location and valid start odometer.';
      return;
    }
    if (!this.tripForm.startTime) {
      this.modalError = 'Please select a start time.';
      return;
    }

    this.loading = true;
    this.modalError = '';

    const payload = {
      cabId: parseInt(this.tripForm.cabId.toString(), 10),
      driverId: parseInt(this.tripForm.driverId.toString(), 10),
      startTime: new Date(this.tripForm.startTime).toISOString(),
      endTime: this.tripForm.endTime ? new Date(this.tripForm.endTime).toISOString() : null,
      startOdometer: parseInt(this.tripForm.startOdometer.toString(), 10),
      endOdometer: this.tripForm.endOdometer ? parseInt(this.tripForm.endOdometer.toString(), 10) : null,
      startLocation: this.tripForm.startLocation,
      endLocation: this.tripForm.endLocation,
      pickupOrDrop: this.tripForm.pickupOrDrop,
      status: parseInt(this.tripForm.status.toString(), 10),
      fuelConsumed: this.tripForm.fuelConsumed ? parseFloat(this.tripForm.fuelConsumed.toString()) : null,
      fareAmount: this.tripForm.fareAmount ? parseFloat(this.tripForm.fareAmount.toString()) : null,
      tollAmount: this.tripForm.tollAmount ? parseFloat(this.tripForm.tollAmount.toString()) : null,
      notes: this.tripForm.notes
    };

    if (this.editingTripId) {
      this.apiService.updateTrip(this.editingTripId, payload).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.closeEditModal();
            this.loadTrips();
          } else {
            this.modalError = res.message || 'Failed to update trip.';
          }
        },
        error: (err) => {
          this.loading = false;
          this.modalError = this.getErrorMessage(err);
        }
      });
    }
  }

  getErrorMessage(err: any): string {
    if (err.error) {
      if (typeof err.error === 'string') return err.error;
      if (err.error.message) return err.error.message;
      if (err.error.errors) {
        const messages: string[] = [];
        for (const key of Object.keys(err.error.errors)) {
          const val = err.error.errors[key];
          if (Array.isArray(val)) {
            messages.push(...val);
          } else {
            messages.push(val);
          }
        }
        if (messages.length > 0) return messages.join(' ');
      }
      if (err.error.title) return err.error.title;
    }
    return err.message || 'Server error updating trip.';
  }
}
