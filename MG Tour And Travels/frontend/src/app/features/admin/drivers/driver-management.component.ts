import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-driver-management',
  template: `
    <div class="fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1>Driver Management</h1>
          <p style="color: var(--text-secondary);">Manage company drivers, license details, and cab assignments</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          <span>+</span> ADD NEW DRIVER
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="glass-card" style="margin-bottom: 1.5rem; padding: 1rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div style="flex-grow: 1; min-width: 200px;">
          <input type="text" class="form-control" placeholder="Search by Name, Phone, License..." [(ngModel)]="searchQuery" (input)="onSearch()" />
        </div>
        <div style="width: 200px;">
          <select class="form-control" [(ngModel)]="verificationFilter" (change)="loadDrivers()">
            <option value="">All Verification Statuses</option>
            <option value="Pending">Pending Verification</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Drivers Table -->
      <div class="table-container glass-card" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>Contact Details</th>
              <th>Salary</th>
              <th>Assigned Cab</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
            <!-- Column-specific filters -->
            <tr style="background: rgba(255,255,255,0.01);">
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Name..." [(ngModel)]="filters.name" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Phone/Email..." [(ngModel)]="filters.phoneEmail" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Salary..." [(ngModel)]="filters.salary" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Cab..." [(ngModel)]="filters.assignedCab" (input)="applyFilters()" />
              </td>
              <td>
                <select class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" [(ngModel)]="filters.status" (change)="applyFilters()">
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="drivers.length === 0">
              <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                No drivers registered yet or matching criteria.
              </td>
            </tr>
            <tr *ngFor="let driver of drivers">
              <td><strong>{{ driver.name }}</strong></td>
              <td>
                <div style="font-size: 0.9rem;">{{ driver.phone }}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">{{ driver.email || 'N/A' }}</div>
              </td>
              <td style="color: var(--text-primary); font-weight: 700;">{{ driver.salary | currency }}</td>
              <td>
                <button class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" (click)="openAssignModal(driver)">
                  {{ driver.currentCabVehicleNumber || 'ASSIGN CAB' }}
                </button>
              </td>
              <td>
                <span class="badge" [class.badge-warning]="driver.verificationStatus === 0" [class.badge-success]="driver.verificationStatus === 1" [class.badge-danger]="driver.verificationStatus === 2">
                  {{ getStatusLabel(driver.verificationStatus) }}
                </span>
              </td>
              <td style="text-align: right; display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center; height: 100%;">
                <button *ngIf="driver.verificationStatus === 0" class="btn btn-accent" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="verifyDriver(driver.id, 'Approved')">APPROVE</button>
                <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="openEditModal(driver)">EDIT</button>
                <button class="btn btn-danger" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="deleteDriver(driver.id)">DELETE</button>
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

      <!-- Add Driver Modal -->
      <div *ngIf="showAddModal" class="modal-overlay">
        <div class="modal-content">
          <h2>Create Driver Profile</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Registers login account and logs physical metadata
          </p>

          <div *ngIf="modalError" class="badge badge-danger" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; justify-content: center; text-transform: none; text-align: center;">
            {{ modalError }}
          </div>

          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-control" [(ngModel)]="driverForm.name" placeholder="e.g. Ramesh Kumar" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Phone Number (Login Key)</label>
              <input type="tel" class="form-control" [(ngModel)]="driverForm.phone" placeholder="e.g. 9876543210" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-control" [(ngModel)]="driverForm.email" placeholder="e.g. ramesh@gmail.com" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Salary (₹ / month)</label>
              <input type="number" class="form-control" [(ngModel)]="driverForm.salary" placeholder="e.g. 25000" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Physical Address</label>
            <textarea class="form-control" [(ngModel)]="driverForm.address" placeholder="Residential location..." rows="2" style="resize: none;"></textarea>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn btn-secondary" (click)="closeModals()">CANCEL</button>
            <button class="btn btn-primary" (click)="saveDriver()">REGISTER DRIVER</button>
          </div>
        </div>
      </div>

      <!-- Edit Driver Modal -->
      <div *ngIf="showEditModal" class="modal-overlay">
        <div class="modal-content">
          <h2>Update Driver Details</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Modify pre-registered details and verification states
          </p>

          <div *ngIf="modalError" class="badge badge-danger" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; justify-content: center; text-transform: none; text-align: center;">
            {{ modalError }}
          </div>

          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-control" [(ngModel)]="editForm.name" placeholder="e.g. Ramesh Kumar" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Phone Number (Login Key)</label>
              <input type="tel" class="form-control" [(ngModel)]="editForm.phone" placeholder="e.g. 9876543210" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-control" [(ngModel)]="editForm.email" placeholder="e.g. ramesh@gmail.com" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Salary (₹ / month)</label>
            <input type="number" class="form-control" [(ngModel)]="editForm.salary" />
          </div>

          <div class="form-group">
            <label class="form-label">Physical Address</label>
            <textarea class="form-control" [(ngModel)]="editForm.address" rows="2" style="resize: none;"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Verification Status</label>
            <select class="form-control" [(ngModel)]="editForm.verificationStatus">
              <option [value]="0">Pending</option>
              <option [value]="1">Approved</option>
              <option [value]="2">Rejected</option>
            </select>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn btn-secondary" (click)="closeModals()">CANCEL</button>
            <button class="btn btn-primary" (click)="updateDriver()">UPDATE DRIVER</button>
          </div>
        </div>
      </div>

      <!-- Assign Cab Modal -->
      <div *ngIf="showAssignModal" class="modal-overlay">
        <div class="modal-content">
          <h2>Assign Cab to Driver</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Link vehicle to driver: <strong>{{ activeDriverName }}</strong>
          </p>

          <div class="form-group">
            <label class="form-label">Select Cab</label>
            <select class="form-control" [(ngModel)]="selectedCabId">
              <option [value]="null">No Cab (Unassign)</option>
              <option *ngFor="let cab of availableCabs" [value]="cab.id">
                {{ cab.vehicleNumber }} ({{ cab.make }} {{ cab.model }})
              </option>
            </select>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn btn-secondary" (click)="closeModals()">CANCEL</button>
            <button class="btn btn-primary" (click)="saveAssignCab()">SAVE ASSIGNMENT</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DriverManagementComponent implements OnInit {
  drivers: any[] = [];
  allDrivers: any[] = [];
  filteredDrivers: any[] = [];
  availableCabs: any[] = [];
  searchQuery = '';
  verificationFilter = '';

  filters = {
    name: '',
    phoneEmail: '',
    salary: '',
    assignedCab: '',
    status: ''
  };
  
  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  showAddModal = false;
  showEditModal = false;
  showAssignModal = false;
  modalError = '';

  activeDriverName = '';
  activeDriverId: number | null = null;
  selectedCabId: number | null = null;

  driverForm = {
    name: '',
    email: '',
    phone: '',
    salary: 0,
    address: ''
  };

  editForm = {
    name: '',
    email: '',
    phone: '',
    salary: 0,
    address: '',
    verificationStatus: 0
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadDrivers();
    this.loadAvailableCabs();
  }

  loadDrivers() {
    this.apiService.getDrivers(
      1, 
      1000, 
      this.searchQuery, 
      this.verificationFilter, 
      'Name', 
      'asc'
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.allDrivers = res.data.items;
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Error loading drivers', err);
      }
    });
  }

  applyFilters() {
    this.filteredDrivers = this.allDrivers.filter(driver => {
      const matchName = !this.filters.name || driver.name.toLowerCase().includes(this.filters.name.toLowerCase());
      const matchPhoneEmail = !this.filters.phoneEmail || 
        driver.phone.toLowerCase().includes(this.filters.phoneEmail.toLowerCase()) || 
        (driver.email && driver.email.toLowerCase().includes(this.filters.phoneEmail.toLowerCase()));
      
      const matchSalary = !this.filters.salary || driver.salary.toString().includes(this.filters.salary);

      const matchCab = !this.filters.assignedCab || 
        (driver.currentCabVehicleNumber && driver.currentCabVehicleNumber.toLowerCase().includes(this.filters.assignedCab.toLowerCase()));
      
      let statusLabel = this.getStatusLabel(driver.verificationStatus);
      const matchStatus = !this.filters.status || statusLabel.toLowerCase() === this.filters.status.toLowerCase();

      return matchName && matchPhoneEmail && matchSalary && matchCab && matchStatus;
    });

    this.totalCount = this.filteredDrivers.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
    this.paginate();
  }

  paginate() {
    const startIndex = (this.page - 1) * this.pageSize;
    this.drivers = this.filteredDrivers.slice(startIndex, startIndex + this.pageSize);
  }

  loadAvailableCabs() {
    this.apiService.getCabs(1, 100, '', 'VehicleNumber', 'asc').subscribe({
      next: (res) => {
        if (res.success) {
          this.availableCabs = res.data.items;
        }
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.loadDrivers();
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
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      default: return 'Unknown';
    }
  }

  isLicenseExpired(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  openAddModal() {
    this.modalError = '';
    this.driverForm = {
      name: '',
      email: '',
      phone: '',
      salary: 0,
      address: ''
    };
    this.showAddModal = true;
  }

  openEditModal(driver: any) {
    this.modalError = '';
    this.activeDriverId = driver.id;
    this.editForm = {
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      salary: driver.salary,
      address: driver.address,
      verificationStatus: driver.verificationStatus
    };
    this.showEditModal = true;
  }

  openAssignModal(driver: any) {
    this.activeDriverId = driver.id;
    this.activeDriverName = driver.name;
    this.selectedCabId = driver.currentCabId;
    this.showAssignModal = true;
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showAssignModal = false;
    this.modalError = '';
  }

  saveDriver() {
    if (!this.driverForm.name || !this.driverForm.phone) {
      this.modalError = 'Name and Phone number are required.';
      return;
    }

    this.apiService.createDriver(this.driverForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModals();
          this.loadDrivers();
        } else {
          this.modalError = res.message || 'Failed to create driver.';
        }
      },
      error: (err) => {
        this.modalError = err.error?.message || 'Server error creating driver.';
      }
    });
  }

  updateDriver() {

    const payload = {
      ...this.editForm,
      verificationStatus: parseInt(this.editForm.verificationStatus.toString(), 10)
    };

    if (this.activeDriverId) {
      this.apiService.updateDriver(this.activeDriverId, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModals();
            this.loadDrivers();
          } else {
            this.modalError = res.message || 'Failed to update driver.';
          }
        },
        error: (err) => {
          this.modalError = err.error?.message || 'Server error updating driver.';
        }
      });
    }
  }

  saveAssignCab() {
    if (this.activeDriverId !== null) {
      const parsedCabId = this.selectedCabId ? parseInt(this.selectedCabId.toString(), 10) : null;
      this.apiService.assignCab(this.activeDriverId, parsedCabId).subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModals();
            this.loadDrivers();
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Error assigning cab.');
        }
      });
    }
  }

  verifyDriver(id: number, status: string) {
    const driver = this.drivers.find(d => d.id === id);
    if (!driver) return;

    const payload = {
      licenseNumber: driver.licenseNumber,
      licenseExpiryDate: driver.licenseExpiryDate,
      address: driver.address,
      salary: driver.salary,
      verificationStatus: status === 'Approved' ? 1 : 2
    };

    this.apiService.updateDriver(id, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadDrivers();
        }
      }
    });
  }

  deleteDriver(id: number) {
    if (confirm('Are you sure you want to delete this driver? Driver and account will be soft-deleted.')) {
      this.apiService.deleteDriver(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadDrivers();
          }
        },
        error: (err) => {
          alert(err.error?.message || 'Error deleting driver.');
        }
      });
    }
  }
}
