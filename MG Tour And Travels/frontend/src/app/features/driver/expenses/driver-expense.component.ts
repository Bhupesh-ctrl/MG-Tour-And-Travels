import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-driver-expense',
  template: `
    <div class="fade-in">
      <div style="margin-bottom: 2rem;">
        <h1>Log Expense Claim</h1>
        <p style="color: var(--text-secondary);">Submit fuel refills, tolls, or maintenance receipts for administrative approval</p>
      </div>

      <!-- Add Expense Form -->
      <div class="glass-card" style="margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1.25rem;">New Reimbursement Request</h3>
        
        <div *ngIf="successMsg" class="badge badge-success" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1.25rem; justify-content: center; text-transform: none; text-align: center;">
          {{ successMsg }}
        </div>
        <div *ngIf="errorMsg" class="badge badge-danger" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1.25rem; justify-content: center; text-transform: none; text-align: center;">
          {{ errorMsg }}
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
          <input type="text" class="form-control" [(ngModel)]="expenseForm.description" placeholder="e.g. CNG refill 10kg at Noida Sector-62" />
        </div>

        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label class="form-label">Attach Proof / Receipt Image</label>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <input type="file" (change)="onFileSelected($event)" accept="image/*,application/pdf" style="display: none;" #fileInput />
            <button class="btn btn-secondary" (click)="fileInput.click()">
              📷 {{ expenseForm.receiptFileName ? 'REPLACE FILE' : 'TAKE PICTURE / UPLOAD' }}
            </button>
            <span *ngIf="expenseForm.receiptFileName" style="font-size: 0.85rem; color: var(--accent); font-weight: 600;">
              ✓ {{ expenseForm.receiptFileName }}
            </span>
          </div>
        </div>

        <button class="btn btn-accent" style="width: 100%; padding: 0.85rem;" (click)="submitExpense()" [disabled]="loading">
          {{ loading ? 'SUBMITTING REQUEST...' : 'SUBMIT CLAIM' }}
        </button>
      </div>

      <!-- History list -->
      <div class="table-container glass-card" style="padding: 0;">
        <h3 style="padding: 1.25rem 1.5rem 0.5rem 1.5rem; margin: 0;">My Logs & Statuses</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
            <!-- Column-specific filters -->
            <tr style="background: rgba(255,255,255,0.01);">
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Date..." [(ngModel)]="filters.expenseDate" (input)="applyFilters()" />
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
              <td>
                <select class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" [(ngModel)]="filters.status" (change)="applyFilters()">
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="expenses.length === 0">
              <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                No expense claims matching search filters.
              </td>
            </tr>
            <tr *ngFor="let exp of expenses">
              <td>{{ exp.expenseDate | date:'mediumDate' }}</td>
              <td>{{ getCategoryLabel(exp.category) }}</td>
              <td style="color: var(--text-primary); font-weight: 700;">{{ exp.amount | currency }}</td>
              <td>{{ exp.description }}</td>
              <td>
                <span class="badge" [class.badge-warning]="exp.status === 0" [class.badge-success]="exp.status === 1" [class.badge-danger]="exp.status === 2">
                  {{ getStatusLabel(exp.status) }}
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
export class DriverExpenseComponent implements OnInit {
  expenses: any[] = [];
  allExpenses: any[] = [];
  filteredExpenses: any[] = [];
  loading = false;
  successMsg = '';
  errorMsg = '';

  filters = {
    expenseDate: '',
    category: '',
    amount: '',
    description: '',
    status: ''
  };

  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  expenseForm = {
    category: 0,
    amount: 15,
    description: '',
    receiptBase64: '',
    receiptFileName: ''
  };

  constructor(private apiService: ApiService, private authService: AuthService) {}

  ngOnInit() {
    this.loadDriverExpenses();
  }

  loadDriverExpenses() {
    const driverId = this.authService.getDriverId();
    if (driverId) {
      this.apiService.getExpenses(1, 1000, '', driverId).subscribe({
        next: (res) => {
          if (res.success) {
            this.allExpenses = res.data.items;
            this.applyFilters();
          }
        }
      });
    }
  }

  applyFilters() {
    this.filteredExpenses = this.allExpenses.filter(exp => {
      const matchDate = !this.filters.expenseDate || 
        new Date(exp.expenseDate).toLocaleDateString().toLowerCase().includes(this.filters.expenseDate.toLowerCase());

      const categoryLabel = this.getCategoryLabel(exp.category);
      const matchCategory = !this.filters.category || categoryLabel.toLowerCase() === this.filters.category.toLowerCase();

      const matchAmount = !this.filters.amount || exp.amount.toString().includes(this.filters.amount);

      const matchDesc = !this.filters.description || (exp.description && exp.description.toLowerCase().includes(this.filters.description.toLowerCase()));

      const statusLabel = this.getStatusLabel(exp.status);
      const matchStatus = !this.filters.status || statusLabel.toLowerCase() === this.filters.status.toLowerCase();

      return matchDate && matchCategory && matchAmount && matchDesc && matchStatus;
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

  submitExpense() {
    if (!this.expenseForm.amount || !this.expenseForm.description) {
      this.errorMsg = 'Please input expense amount and description details.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const payload = {
      category: parseInt(this.expenseForm.category.toString(), 10),
      amount: parseFloat(this.expenseForm.amount.toString()),
      description: this.expenseForm.description,
      receiptBase64: this.expenseForm.receiptBase64,
      receiptFileName: this.expenseForm.receiptFileName
    };

    this.apiService.createExpense(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMsg = 'Expense claim submitted successfully!';
        this.loadDriverExpenses();
        // reset form
        this.expenseForm = {
          category: 0,
          amount: 15,
          description: '',
          receiptBase64: '',
          receiptFileName: ''
        };
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Error submitting expense claim.';
      }
    });
  }
}
