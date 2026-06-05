import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-cab-management',
  template: `
    <div class="fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1>Cab Fleet Management</h1>
          <p style="color: var(--text-secondary);">Manage registered vehicles and their operating statuses</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          <span>+</span> REGISTER NEW CAB
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="glass-card" style="margin-bottom: 1.5rem; padding: 1rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div style="flex-grow: 1; min-width: 200px;">
          <input type="text" class="form-control" placeholder="Search by Vehicle Plate, Make, Model..." [(ngModel)]="searchQuery" (input)="onSearch()" />
        </div>
        <div style="width: 150px;">
          <select class="form-control" [(ngModel)]="sortBy" (change)="loadCabs()">
            <option value="VehicleNumber">Plate Number</option>
            <option value="make">Make</option>
            <option value="model">Model</option>
            <option value="year">Year</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div style="width: 120px;">
          <select class="form-control" [(ngModel)]="sortOrder" (change)="loadCabs()">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <!-- Cabs Data Table -->
      <div class="table-container glass-card" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Plate Number</th>
              <th>Make & Model</th>
              <th>Year</th>
              <th>Color</th>
              <th>Fuel Type</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
            <!-- Column-specific filters -->
            <tr style="background: rgba(255,255,255,0.01);">
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Plate..." [(ngModel)]="filters.vehicleNumber" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Model..." [(ngModel)]="filters.makeModel" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Year..." [(ngModel)]="filters.year" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Color..." [(ngModel)]="filters.color" (input)="applyFilters()" />
              </td>
              <td>
                <select class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" [(ngModel)]="filters.fuelType" (change)="applyFilters()">
                  <option value="">All</option>
                  <option value="CNG">CNG</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                </select>
              </td>
              <td>
                <select class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" [(ngModel)]="filters.status" (change)="applyFilters()">
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="OutOfService">OutOfService</option>
                </select>
              </td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="cabs.length === 0">
              <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                No cabs matching the filter criteria found.
              </td>
            </tr>
            <tr *ngFor="let cab of cabs">
              <td><strong style="text-transform: uppercase;">{{ cab.vehicleNumber }}</strong></td>
              <td>{{ cab.make }} {{ cab.model }}</td>
              <td>{{ cab.year }}</td>
              <td>{{ cab.color }}</td>
              <td>{{ cab.fuelType }}</td>
              <td>
                <span class="badge" [class.badge-success]="cab.status === 0" [class.badge-warning]="cab.status === 1" [class.badge-danger]="cab.status === 2">
                  {{ getStatusLabel(cab.status) }}
                </span>
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                  <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="openDocumentsModal(cab)">DOCUMENTS</button>
                  <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="openEditModal(cab)">EDIT</button>
                  <button class="btn btn-danger" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="deleteCab(cab.id)">DELETE</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; color: var(--text-secondary); font-size: 0.9rem;">
        <div>
          Showing page {{ page }} of {{ totalPages }} ({{ totalCount }} total items)
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" [disabled]="page === 1" (click)="prevPage()">PREVIOUS</button>
          <button class="btn btn-secondary" [disabled]="page === totalPages" (click)="nextPage()">NEXT</button>
        </div>
      </div>

      <!-- Add/Edit Cab Modal -->
      <div *ngIf="showModal" class="modal-overlay">
        <div class="modal-content">
          <h2>{{ isEditMode ? 'Modify Vehicle Record' : 'Register Vehicle' }}</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Provide registration and vehicle details below
          </p>

          <div *ngIf="modalError" class="badge badge-danger" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; justify-content: center; text-transform: none; text-align: center;">
            {{ modalError }}
          </div>

          <div class="form-group">
            <label class="form-label">Plate / Registration Number</label>
            <input type="text" class="form-control plate-number" [(ngModel)]="cabForm.vehicleNumber" (input)="formatVehicleNumber()" placeholder="e.g. DL-1CA-1234" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Brand / Make</label>
              <input type="text" class="form-control" [(ngModel)]="cabForm.make" placeholder="e.g. Maruti Suzuki" />
            </div>
            <div class="form-group">
              <label class="form-label">Model</label>
              <input type="text" class="form-control" [(ngModel)]="cabForm.model" placeholder="e.g. Dzire" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Manufacturing Year</label>
              <input type="number" class="form-control" [(ngModel)]="cabForm.year" />
            </div>
            <div class="form-group">
              <label class="form-label">Color</label>
              <input type="text" class="form-control" [(ngModel)]="cabForm.color" placeholder="e.g. White" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Fuel Type</label>
              <select class="form-control" [(ngModel)]="cabForm.fuelType">
                <option value="CNG">CNG</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" [(ngModel)]="cabForm.status">
                <option [value]="0">Active</option>
                <option [value]="1">Maintenance</option>
                <option [value]="2">OutOfService</option>
              </select>
            </div>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn btn-secondary" (click)="closeModal()">CANCEL</button>
            <button class="btn btn-primary" (click)="saveCab()">
              {{ isEditMode ? 'UPDATE CAB' : 'REGISTER CAB' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Cab Documents Modal -->
      <div *ngIf="showDocumentsModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
          <h2>Cab Documents: {{ activeCab?.vehicleNumber }}</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Upload and manage pollution certs, challans, service papers, and other documents.
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
                <tr *ngIf="cabDocuments.length === 0">
                  <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
                    No documents uploaded for this cab yet.
                  </td>
                </tr>
                <tr *ngFor="let doc of cabDocuments">
                  <td><strong>{{ doc.title }}</strong></td>
                  <td>{{ getDocTypeLabel(doc.documentType) }}</td>
                  <td>{{ doc.expiryDate ? (doc.expiryDate | date:'mediumDate') : 'No Expiry' }}</td>
                  <td>
                    <a *ngIf="doc.documentUrl" [href]="'http://localhost:5165' + doc.documentUrl" target="_blank" class="btn btn-secondary" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.25rem;">
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
                <input type="text" class="form-control" [(ngModel)]="docForm.title" placeholder="e.g. Pollution Cert, Challan #12" />
              </div>
              <div class="form-group">
                <label class="form-label">Document Type</label>
                <select class="form-control" [(ngModel)]="docForm.documentType">
                  <option [value]="5">Pollution Certificate</option>
                  <option [value]="6">Service Paper</option>
                  <option [value]="7">Challan</option>
                  <option [value]="1">Registration RC</option>
                  <option [value]="2">Insurance Policy</option>
                  <option [value]="3">Permit Paper</option>
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
                  <input type="file" (change)="onDocFileSelected($event)" accept="image/*,application/pdf" style="display: none;" #docFileInput />
                  <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" (click)="docFileInput.click()">
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
            <button class="btn btn-secondary" (click)="closeDocumentsModal()">CLOSE</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CabManagementComponent implements OnInit {
  cabs: any[] = [];
  allCabs: any[] = [];
  filteredCabs: any[] = [];
  searchQuery = '';
  sortBy = 'VehicleNumber';
  sortOrder = 'asc';
  
  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  showModal = false;
  isEditMode = false;
  editingCabId: number | null = null;
  modalError = '';

  showDocumentsModal = false;
  activeCab: any = null;
  cabDocuments: any[] = [];
  docModalError = '';
  editingDocId: number | null = null;

  docForm = {
    title: '',
    documentType: 5,
    expiryDate: '',
    fileBase64: '',
    fileName: ''
  };

  filters = {
    vehicleNumber: '',
    makeModel: '',
    year: '',
    color: '',
    fuelType: '',
    status: ''
  };

  cabForm = {
    vehicleNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    fuelType: 'CNG',
    status: 0
  };

  constructor(private apiService: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadCabs();
  }

  loadCabs() {
    this.apiService.getCabs(1, 1000, this.searchQuery, this.sortBy, this.sortOrder).subscribe({
      next: (res) => {
        if (res.success) {
          this.allCabs = res.data.items;
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Error loading cabs', err);
      }
    });
  }

  applyFilters() {
    this.filteredCabs = this.allCabs.filter(cab => {
      const matchVehicle = !this.filters.vehicleNumber || cab.vehicleNumber.toLowerCase().includes(this.filters.vehicleNumber.toLowerCase());
      const matchMakeModel = !this.filters.makeModel || `${cab.make} ${cab.model}`.toLowerCase().includes(this.filters.makeModel.toLowerCase());
      const matchYear = !this.filters.year || cab.year.toString().includes(this.filters.year);
      const matchColor = !this.filters.color || cab.color.toLowerCase().includes(this.filters.color.toLowerCase());
      const matchFuel = !this.filters.fuelType || cab.fuelType.toLowerCase() === this.filters.fuelType.toLowerCase();
      
      let statusLabel = this.getStatusLabel(cab.status);
      const matchStatus = !this.filters.status || statusLabel.toLowerCase() === this.filters.status.toLowerCase();

      return matchVehicle && matchMakeModel && matchYear && matchColor && matchFuel && matchStatus;
    });

    this.totalCount = this.filteredCabs.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
    this.paginate();
  }

  paginate() {
    const startIndex = (this.page - 1) * this.pageSize;
    this.cabs = this.filteredCabs.slice(startIndex, startIndex + this.pageSize);
  }

  onSearch() {
    this.page = 1;
    this.loadCabs();
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
      case 0: return 'Active';
      case 1: return 'Maintenance';
      case 2: return 'OutOfService';
      default: return 'Unknown';
    }
  }

  openAddModal() {
    this.isEditMode = false;
    this.editingCabId = null;
    this.modalError = '';
    this.cabForm = {
      vehicleNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      fuelType: 'CNG',
      status: 0
    };
    this.showModal = true;
  }

  openEditModal(cab: any) {
    this.isEditMode = true;
    this.editingCabId = cab.id;
    this.modalError = '';
    this.cabForm = {
      vehicleNumber: cab.vehicleNumber,
      make: cab.make,
      model: cab.model,
      year: cab.year,
      color: cab.color,
      fuelType: cab.fuelType,
      status: cab.status
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.modalError = '';
  }

  saveCab() {
    if (!this.cabForm.vehicleNumber || !this.cabForm.make || !this.cabForm.model) {
      this.modalError = 'Please fill out vehicle number, make, and model.';
      return;
    }

    this.cabForm.vehicleNumber = this.cabForm.vehicleNumber.trim().toUpperCase();

    const payload = {
      ...this.cabForm,
      status: parseInt(this.cabForm.status.toString(), 10)
    };

    if (this.isEditMode && this.editingCabId) {
      this.apiService.updateCab(this.editingCabId, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModal();
            this.loadCabs();
            this.toast.success('Cab details updated successfully.');
          } else {
            this.modalError = res.message || 'Failed to update cab.';
          }
        },
        error: (err) => {
          this.modalError = err.error?.message || 'Server error updating cab.';
        }
      });
    } else {
      this.apiService.createCab(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModal();
            this.loadCabs();
            this.toast.success('Cab registered successfully.');
          } else {
            this.modalError = res.message || 'Failed to register cab.';
          }
        },
        error: (err) => {
          this.modalError = err.error?.message || 'Server error registering cab.';
        }
      });
    }
  }

  deleteCab(id: number) {
    if (confirm('Are you sure you want to delete this cab? This vehicle will be soft-deleted.')) {
      this.apiService.deleteCab(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadCabs();
            this.toast.success('Cab deleted successfully.');
          }
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error deleting cab.');
        }
      });
    }
  }

  formatVehicleNumber() {
    if (this.cabForm.vehicleNumber) {
      this.cabForm.vehicleNumber = this.cabForm.vehicleNumber.toUpperCase();
    }
  }

  openDocumentsModal(cab: any) {
    this.activeCab = cab;
    this.docModalError = '';
    this.editingDocId = null;
    this.resetDocForm();
    this.loadDocuments();
    this.showDocumentsModal = true;
  }

  closeDocumentsModal() {
    this.showDocumentsModal = false;
    this.activeCab = null;
    this.cabDocuments = [];
    this.editingDocId = null;
    this.resetDocForm();
  }

  resetDocForm() {
    this.docForm = {
      title: '',
      documentType: 5,
      expiryDate: '',
      fileBase64: '',
      fileName: ''
    };
  }

  loadDocuments() {
    if (!this.activeCab) return;
    this.apiService.getDocuments('Cab', this.activeCab.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.cabDocuments = res.data;
        }
      },
      error: (err) => {
        console.error('Error loading documents', err);
      }
    });
  }

  onDocFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.docForm.fileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.docForm.fileBase64 = e.target.result;
      };
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
        status: 1 // Verified
      };
      this.apiService.updateDocument(this.editingDocId, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.editingDocId = null;
            this.resetDocForm();
            this.loadDocuments();
            this.toast.success('Document updated successfully.');
          } else {
            this.docModalError = res.message || 'Failed to update document.';
          }
        },
        error: (err) => {
          this.docModalError = err.error?.message || 'Server error updating document.';
        }
      });
    } else {
      if (!this.docForm.fileBase64) {
        this.docModalError = 'Please select a file to upload.';
        return;
      }

      const payload = {
        entityType: 1, // Cab
        entityId: this.activeCab.id,
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
            this.loadDocuments();
            this.toast.success('Document uploaded successfully.');
          } else {
            this.docModalError = res.message || 'Failed to upload document.';
          }
        },
        error: (err) => {
          this.docModalError = err.error?.message || 'Server error uploading document.';
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
    if (confirm('Are you sure you want to remove this document?')) {
      this.apiService.deleteDocument(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadDocuments();
            this.toast.success('Document removed.');
          }
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error deleting document.');
        }
      });
    }
  }

  getDocTypeLabel(type: number): string {
    switch (type) {
      case 0: return 'License';
      case 1: return 'Registration RC';
      case 2: return 'Insurance Policy';
      case 3: return 'Permit Paper';
      case 4: return 'Receipt';
      case 5: return 'Pollution Certificate';
      case 6: return 'Service Paper';
      case 7: return 'Challan';
      case 8: return 'Other / Custom';
      default: return 'Unknown';
    }
  }
}
