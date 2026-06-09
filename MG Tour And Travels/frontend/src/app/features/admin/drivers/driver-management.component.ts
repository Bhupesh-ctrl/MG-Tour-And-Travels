import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

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
              <th *ngIf="isSuperAdmin">Security Password</th>
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
              <td *ngIf="isSuperAdmin"></td>
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
              <td [attr.colspan]="isSuperAdmin ? 7 : 6" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                No drivers registered yet or matching criteria.
              </td>
            </tr>
            <tr *ngFor="let driver of drivers">
              <td><strong>{{ driver.name }}</strong></td>
              <td>
                <div style="font-size: 0.9rem;">{{ driver.phone }}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary);">{{ driver.email || 'N/A' }}</div>
              </td>
              <td *ngIf="isSuperAdmin">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-family: monospace; font-size: 1rem; text-transform: none !important;">
                    {{ driver.showPassword ? driver.password : '••••••••' }}
                  </span>
                  <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; border: none; background: transparent;" (click)="driver.showPassword = !driver.showPassword">
                    {{ driver.showPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
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
              <td style="text-align: right; vertical-align: middle;">
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                  <button *ngIf="driver.verificationStatus === 0" class="btn btn-accent" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="verifyDriver(driver.id, 'Approved')">APPROVE</button>
                  <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="openDocsModal(driver)">DOCUMENTS</button>
                  <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="openEditModal(driver)">EDIT</button>
                  <button class="btn btn-danger" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="deleteDriver(driver.id)">DELETE</button>
                </div>
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

          <div class="form-group" *ngIf="isSuperAdmin">
            <label class="form-label">Reset Password (Optional)</label>
            <input type="text" class="form-control" [(ngModel)]="editForm.password" placeholder="Enter new password (optional)" style="text-transform: none !important;" />
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

      <!-- Driver Documents Modal -->
      <div *ngIf="showDocsModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
          <h2>Driver Documents: {{ activeDriverName }}</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Upload and manage driving license, ID proofs, and other driver documents.
          </p>

          <div *ngIf="docModalError" class="badge badge-danger" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; justify-content: center; text-transform: none; text-align: center;">
            {{ docModalError }}
          </div>

          <!-- Document List Table -->
          <div class="table-container" style="margin-bottom: 1.5rem; background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 8px;">
            <table class="data-table" style="font-size: 0.85rem;">
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Type</th>
                  <th>Expiry Date</th>
                  <th>File</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="driverDocuments.length === 0">
                  <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
                    No documents uploaded for this driver yet.
                  </td>
                </tr>
                <tr *ngFor="let doc of driverDocuments">
                  <td><strong>{{ doc.title }}</strong></td>
                  <td>{{ getDocTypeLabel(doc.documentType) }}</td>
                  <td>{{ doc.expiryDate ? (doc.expiryDate | date:'mediumDate') : 'No Expiry' }}</td>
                  <td>
                    <a *ngIf="doc.documentUrl" [href]="'https://mg-fleet-api-g3behhepdyfxgfhh.centralindia-01.azurewebsites.net' + doc.documentUrl" target="_blank" class="btn btn-secondary" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.25rem;">
                      📄 VIEW
                    </a>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <div style="display: flex; gap: 0.25rem; justify-content: flex-end; align-items: center;">
                      <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" (click)="editDocument(doc)">EDIT</button>
                      <button class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" (click)="deleteDocument(doc.id)">REMOVE</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Document Add/Edit Form -->
          <div class="glass-card" style="padding: 1rem; margin-bottom: 1rem;">
            <h4>{{ editingDocId ? 'Edit Document' : 'Upload New Document' }}</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
              <div class="form-group">
                <label class="form-label">Document Title</label>
                <input type="text" class="form-control" [(ngModel)]="docForm.title" placeholder="e.g. Driving License, Aadhar Card" />
              </div>
              <div class="form-group">
                <label class="form-label">Document Type</label>
                <select class="form-control" [(ngModel)]="docForm.documentType">
                  <option [value]="0">Driving License</option>
                  <option [value]="4">Receipt</option>
                  <option [value]="8">Other / Custom</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Expiry Date (Optional)</label>
                <input type="date" class="form-control" [(ngModel)]="docForm.expiryDate" />
              </div>
              <div class="form-group">
                <label class="form-label">Upload File</label>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <input type="file" (change)="onDocFileSelected($event)" accept="image/*,application/pdf" style="display: none;" #driverDocFileInput />
                  <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" (click)="driverDocFileInput.click()">
                    📷 {{ docForm.fileName ? 'REPLACE FILE' : 'SELECT FILE' }}
                  </button>
                  <span *ngIf="docForm.fileName" style="font-size: 0.8rem; color: var(--success); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ✓ {{ docForm.fileName }}
                  </span>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem;">
              <button *ngIf="editingDocId" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" (click)="cancelDocEdit()">CANCEL EDIT</button>
              <button class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" (click)="saveDocument()">
                {{ editingDocId ? 'UPDATE DOCUMENT' : 'UPLOAD DOCUMENT' }}
              </button>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
            <button class="btn btn-secondary" (click)="closeDocsModal()">CLOSE</button>
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
  driverDocuments: any[] = [];
  docForm = {
    title: '',
    documentType: 0,
    expiryDate: '',
    fileBase64: '',
    fileName: ''
  };
  docModalError = '';
  editingDocId: number | null = null;
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
  showDocsModal = false;
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
    verificationStatus: 0,
    password: ''
  };

  isSuperAdmin = false;

  constructor(private apiService: ApiService, private toast: ToastService, private authService: AuthService) { }

  ngOnInit() {
    this.isSuperAdmin = this.authService.getRole() === 'SuperAdmin';
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
      verificationStatus: driver.verificationStatus,
      password: ''
    };
    this.showEditModal = true;
  }

  openAssignModal(driver: any) {
    this.activeDriverId = driver.id;
    this.activeDriverName = driver.name;
    this.selectedCabId = driver.currentCabId;
    this.showAssignModal = true;
  }

  openDocsModal(driver: any) {
    this.activeDriverId = driver.id;
    this.activeDriverName = driver.name;
    this.driverDocuments = [];
    this.docModalError = '';
    this.editingDocId = null;
    this.resetDocForm();
    this.loadDriverDocuments();
    this.showDocsModal = true;
  }

  closeDocsModal() {
    this.showDocsModal = false;
    this.activeDriverId = null;
    this.driverDocuments = [];
    this.editingDocId = null;
    this.resetDocForm();
  }

  resetDocForm() {
    this.docForm = { title: '', documentType: 0, expiryDate: '', fileBase64: '', fileName: '' };
  }

  loadDriverDocuments() {
    if (!this.activeDriverId) return;
    this.apiService.getDocuments('Driver', this.activeDriverId).subscribe({
      next: (res) => { if (res.success) this.driverDocuments = res.data; },
      error: (err) => { console.error('Error loading documents', err); }
    });
  }

  onDocFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.docForm.fileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => { this.docForm.fileBase64 = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  saveDocument() {
    if (!this.docForm.title) {
      this.docModalError = 'Please specify a document title.';
      return;
    }
    this.docModalError = '';

    if (this.editingDocId) {
      const payload = {
        documentType: parseInt(this.docForm.documentType.toString(), 10),
        title: this.docForm.title,
        fileBase64: this.docForm.fileBase64,
        fileName: this.docForm.fileName,
        expiryDate: this.docForm.expiryDate ? new Date(this.docForm.expiryDate).toISOString() : null,
        status: 1
      };
      this.apiService.updateDocument(this.editingDocId, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.editingDocId = null;
            this.resetDocForm();
            this.loadDriverDocuments();
            this.toast.success('Document updated successfully.');
          } else {
            this.docModalError = res.message || 'Failed to update document.';
            this.toast.error(this.docModalError);
          }
        },
        error: (err) => {
          this.docModalError = err.error?.message || 'Server error updating document.';
          this.toast.error(this.docModalError);
        }
      });
    } else {
      if (!this.docForm.fileBase64) { this.docModalError = 'Please select a file to upload.'; return; }
      const payload = {
        entityType: 0,
        entityId: this.activeDriverId,
        documentType: parseInt(this.docForm.documentType.toString(), 10),
        title: this.docForm.title,
        fileBase64: this.docForm.fileBase64,
        fileName: this.docForm.fileName,
        expiryDate: this.docForm.expiryDate ? new Date(this.docForm.expiryDate).toISOString() : null
      };
      this.apiService.uploadDocument(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.resetDocForm();
            this.loadDriverDocuments();
            this.toast.success('Document uploaded successfully.');
          } else {
            this.docModalError = res.message || 'Failed to upload document.';
            this.toast.error(this.docModalError);
          }
        },
        error: (err) => {
          this.docModalError = err.error?.message || 'Server error uploading document.';
          this.toast.error(this.docModalError);
        }
      });
    }
  }

  editDocument(doc: any) {
    this.editingDocId = doc.id;
    this.docForm = {
      title: doc.title,
      documentType: doc.documentType,
      expiryDate: doc.expiryDate ? doc.expiryDate.split('T')[0] : '',
      fileBase64: '',
      fileName: doc.documentUrl ? doc.documentUrl.split('/').pop() || '' : ''
    };
  }

  cancelDocEdit() {
    this.editingDocId = null;
    this.resetDocForm();
  }

  deleteDocument(id: number) {
    if (!confirm('Are you sure you want to remove this document?')) return;
    this.apiService.deleteDocument(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadDriverDocuments();
          this.toast.success('Document removed.');
        }
      },
      error: (err) => { this.toast.error(err.error?.message || 'Error deleting document.'); }
    });
  }

  getDocTypeLabel(type: number): string {
    switch (type) {
      case 0: return 'Driving License';
      case 4: return 'Receipt';
      case 8: return 'Other / Custom';
      default: return 'Other / Custom';
    }
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showAssignModal = false;
    this.showDocsModal = false;
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
          this.toast.success('Driver registered successfully.');
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
            this.toast.success('Driver details updated.');
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
            this.toast.success(parsedCabId ? 'Cab assigned successfully.' : 'Cab unassigned.');
          }
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error assigning cab.');
        }
      });
    }
  }

  verifyDriver(id: number, status: string) {
    const driver = this.drivers.find(d => d.id === id);
    if (!driver) return;

    const payload = {
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
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
          this.toast.success(`Driver ${status === 'Approved' ? 'approved' : 'rejected'} successfully.`);
        } else {
          this.toast.error(res.message || 'Failed to verify driver.');
        }
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Server error verifying driver.');
      }
    });
  }

  deleteDriver(id: number) {
    if (confirm('Are you sure you want to delete this driver? Driver and account will be soft-deleted.')) {
      this.apiService.deleteDriver(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadDrivers();
            this.toast.success('Driver deleted successfully.');
          }
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error deleting driver.');
        }
      });
    }
  }
}
