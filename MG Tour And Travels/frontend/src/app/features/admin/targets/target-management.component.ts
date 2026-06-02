import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-target-management',
  template: `
    <div class="fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1>Driver Target Tracking</h1>
          <p style="color: var(--text-secondary);">Configure and monitor goals for active driver shifts</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          <span>+</span> ASSIGN NEW TARGET
        </button>
      </div>

      <!-- Targets Table -->
      <div class="table-container glass-card" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Goal Type</th>
              <th>Metric Type</th>
              <th>Target Value</th>
              <th>Current Value</th>
              <th>Progress</th>
              <th>Timeframe</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
            <!-- Column-specific filters -->
            <tr style="background: rgba(255,255,255,0.01);">
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Driver..." [(ngModel)]="filters.driverName" (input)="applyFilters()" />
              </td>
              <td>
                <select class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" [(ngModel)]="filters.targetType" (change)="applyFilters()">
                  <option value="">All</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </td>
              <td>
                <select class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" [(ngModel)]="filters.metricType" (change)="applyFilters()">
                  <option value="">All</option>
                  <option value="Trips">Trips</option>
                  <option value="Earnings">Earnings</option>
                  <option value="Hours">Hours</option>
                </select>
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Target..." [(ngModel)]="filters.targetValue" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Current..." [(ngModel)]="filters.currentValue" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter %..." [(ngModel)]="filters.progress" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Date..." [(ngModel)]="filters.timeframe" (input)="applyFilters()" />
              </td>
              <td>
                <select class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" [(ngModel)]="filters.status" (change)="applyFilters()">
                  <option value="">All</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
              </td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="targets.length === 0">
              <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                No targets assigned matching search filters.
              </td>
            </tr>
            <tr *ngFor="let tg of targets">
              <td><strong>{{ tg.driverName }}</strong></td>
              <td>{{ getTargetTypeLabel(tg.targetType) }}</td>
              <td>{{ getMetricTypeLabel(tg.metricType) }}</td>
              <td><strong>{{ getFormattedValue(tg.targetValue, tg.metricType) }}</strong></td>
              <td>{{ getFormattedValue(tg.currentValue, tg.metricType) }}</td>
              <td style="width: 200px;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <div style="flex-grow: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; position: relative;">
                    <div [style.width.%]="getProgressPercent(tg.currentValue, tg.targetValue)" [style.background]="getProgressColor(tg.status)" style="height: 100%; border-radius: 4px; transition: width 0.3s;"></div>
                  </div>
                  <span style="font-size: 0.8rem; font-weight: 700;">{{ getProgressPercent(tg.currentValue, tg.targetValue) }}%</span>
                </div>
              </td>
              <td style="font-size: 0.85rem; color: var(--text-secondary);">
                {{ tg.startDate | date:'shortDate' }} - {{ tg.endDate | date:'shortDate' }}
              </td>
              <td>
                <span class="badge" [class.badge-warning]="tg.status === 0" [class.badge-success]="tg.status === 1" [class.badge-danger]="tg.status === 2">
                  {{ getStatusLabel(tg.status) }}
                </span>
              </td>
              <td style="text-align: right; display: flex; justify-content: flex-end; gap: 0.5rem;">
                <button class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" (click)="openEditModal(tg)">EDIT</button>
                <button class="btn btn-danger" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" (click)="deleteTarget(tg.id)">REMOVE</button>
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

      <!-- Add/Edit Target Modal -->
      <div *ngIf="showModal" class="modal-overlay">
        <div class="modal-content">
          <h2>{{ isEditMode ? 'Edit Target Goal' : 'Assign Target Goal' }}</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
            {{ isEditMode ? 'Modify target details, timeframe, and status' : 'Assign incentive/operational goal milestones to driver' }}
          </p>

          <div *ngIf="modalError" class="badge badge-danger" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; justify-content: center; text-transform: none; text-align: center;">
            {{ modalError }}
          </div>

          <div class="form-group">
            <label class="form-label">Driver</label>
            <select class="form-control" [(ngModel)]="targetForm.driverId">
              <option *ngFor="let driver of drivers" [value]="driver.id">{{ driver.name }} ({{ driver.phone }})</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Frequency Type</label>
              <select class="form-control" [(ngModel)]="targetForm.targetType">
                <option [value]="0">Daily</option>
                <option [value]="1">Weekly</option>
                <option [value]="2">Monthly</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Metric Type</label>
              <select class="form-control" [(ngModel)]="targetForm.metricType">
                <option [value]="0">Trips Completed</option>
                <option [value]="1">Earnings (Currency)</option>
                <option [value]="2">Shift Hours</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Target Goal Value</label>
            <input type="number" class="form-control" [(ngModel)]="targetForm.targetValue" placeholder="e.g. 10 trips or 500 earnings" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" class="form-control" [(ngModel)]="targetForm.startDate" />
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input type="date" class="form-control" [(ngModel)]="targetForm.endDate" />
            </div>
          </div>

          <div class="form-group" *ngIf="isEditMode">
            <label class="form-label">Status</label>
            <select class="form-control" [(ngModel)]="targetForm.status">
              <option [value]="0">Active</option>
              <option [value]="1">Completed</option>
              <option [value]="2">Failed</option>
            </select>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn btn-secondary" (click)="closeModal()">CANCEL</button>
            <button class="btn btn-primary" (click)="saveTarget()">
              {{ isEditMode ? 'SAVE CHANGES' : 'ASSIGN TARGET' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TargetManagementComponent implements OnInit {
  targets: any[] = [];
  allTargets: any[] = [];
  filteredTargets: any[] = [];
  drivers: any[] = [];

  filters = {
    driverName: '',
    targetType: '',
    metricType: '',
    targetValue: '',
    currentValue: '',
    progress: '',
    timeframe: '',
    status: ''
  };

  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  showModal = false;
  isEditMode = false;
  editingTargetId: number | null = null;
  modalError = '';

  targetForm = {
    driverId: 0,
    targetType: 0,
    metricType: 0,
    targetValue: 0,
    startDate: '',
    endDate: '',
    status: 0
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadTargets();
    this.loadDriversList();
  }

  loadTargets() {
    this.apiService.getTargets().subscribe({
      next: (res) => {
        if (res.success) {
          this.allTargets = res.data;
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Error loading targets', err);
      }
    });
  }

  applyFilters() {
    this.filteredTargets = this.allTargets.filter(tg => {
      const matchDriver = !this.filters.driverName || tg.driverName.toLowerCase().includes(this.filters.driverName.toLowerCase());
      
      const typeLabel = this.getTargetTypeLabel(tg.targetType);
      const matchType = !this.filters.targetType || typeLabel.toLowerCase() === this.filters.targetType.toLowerCase();

      const metricLabel = this.getMetricTypeLabel(tg.metricType);
      const matchMetric = !this.filters.metricType || metricLabel.toLowerCase() === this.filters.metricType.toLowerCase();

      const targetValFormatted = this.getFormattedValue(tg.targetValue, tg.metricType);
      const matchTargetVal = !this.filters.targetValue || targetValFormatted.toLowerCase().includes(this.filters.targetValue.toLowerCase());

      const currentValFormatted = this.getFormattedValue(tg.currentValue, tg.metricType);
      const matchCurrentVal = !this.filters.currentValue || currentValFormatted.toLowerCase().includes(this.filters.currentValue.toLowerCase());

      const progressPercent = this.getProgressPercent(tg.currentValue, tg.targetValue).toString();
      const matchProgress = !this.filters.progress || progressPercent.includes(this.filters.progress);

      const startStr = new Date(tg.startDate).toLocaleDateString().toLowerCase();
      const endStr = new Date(tg.endDate).toLocaleDateString().toLowerCase();
      const matchTimeframe = !this.filters.timeframe || 
        startStr.includes(this.filters.timeframe.toLowerCase()) || 
        endStr.includes(this.filters.timeframe.toLowerCase());

      const statusLabel = this.getStatusLabel(tg.status);
      const matchStatus = !this.filters.status || statusLabel.toLowerCase() === this.filters.status.toLowerCase();

      return matchDriver && matchType && matchMetric && matchTargetVal && matchCurrentVal && matchProgress && matchTimeframe && matchStatus;
    });

    this.totalCount = this.filteredTargets.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
    this.paginate();
  }

  paginate() {
    const startIndex = (this.page - 1) * this.pageSize;
    this.targets = this.filteredTargets.slice(startIndex, startIndex + this.pageSize);
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

  loadDriversList() {
    this.apiService.getDrivers(1, 100, '', '', 'Name', 'asc').subscribe({
      next: (res) => {
        if (res.success) {
          this.drivers = res.data.items;
        }
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

  getProgressColor(status: number): string {
    switch (status) {
      case 1: return 'var(--success)';
      case 2: return 'var(--danger)';
      default: return 'var(--primary)';
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Active';
      case 1: return 'Completed';
      case 2: return 'Failed';
      default: return 'Unknown';
    }
  }

  openAddModal() {
    this.isEditMode = false;
    this.editingTargetId = null;
    this.modalError = '';
    
    // Set default dates (today to next week)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    this.targetForm = {
      driverId: this.drivers.length > 0 ? this.drivers[0].id : 0,
      targetType: 0,
      metricType: 0,
      targetValue: 10,
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
      status: 0
    };
    this.showModal = true;
  }

  formatDateOnly(dateStr: string | null | Date): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  openEditModal(tg: any) {
    this.isEditMode = true;
    this.editingTargetId = tg.id;
    this.modalError = '';
    this.targetForm = {
      driverId: tg.driverId,
      targetType: tg.targetType,
      metricType: tg.metricType,
      targetValue: tg.targetValue,
      startDate: this.formatDateOnly(tg.startDate),
      endDate: this.formatDateOnly(tg.endDate),
      status: tg.status
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.modalError = '';
  }

  saveTarget() {
    if (!this.targetForm.driverId || !this.targetForm.targetValue || !this.targetForm.startDate || !this.targetForm.endDate) {
      this.modalError = 'Please specify driver, target value, and dates.';
      return;
    }

    const payload = {
      driverId: parseInt(this.targetForm.driverId.toString(), 10),
      targetType: parseInt(this.targetForm.targetType.toString(), 10),
      metricType: parseInt(this.targetForm.metricType.toString(), 10),
      targetValue: parseFloat(this.targetForm.targetValue.toString()),
      startDate: new Date(this.targetForm.startDate).toISOString(),
      endDate: new Date(this.targetForm.endDate).toISOString(),
      status: parseInt(this.targetForm.status.toString(), 10)
    };

    if (this.isEditMode && this.editingTargetId) {
      this.apiService.updateTarget(this.editingTargetId, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModal();
            this.loadTargets();
          } else {
            this.modalError = res.message || 'Failed to update target.';
          }
        },
        error: (err) => {
          this.modalError = err.error?.message || 'Server error updating target.';
        }
      });
    } else {
      this.apiService.createTarget(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModal();
            this.loadTargets();
          } else {
            this.modalError = res.message || 'Failed to create target.';
          }
        },
        error: (err) => {
          this.modalError = err.error?.message || 'Server error creating target.';
        }
      });
    }
  }

  deleteTarget(id: number) {
    if (confirm('Are you sure you want to remove this target?')) {
      this.apiService.deleteTarget(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadTargets();
          }
        }
      });
    }
  }
}
