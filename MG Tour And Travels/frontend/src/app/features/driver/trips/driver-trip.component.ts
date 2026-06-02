import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-driver-trip',
  template: `
    <div class="fade-in">
      <div style="margin-bottom: 2rem;">
        <h1>My Trip Logs</h1>
        <p style="color: var(--text-secondary);">Timeline of your shift completions, distances, and earned passenger fares</p>
      </div>

      <div class="table-container glass-card" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vehicle</th>
              <th>Route</th>
              <th>Odometer (Start ➜ End)</th>
              <th>Fare Earned</th>
              <th>Status</th>
            </tr>
            <!-- Column-specific filters -->
            <tr style="background: rgba(255,255,255,0.01);">
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Date..." [(ngModel)]="filters.date" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Plate..." [(ngModel)]="filters.vehicleNumber" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Route..." [(ngModel)]="filters.route" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Odo..." [(ngModel)]="filters.odometer" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Fare..." [(ngModel)]="filters.fareAmount" (input)="applyFilters()" />
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
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="trips.length === 0">
              <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                No trips matching search filters.
              </td>
            </tr>
            <tr *ngFor="let trip of trips">
              <td>{{ trip.startTime | date:'mediumDate' }}</td>
              <td><code>{{ trip.vehicleNumber }}</code></td>
              <td>
                <div style="font-weight: 600;">{{ trip.startLocation }} ➜ {{ trip.endLocation || '...' }}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Start: {{ trip.startTime | date:'shortTime' }}</div>
              </td>
              <td>
                {{ trip.startOdometer }} ➜ {{ trip.endOdometer || '...' }}
                <div style="font-size: 0.75rem; color: var(--text-secondary);" *ngIf="trip.endOdometer">
                  Distance: {{ trip.endOdometer - trip.startOdometer }} km
                </div>
              </td>
              <td style="color: var(--accent); font-weight: 700;">{{ trip.fareAmount | currency }}</td>
              <td>
                <span class="badge" [class.badge-info]="trip.status === 1" [class.badge-success]="trip.status === 2" [class.badge-danger]="trip.status === 3">
                  {{ getStatusLabel(trip.status) }}
                </span>
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
    </div>
  `
})
export class DriverTripComponent implements OnInit {
  trips: any[] = [];
  allTrips: any[] = [];
  filteredTrips: any[] = [];

  filters = {
    date: '',
    vehicleNumber: '',
    route: '',
    odometer: '',
    fareAmount: '',
    status: ''
  };

  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit() {
    this.loadDriverTrips();
  }

  loadDriverTrips() {
    const driverId = this.authService.getDriverId();
    if (driverId) {
      this.apiService.getTrips(1, 1000, '', driverId).subscribe({
        next: (res) => {
          if (res.success) {
            this.allTrips = res.data.items;
            this.applyFilters();
          }
        }
      });
    }
  }

  applyFilters() {
    this.filteredTrips = this.allTrips.filter(trip => {
      const matchDate = !this.filters.date || 
        new Date(trip.startTime).toLocaleDateString().toLowerCase().includes(this.filters.date.toLowerCase());

      const matchVehicle = !this.filters.vehicleNumber || trip.vehicleNumber.toLowerCase().includes(this.filters.vehicleNumber.toLowerCase());

      const routeStr = `${trip.startLocation} to ${trip.endLocation || ''}`;
      const matchRoute = !this.filters.route || routeStr.toLowerCase().includes(this.filters.route.toLowerCase());

      const matchOdo = !this.filters.odometer || 
        trip.startOdometer.toString().includes(this.filters.odometer) ||
        (trip.endOdometer && trip.endOdometer.toString().includes(this.filters.odometer));

      const matchFare = !this.filters.fareAmount || 
        (trip.fareAmount && trip.fareAmount.toString().includes(this.filters.fareAmount));

      const statusLabel = this.getStatusLabel(trip.status);
      const matchStatus = !this.filters.status || statusLabel.toLowerCase() === this.filters.status.toLowerCase();

      return matchDate && matchVehicle && matchRoute && matchOdo && matchFare && matchStatus;
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
}
