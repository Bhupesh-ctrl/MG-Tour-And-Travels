import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-audit-trail',
  template: `
    <div class="fade-in">
      <div style="margin-bottom: 2rem;">
        <h1>Security Audit Trail</h1>
        <p style="color: var(--text-secondary);">Historical timeline of database entity alterations for oversight and compliance</p>
      </div>

      <div class="table-container glass-card" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Operator</th>
              <th>Target Table</th>
              <th>Operation</th>
              <th>Primary Keys</th>
              <th>Changes Details</th>
            </tr>
            <!-- Column-specific filters -->
            <tr style="background: rgba(255,255,255,0.01);">
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Date..." [(ngModel)]="filters.changedDate" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Operator..." [(ngModel)]="filters.changedBy" (input)="applyFilters()" />
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Table..." [(ngModel)]="filters.tableName" (input)="applyFilters()" />
              </td>
              <td>
                <select class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" [(ngModel)]="filters.action" (change)="applyFilters()">
                  <option value="">All</option>
                  <option value="Create">Create</option>
                  <option value="Update">Update</option>
                  <option value="Delete">Delete</option>
                </select>
              </td>
              <td>
                <input type="text" class="form-control" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; height: auto;" placeholder="Filter Keys..." [(ngModel)]="filters.keyValues" (input)="applyFilters()" />
              </td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="logs.length === 0">
              <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                No audit logs matching search filters.
              </td>
            </tr>
            <ng-container *ngFor="let log of logs">
              <tr (click)="toggleDetails(log.id)" style="cursor: pointer;">
                <td>{{ log.changedDate | date:'medium' }}</td>
                <td><span style="color: var(--accent); font-weight: 600;">{{ log.changedBy }}</span></td>
                <td><code>{{ log.tableName }}</code></td>
                <td>
                  <span class="badge" [class.badge-success]="log.action === 'Create'" [class.badge-warning]="log.action === 'Update'" [class.badge-danger]="log.action === 'Delete'">
                    {{ log.action }}
                  </span>
                </td>
                <td><small style="color: var(--text-secondary);">{{ log.keyValues }}</small></td>
                <td>
                  <button class="btn btn-secondary" style="padding: 0.3rem 0.5rem; font-size: 0.75rem;">
                    {{ expandedLogId === log.id ? 'HIDE DETAILS' : 'SHOW DETAILS' }}
                  </button>
                </td>
              </tr>
              <!-- Expanded Details Row -->
              <tr *ngIf="expandedLogId === log.id" style="background: rgba(255, 255, 255, 0.02);">
                <td colspan="6" style="padding: 1.5rem 2rem;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <!-- Old Values -->
                    <div>
                      <h5 style="color: var(--text-muted); margin-bottom: 0.5rem;">Pre-Operation Values (Old)</h5>
                      <pre style="background: var(--bg-primary); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); color: #ff8389; font-size: 0.85rem; overflow-x: auto; white-space: pre-wrap;">{{ formatJson(log.oldValues) }}</pre>
                    </div>
                    <!-- New Values -->
                    <div>
                      <h5 style="color: var(--text-muted); margin-bottom: 0.5rem;">Post-Operation Values (New)</h5>
                      <pre style="background: var(--bg-primary); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); color: #42be65; font-size: 0.85rem; overflow-x: auto; white-space: pre-wrap;">{{ formatJson(log.newValues) }}</pre>
                    </div>
                  </div>
                </td>
              </tr>
            </ng-container>
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
export class AuditTrailComponent implements OnInit {
  logs: any[] = [];
  allLogs: any[] = [];
  filteredLogs: any[] = [];
  expandedLogId: number | null = null;

  filters = {
    changedDate: '',
    changedBy: '',
    tableName: '',
    action: '',
    keyValues: ''
  };

  page = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 1;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.apiService.getAuditLogs(1, 1000).subscribe({
      next: (res) => {
        if (res.success) {
          this.allLogs = res.data.items;
          this.applyFilters();
        }
      },
      error: (err) => {
        console.error('Error loading audit logs', err);
      }
    });
  }

  applyFilters() {
    this.filteredLogs = this.allLogs.filter(log => {
      const matchDate = !this.filters.changedDate || 
        new Date(log.changedDate).toLocaleDateString().toLowerCase().includes(this.filters.changedDate.toLowerCase()) ||
        new Date(log.changedDate).toLocaleTimeString().toLowerCase().includes(this.filters.changedDate.toLowerCase());

      const matchOperator = !this.filters.changedBy || log.changedBy.toLowerCase().includes(this.filters.changedBy.toLowerCase());

      const matchTable = !this.filters.tableName || log.tableName.toLowerCase().includes(this.filters.tableName.toLowerCase());

      const matchAction = !this.filters.action || log.action.toLowerCase() === this.filters.action.toLowerCase();

      const matchKeys = !this.filters.keyValues || log.keyValues.toLowerCase().includes(this.filters.keyValues.toLowerCase());

      return matchDate && matchOperator && matchTable && matchAction && matchKeys;
    });

    this.totalCount = this.filteredLogs.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize) || 1;
    this.paginate();
  }

  paginate() {
    const startIndex = (this.page - 1) * this.pageSize;
    this.logs = this.filteredLogs.slice(startIndex, startIndex + this.pageSize);
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

  toggleDetails(id: number) {
    if (this.expandedLogId === id) {
      this.expandedLogId = null;
    } else {
      this.expandedLogId = id;
    }
  }

  formatJson(jsonStr: string): string {
    if (!jsonStr) return 'N/A (Property Unchanged/Created)';
    try {
      const obj = JSON.parse(jsonStr);
      return JSON.stringify(obj, null, 2);
    } catch {
      return jsonStr;
    }
  }
}
