import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-management',
  template: `
    <div class="fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h1>Administrator Management</h1>
          <p style="color: var(--text-secondary);">Manage system administrators, security access levels, and credentials</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          <span>+</span> REGISTER NEW ADMIN
        </button>
      </div>

      <!-- Search Toolbar -->
      <div class="glass-card" style="margin-bottom: 1.5rem; padding: 1rem; display: flex; gap: 1rem; align-items: center;">
        <div style="flex-grow: 1; min-width: 200px;">
          <input type="text" class="form-control" placeholder="Search by Username, Email, Phone..." [(ngModel)]="searchQuery" (input)="filterAdmins()" />
        </div>
      </div>

      <!-- Admins List Table -->
      <div class="table-container glass-card" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email Address</th>
              <th>Phone Number</th>
              <th>Security Password</th>
              <th>Registration Date</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="filteredAdmins.length === 0">
              <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                No administrators found matching the criteria.
              </td>
            </tr>
            <tr *ngFor="let admin of filteredAdmins">
              <td>
                <strong>{{ admin.username }}</strong>
                <span *ngIf="admin.role === 'SuperAdmin'" style="margin-left: 0.5rem; font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 4px; border: 1px solid var(--primary); background: rgba(197, 155, 39, 0.15); color: var(--primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; vertical-align: middle;">
                  Super Admin
                </span>
              </td>
              <td>{{ admin.email || 'N/A' }}</td>
              <td>{{ admin.phone || 'N/A' }}</td>
              <td style="vertical-align: middle;">
                <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color);">
                  <span style="font-family: monospace; font-size: 0.9rem; letter-spacing: 0.05em; color: var(--primary); text-transform: none !important;">
                    {{ admin.showPassword ? admin.password : '••••••••' }}
                  </span>
                  <button 
                    type="button"
                    style="background: none; border: none; padding: 0; cursor: pointer; color: var(--primary); font-size: 0.95rem; line-height: 1; display: inline-flex; align-items: center;" 
                    (click)="admin.showPassword = !admin.showPassword"
                    title="{{ admin.showPassword ? 'Hide Password' : 'Show Password' }}">
                    {{ admin.showPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
              </td>
              <td>{{ admin.createdDate | date:'mediumDate' }}</td>
              <td>
                <span class="badge" [class.badge-success]="admin.isActive" [class.badge-danger]="!admin.isActive">
                  {{ admin.isActive ? 'Active' : 'Deactivated' }}
                </span>
              </td>
              <td style="text-align: right; vertical-align: middle;">
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                  <button class="btn btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="openEditModal(admin)">EDIT DETAILS</button>
                  <button *ngIf="admin.role !== 'SuperAdmin' && admin.username !== 'superadmin'" class="btn btn-danger" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="deleteAdmin(admin)">DELETE</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Admin Modal -->
      <div *ngIf="showAddModal" class="modal-overlay">
        <div class="modal-content">
          <h2>Create Admin Profile</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Registers a new administrative user with standard panel privileges.
          </p>

          <div *ngIf="modalError" class="badge badge-danger" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; justify-content: center; text-transform: none; text-align: center;">
            {{ modalError }}
          </div>

          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" class="form-control" [(ngModel)]="adminForm.username" placeholder="e.g. admin_ramesh" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" class="form-control" [(ngModel)]="adminForm.phone" placeholder="e.g. 9876543210" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-control" [(ngModel)]="adminForm.email" placeholder="e.g. ramesh@mgfleet.com" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Initial Password</label>
            <input type="password" class="form-control" [(ngModel)]="adminForm.password" placeholder="••••••••" />
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn btn-secondary" (click)="closeModals()">CANCEL</button>
            <button class="btn btn-primary" (click)="saveAdmin()">REGISTER ADMIN</button>
          </div>
        </div>
      </div>

      <!-- Edit Admin Modal -->
      <div *ngIf="showEditModal" class="modal-overlay">
        <div class="modal-content">
          <h2>Update Admin Details</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Modify administrator details, access state, or reset their password.
          </p>

          <div *ngIf="modalError" class="badge badge-danger" style="width: 100%; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; justify-content: center; text-transform: none; text-align: center;">
            {{ modalError }}
          </div>

          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" class="form-control" [(ngModel)]="editForm.username" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" class="form-control" [(ngModel)]="editForm.phone" />
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-control" [(ngModel)]="editForm.email" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Reset Password (Optional)</label>
            <input type="password" class="form-control" [(ngModel)]="editForm.password" placeholder="Leave blank to keep current" />
          </div>

          <div class="form-group">
            <label class="form-label">Account Status</label>
            <select class="form-control" [(ngModel)]="editForm.isActive">
              <option [ngValue]="true">Active / Allowed Access</option>
              <option [ngValue]="false">Deactivated / Blocked</option>
            </select>
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
            <button class="btn btn-secondary" (click)="closeModals()">CANCEL</button>
            <button class="btn btn-primary" (click)="updateAdmin()">UPDATE PROFILE</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminManagementComponent implements OnInit {
  admins: any[] = [];
  filteredAdmins: any[] = [];
  searchQuery = '';

  showAddModal = false;
  showEditModal = false;
  modalError = '';
  activeAdminId: number | null = null;

  adminForm = {
    username: '',
    email: '',
    phone: '',
    password: ''
  };

  editForm = {
    username: '',
    email: '',
    phone: '',
    password: '',
    isActive: true
  };

  constructor(private apiService: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadAdmins();
  }

  loadAdmins() {
    console.log('[AdminsControl] Fetching administrators...');
    this.apiService.getAdmins().subscribe({
      next: (res) => {
        console.log('[AdminsControl] API Response:', res);
        if (res.success) {
          this.admins = res.data;
          console.log('[AdminsControl] Loaded admins list:', this.admins);
          this.filterAdmins();
          console.log('[AdminsControl] Filtered admins list:', this.filteredAdmins);
        }
      },
      error: (err) => {
        this.toast.error('Error loading administrators list.');
        console.error('[AdminsControl] Error loading admins:', err);
      }
    });
  }

  filterAdmins() {
    if (!this.searchQuery) {
      this.filteredAdmins = [...this.admins];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredAdmins = this.admins.filter(a => 
      a.username.toLowerCase().includes(query) ||
      (a.email && a.email.toLowerCase().includes(query)) ||
      (a.phone && a.phone.includes(query))
    );
  }

  openAddModal() {
    this.modalError = '';
    this.adminForm = {
      username: '',
      email: '',
      phone: '',
      password: ''
    };
    this.showAddModal = true;
  }

  openEditModal(admin: any) {
    this.modalError = '';
    this.activeAdminId = admin.id;
    this.editForm = {
      username: admin.username,
      email: admin.email,
      phone: admin.phone,
      password: '',
      isActive: admin.isActive
    };
    this.showEditModal = true;
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.modalError = '';
    this.activeAdminId = null;
  }

  saveAdmin() {
    if (!this.adminForm.username || !this.adminForm.password) {
      this.modalError = 'Username and Password are required.';
      return;
    }

    this.apiService.createAdmin(this.adminForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.closeModals();
          this.loadAdmins();
          this.toast.success('Administrator registered successfully.');
        } else {
          this.modalError = res.message || 'Failed to create administrator.';
        }
      },
      error: (err) => {
        this.modalError = err.error?.message || 'Server error creating administrator.';
      }
    });
  }

  updateAdmin() {
    if (!this.editForm.username) {
      this.modalError = 'Username is required.';
      return;
    }

    if (this.activeAdminId) {
      this.apiService.updateAdmin(this.activeAdminId, this.editForm).subscribe({
        next: (res) => {
          if (res.success) {
            this.closeModals();
            this.loadAdmins();
            this.toast.success('Administrator details updated.');
          } else {
            this.modalError = res.message || 'Failed to update administrator.';
          }
        },
        error: (err) => {
          this.modalError = err.error?.message || 'Server error updating administrator.';
        }
      });
    }
  }

  deleteAdmin(admin: any) {
    if (confirm(`Are you sure you want to delete administrator "${admin.username}"?`)) {
      this.apiService.deleteAdmin(admin.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadAdmins();
            this.toast.success('Administrator deleted successfully.');
          } else {
            this.toast.error(res.message || 'Failed to delete administrator.');
          }
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error deleting administrator.');
        }
      });
    }
  }
}
