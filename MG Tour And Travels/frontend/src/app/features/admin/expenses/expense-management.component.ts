import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-expense-management',
  template: `
    <div class="fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1>Expense Claim Approvals</h1>
          <p style="color: var(--text-secondary);">Verify, approve, or reject reimbursements and operational logs submitted by drivers</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          <span>+</span> ADD CAB EXPENSE
        </button>
      </div>

      <!-- Filters -->
      <div class="glass-card" style="margin-bottom: 1.5rem; padding: 1rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div style="flex-grow: 1; min-width: 200px;">
          <select class="form-control" [(ngModel)]="statusFilter" (change)="loadExpenses()">
            <option value="">All Claims</option>
            <option value="Pending">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container glass-card" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Driver</th>
              <th>Cab Plate</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Receipt</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
            <!-- Column-specific filters -->
            <tr style="background: rgba(255,255,255,0.01);">
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Date..." [(ngModel)]="filters.expenseDate" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Driver..." [(ngModel)]="filters.driverName" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Plate..." [(ngModel)]="filters.vehicleNumber" (input)="applyFilters()" />
              </td>
              <td>
                <select class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" [(ngModel)]="filters.category" (change)="applyFilters()">
                  <option value="">All</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Toll">Toll</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Other">Other</option>
                </select>
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Amount..." [(ngModel)]="filters.amount" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Desc..." [(ngModel)]="filters.description" (input)="applyFilters()" />
              </td>
              <td></td>
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
            <tr *ngIf="expenses.length === 0">
              <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                No expense claims matching search filters.
              </td>
            </tr>
            <tr *ngFor="let exp of expenses">
              <td>{{ exp.expenseDate | date:'mediumDate' }}</td>
              <td><strong>{{ exp.driverName }}</strong></td>
              <td><code>{{ exp.vehicleNumber || 'N/A' }}</code></td>
              <td>{{ getCategoryLabel(exp.category) }}</td>
              <td style="color: var(--text-primary); font-weight: 700;">{{ exp.amount | currency }}</td>
              <td>{{ exp.description }}</td>
              <td>
                <a *ngIf="exp.receiptUrl" [href]="'http://localhost:5165' + exp.receiptUrl" target="_blank" class="btn btn-secondary" style="padding: 0.3rem 0.5rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.25rem;">
                  📄 VIEW RECEIPT
                </a>
                <span *ngIf="!exp.receiptUrl" style="color: var(--text-muted); font-size: 0.8rem;">No file</span>
              </td>
              <td>
                <span class="badge" [class.badge-warning]="exp.status === 0" [class.badge-success]="exp.status === 1" [class.badge-danger]="exp.status === 2">
                  {{ getStatusLabel(exp.status) }}
                </span>
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                  <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="openEditModal(exp)">EDIT</button>
                  <button *ngIf="exp.status === 0" class="btn btn-accent" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="updateStatus(exp.id, 'Approved')">APPROVE</button>
                  <button *ngIf="exp.status === 0" class="btn btn-danger" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="updateStatus(exp.id, 'Rejected')">REJECT</button>
                  <span *ngIf="exp.status !== 0" style="color: var(--text-muted); font-size: 0.85rem; padding: 0.4rem 0;">Reviewed</span>
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

      <!-- Add/Edit Expense Modal -->
      <div *ngIf="showModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 500px;">
          <h2>{{ isEditMode ? 'Edit Expense Claim' : 'Log Cab Expense' }}</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
            {{ isEditMode ? 'Modify expense parameters and verification status' : 'Log fuel refills, maintenance, or other costs directly against a cab (auto-approved)' }}
          </p>

          <div *ngIf="modalError" class="badge badge-danger" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; justify-content: center; text-transform: none; text-align: center;">
            {{ modalError }}
          </div>

          <div class="form-group">
            <label class="form-label">Select Cab</label>
            <select class="form-control" [(ngModel)]="expenseForm.cabId">
              <option value="">No Cab / General</option>
              <option *ngFor="let cab of cabsList" [value]="cab.id">
                {{ cab.vehicleNumber }} ({{ cab.make }} {{ cab.model }})
              </option>
            </select>
          </div>

          <div class="form-group" *ngIf="isEditMode">
            <label class="form-label">Select Driver</label>
            <select class="form-control" [(ngModel)]="expenseForm.driverId">
              <option value="">No Driver</option>
              <option *ngFor="let driver of driversList" [value]="driver.id">
                {{ driver.name }} ({{ driver.phone }})
              </option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Expense Category</label>
              <select class="form-control" [(ngModel)]="expenseForm.category">
                <option [value]="0">Fuel / CNG</option>
                <option [value]="1">Maintenance</option>
                <option [value]="2">Toll Charges</option>
                <option [value]="3">Insurance</option>
                <option [value]="4">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Amount (₹)</label>
              <input type="number" class="form-control" [(ngModel)]="expenseForm.amount" placeholder="0.00" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description / Remarks</label>
            <input type="text" class="form-control" [(ngModel)]="expenseForm.description" placeholder="e.g. CNG refill 10kg" />
          </div>

          <div class="form-group" *ngIf="isEditMode">
            <label class="form-label">Expense Status</label>
            <select class="form-control" [(ngModel)]="expenseForm.status">
              <option [value]="0">Pending</option>
              <option [value]="1">Approved</option>
              <option [value]="2">Rejected</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label class="form-label">Attach Proof / Receipt Image</label>
            <div style="display: flex; gap: 1rem; align-items: center;">
              <input type="file" (change)="onFileSelected($event)" accept="image/*,application/pdf" style="display: none;" #fileInput />
              <button class="btn btn-secondary" (click)="fileInput.click()">
                📷 {{ expenseForm.receiptFileName ? 'REPLACE FILE' : 'UPLOAD RECEIPT' }}
              </button>
              <span *ngIf="expenseForm.receiptFileName" style="font-size: 0.85rem; color: var(--success); font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;">
                ✓ {{ expenseForm.receiptFileName }}
              </span>
            </div>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn btn-secondary" (click)="closeModal()" [disabled]="loading">CANCEL</button>
            <button class="btn btn-primary" (click)="saveExpense()" [disabled]="loading">
              {{ loading ? (isEditMode ? 'SAVING...' : 'ADDING...') : (isEditMode ? 'SAVE CHANGES' : 'ADD EXPENSE') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ExpenseManagementComponent implements OnInit {
  expenses: any[] = [];
  allExpenses: any[] = [];
  filteredExpenses: any[] = [];
  statusFilter = '';

  showModal = false;
  isEditMode = false;
  editingExpenseId: number | null = null;
  loading = false;
  modalError = '';
  cabsList: any[] = [];
  driversList: any[] = [];
  
  expenseForm = {
    cabId: '',
    driverId: '',
    category: 0,
    amount: 15,
    description: '',
    receiptBase64: '',
    receiptFileName: '',
    status: 0
  };

  filters = {
    expenseDate: '',
    driverName: '',
    vehicleNumber: '',
    category: '',
    amount: '',
    description: '',
    status: ''
  };

  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  constructor(private apiService: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadExpenses();
    this.loadCabs();
    this.loadDrivers();
  }

  loadExpenses() {
    this.apiService.getExpenses(1, 1000, this.statusFilter).subscribe({
      next: (res) => {
        if (res.success) {
          this.allExpenses = res.data.items;
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Error loading expenses', err);
      }
    });
  }

  applyFilters() {
    this.filteredExpenses = this.allExpenses.filter(exp => {
      const matchDate = !this.filters.expenseDate || 
        new Date(exp.expenseDate).toLocaleDateString().toLowerCase().includes(this.filters.expenseDate.toLowerCase()) ||
        new Date(exp.expenseDate).toLocaleTimeString().toLowerCase().includes(this.filters.expenseDate.toLowerCase());

      const matchDriver = !this.filters.driverName || exp.driverName.toLowerCase().includes(this.filters.driverName.toLowerCase());
      
      const vehicleNum = exp.vehicleNumber || 'N/A';
      const matchVehicle = !this.filters.vehicleNumber || vehicleNum.toLowerCase().includes(this.filters.vehicleNumber.toLowerCase());
      
      const categoryLabel = this.getCategoryLabel(exp.category);
      const matchCategory = !this.filters.category || categoryLabel.toLowerCase() === this.filters.category.toLowerCase();

      const matchAmount = !this.filters.amount || exp.amount.toString().includes(this.filters.amount);

      const matchDesc = !this.filters.description || (exp.description && exp.description.toLowerCase().includes(this.filters.description.toLowerCase()));

      const statusLabel = this.getStatusLabel(exp.status);
      const matchStatus = !this.filters.status || statusLabel.toLowerCase() === this.filters.status.toLowerCase();

      return matchDate && matchDriver && matchVehicle && matchCategory && matchAmount && matchDesc && matchStatus;
    });

    this.totalCount = this.filteredExpenses.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
    this.paginate();
  }

  paginate() {
    const startIndex = (this.page - 1) * this.pageSize;
    this.expenses = this.filteredExpenses.slice(startIndex, startIndex + this.pageSize);
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

  getCategoryLabel(cat: number): string {
    switch (cat) {
      case 0: return 'Fuel';
      case 1: return 'Maintenance';
      case 2: return 'Toll';
      case 3: return 'Insurance';
      case 4: return 'Other';
      default: return 'Unknown';
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

  updateStatus(id: number, status: string) {
    this.apiService.updateExpenseStatus(id, status).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadExpenses();
          this.toast.success(`Expense claim ${status.toLowerCase()}.`);
        }
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error updating expense status.');
      }
    });
  }

  loadCabs() {
    this.apiService.getCabs(1, 1000, '', 'vehicleNumber', 'asc').subscribe({
      next: (res) => {
        if (res.success) {
          this.cabsList = res.data.items;
        }
      },
      error: (err) => {
        console.error('Error loading cabs', err);
      }
    });
  }

  loadDrivers() {
    this.apiService.getDrivers(1, 1000, '', '', 'name', 'asc').subscribe({
      next: (res) => {
        if (res.success) {
          this.driversList = res.data.items;
        }
      },
      error: (err) => {
        console.error('Error loading drivers', err);
      }
    });
  }

  openAddModal() {
    this.isEditMode = false;
    this.editingExpenseId = null;
    this.modalError = '';
    this.expenseForm = {
      cabId: '',
      driverId: '',
      category: 0,
      amount: 15,
      description: '',
      receiptBase64: '',
      receiptFileName: '',
      status: 0
    };
    this.showModal = true;
  }

  openEditModal(exp: any) {
    this.isEditMode = true;
    this.editingExpenseId = exp.id;
    this.modalError = '';
    this.expenseForm = {
      cabId: exp.cabId ? exp.cabId.toString() : '',
      driverId: exp.driverId ? exp.driverId.toString() : '',
      category: exp.category,
      amount: exp.amount,
      description: exp.description || '',
      receiptBase64: '',
      receiptFileName: exp.receiptUrl ? exp.receiptUrl.split('/').pop() || '' : '',
      status: exp.status
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.modalError = '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.expenseForm.receiptFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.expenseForm.receiptBase64 = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  saveExpense() {
    if (!this.expenseForm.amount || !this.expenseForm.description) {
      this.modalError = 'Please input expense amount and description.';
      return;
    }

    this.loading = true;
    this.modalError = '';

    const payload = {
      cabId: this.expenseForm.cabId ? parseInt(this.expenseForm.cabId.toString(), 10) : null,
      driverId: this.expenseForm.driverId ? parseInt(this.expenseForm.driverId.toString(), 10) : null,
      category: parseInt(this.expenseForm.category.toString(), 10),
      amount: parseFloat(this.expenseForm.amount.toString()),
      description: this.expenseForm.description,
      receiptBase64: this.expenseForm.receiptBase64,
      receiptFileName: this.expenseForm.receiptFileName,
      status: parseInt(this.expenseForm.status.toString(), 10)
    };

    if (this.isEditMode && this.editingExpenseId) {
      this.apiService.updateExpense(this.editingExpenseId, payload).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.closeModal();
            this.loadExpenses();
            this.toast.success('Expense claim updated successfully.');
          } else {
            this.modalError = res.message || 'Failed to update expense.';
          }
        },
        error: (err) => {
          this.loading = false;
          this.modalError = this.getErrorMessage(err);
        }
      });
    } else {
      if (!this.expenseForm.cabId) {
        this.modalError = 'Please select a cab.';
        this.loading = false;
        return;
      }
      this.apiService.createExpense(payload).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.closeModal();
            this.loadExpenses();
            this.toast.success('Expense logged successfully.');
          } else {
            this.modalError = res.message || 'Failed to log expense.';
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
    return err.message || 'Server error logging expense.';
  }
}
