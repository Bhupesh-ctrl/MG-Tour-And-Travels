import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reports',
  template: `
    <div class="fade-in">
      <div style="margin-bottom: 2rem;" class="reports-title-row">
        <h1 class="text-gradient">Business Intelligence & Reports</h1>
        <p style="color: var(--text-secondary);">Generate, print, and export structured ledger audits for fleet operations</p>
      </div>

      <!-- Report Type Selection Tab Header -->
      <div class="tab-header reports-tab-header" style="display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1.5rem; flex-wrap: wrap;">
        <button [class.active]="activeReportType === 'cab'" (click)="setReportType('cab')">🚕 Cab-wise</button>
        <button [class.active]="activeReportType === 'driver'" (click)="setReportType('driver')">👥 Driver-wise</button>
        <button [class.active]="activeReportType === 'expense'" (click)="setReportType('expense')">💸 Expense Ledger</button>
        <button [class.active]="activeReportType === 'earnings'" (click)="setReportType('earnings')">💰 Earnings Ledger</button>
        <button [class.active]="activeReportType === 'profit'" (click)="setReportType('profit')">📈 Profit/Loss Statement</button>
        <button [class.active]="activeReportType === 'route'" (click)="setReportType('route')">🛣️ Route Analytics</button>
      </div>

      <!-- Filters & Export Header Toolbar -->
      <div class="glass-card reports-filters-toolbar" style="margin-bottom: 2rem; padding: 1.25rem 1.5rem; display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          
          <!-- Date Filter -->
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <span class="form-label" style="font-size: 0.7rem; margin: 0; font-weight:700;">Date Range Filter</span>
            <select class="form-control" style="width: 150px;" [(ngModel)]="dateFilter" (change)="onFilterChange()">
              <option value="all">All Time</option>
              <option value="1day">1 Day (Today)</option>
              <option value="1week">1 Week</option>
              <option value="1month">1 Month</option>
              <option value="1year">1 Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
          
          <!-- Custom Dates Picker -->
          <div *ngIf="dateFilter === 'custom'" style="display: flex; gap: 0.5rem; align-items: center; fade-in">
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
              <span class="form-label" style="font-size: 0.7rem; margin: 0; font-weight:700;">Start Date</span>
              <input type="date" class="form-control" style="width: 130px; padding: 0.5rem;" [(ngModel)]="startDate" (change)="onFilterChange()" />
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
              <span class="form-label" style="font-size: 0.7rem; margin: 0; font-weight:700;">End Date</span>
              <input type="date" class="form-control" style="width: 130px; padding: 0.5rem;" [(ngModel)]="endDate" (change)="onFilterChange()" />
            </div>
          </div>

          <!-- Cab Filter -->
          <div style="display: flex; flex-direction: column; gap: 0.25rem;">
            <span class="form-label" style="font-size: 0.7rem; margin: 0; font-weight:700;">Filter by Cab</span>
            <select class="form-control" style="width: 180px;" [(ngModel)]="selectedCabFilter" (change)="onFilterChange()">
              <option value="all">All Cabs</option>
              <option *ngFor="let cab of cabsList" [value]="cab.vehicleNumber">
                {{ cab.vehicleNumber | uppercase }}
              </option>
            </select>
          </div>
        </div>

        <!-- Action Export Buttons -->
        <div style="display: flex; gap: 0.75rem;" class="reports-header-buttons">
          <button class="btn btn-secondary" style="padding: 0.6rem 1rem; font-size: 0.85rem;" (click)="exportToCsv()">📁 EXPORT TO EXCEL</button>
          <button class="btn btn-primary" style="padding: 0.6rem 1rem; font-size: 0.85rem;" (click)="printReport()">📄 PRINT / SAVE PDF</button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" style="display: flex; align-items: center; justify-content: center; height: 30vh; flex-direction: column; gap: 1rem;">
        <div style="border: 3px solid var(--border-color); border-top-color: var(--primary); width: 30px; height: 30px; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="color: var(--text-secondary); font-weight: 500; font-size:0.9rem;">Compiling Report Data...</p>
      </div>

      <!-- REPORT CONTENTS CONTAINER -->
      <div *ngIf="!loading">
        
        <!-- ==================== REPORT TYPE A: CAB-WISE ==================== -->
        <div *ngIf="activeReportType === 'cab'">
          <!-- Summary Cards -->
          <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 1.5rem;">
            <div class="glass-card summary-card">
              <div class="stats-label">Total Cabs</div>
              <h2 style="color: var(--primary);">{{ cabReportSummary.totalCabs }} Cabs</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Total Fares Earned</div>
              <h2 style="color: var(--text-primary);">{{ cabReportSummary.totalEarnings | currency }}</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Operating Expenses</div>
              <h2 style="color: var(--danger);">{{ cabReportSummary.totalExpenses | currency }}</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Net Cab Profit</div>
              <h2 [style.color]="cabReportSummary.netProfit >= 0 ? 'var(--success)' : 'var(--danger)'">{{ cabReportSummary.netProfit | currency }}</h2>
            </div>
          </div>

          <!-- Cab Data Table -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Vehicle Details</th>
                  <th>Assigned Driver</th>
                  <th>Completed Trips</th>
                  <th>Fuel/Maint Cost</th>
                  <th>Driver Salary</th>
                  <th>Total Fares</th>
                  <th style="text-align: right;">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredCabData.length === 0">
                  <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No cab records found matching search filters.</td>
                </tr>
                <tr *ngFor="let cab of filteredCabData">
                  <td><code style="text-transform: uppercase;">{{ cab.vehicleNumber }}</code></td>
                  <td><strong>{{ cab.make }} {{ cab.model }}</strong> <span style="font-size:0.75rem; color:var(--text-secondary);">({{ cab.fuelType }})</span></td>
                  <td>{{ cab.assignedDriverName || 'Unassigned' }}</td>
                  <td>{{ cab.tripCount }}</td>
                  <td style="color: var(--danger);">{{ cab.totalExpenses | currency }}</td>
                  <td style="color: #bfbbae;">{{ cab.driverSalary | currency }}</td>
                  <td style="color: var(--primary); font-weight: 700;">{{ cab.earnings | currency }}</td>
                  <td style="text-align: right; font-weight: 800;" [style.color]="(cab.earnings - cab.totalExpenses - cab.driverSalary) >= 0 ? 'var(--primary)' : 'var(--danger)'">
                    {{ (cab.earnings - cab.totalExpenses - cab.driverSalary) | currency }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== REPORT TYPE B: DRIVER-WISE ==================== -->
        <div *ngIf="activeReportType === 'driver'">
          <!-- Summary Cards -->
          <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 1.5rem;">
            <div class="glass-card summary-card">
              <div class="stats-label">Total Drivers</div>
              <h2 style="color: var(--primary);">{{ driverReportSummary.totalDrivers }} Drivers</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Trips Logged</div>
              <h2 style="color: var(--text-primary);">{{ driverReportSummary.totalTrips }} Trips</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Total Expenses Claimed</div>
              <h2 style="color: var(--danger);">{{ driverReportSummary.totalClaims | currency }}</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Driver Salaries (base)</div>
              <h2 style="color: var(--accent);">{{ driverReportSummary.totalSalary | currency }}</h2>
            </div>
          </div>

          <!-- Driver Data Table -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Assigned Cab</th>
                  <th>Completed Trips</th>
                  <th>Expense Claims</th>
                  <th>Salary Package</th>
                  <th style="text-align: right;">Target Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredDriverData.length === 0">
                  <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No driver records found matching search filters.</td>
                </tr>
                <tr *ngFor="let driver of filteredDriverData">
                  <td><strong>{{ driver.name }}</strong></td>
                  <td><code *ngIf="driver.cabPlate" style="text-transform: uppercase;">{{ driver.cabPlate }}</code><span *ngIf="!driver.cabPlate" style="color:var(--text-muted)">Unassigned</span></td>
                  <td>{{ driver.completedTrips }}</td>
                  <td style="color: var(--danger);">{{ driver.expenseTotal | currency }}</td>
                  <td style="color: #bfbbae;">{{ driver.salary | currency }}</td>
                  <td style="text-align: right; font-weight: 700;" [style.color]="driver.targetRate !== 'N/A' && driver.targetRate >= 75 ? 'var(--primary)' : '#ffffff'">
                    {{ driver.targetRate !== 'N/A' ? (driver.targetRate + '%') : 'No Targets' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== REPORT TYPE C: EXPENSE ==================== -->
        <div *ngIf="activeReportType === 'expense'">
          <!-- Summary Cards -->
          <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 1.5rem;">
            <div class="glass-card summary-card">
              <div class="stats-label">Approved Claims</div>
              <h2 style="color: var(--primary);">{{ expenseReportSummary.count }} Claims</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Sum Total Expenses</div>
              <h2 style="color: var(--danger);">{{ expenseReportSummary.total | currency }}</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Average Claim Value</div>
              <h2 style="color: var(--text-primary);">{{ expenseReportSummary.average | currency }}</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Highest Single Claim</div>
              <h2 style="color: var(--accent);">{{ expenseReportSummary.max | currency }}</h2>
            </div>
          </div>

          <!-- Category Visual Graph card -->
          <div class="glass-card" style="margin-bottom: 1.5rem; padding: 1.25rem 1.5rem;">
            <h4 style="margin-bottom: 1rem; color: var(--primary);">EXPENSE BY CATEGORY</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
              <div *ngFor="let cat of expenseCategorySums | keyvalue" style="font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                   <strong style="color: var(--text-primary);">{{ getCategoryLabel(cat.key) }}</strong>
                   <span style="color: var(--text-secondary);">{{ cat.value | currency }} ({{ (cat.value / (expenseReportSummary.total || 1)) * 100 | number:'1.0-0' }}%)</span>
                 </div>
                 <div style="background: rgba(197, 155, 39, 0.15); height: 6px; border-radius: 4px;">
                  <div [style.width.%]="(cat.value / (expenseReportSummary.total || 1)) * 100" style="background: var(--primary); height: 6px; border-radius: 4px;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Expense Data Table -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Cab Plate</th>
                  <th>Driver</th>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredExpenseData.length === 0">
                  <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No expenses found matching search filters.</td>
                </tr>
                <tr *ngFor="let exp of filteredExpenseData">
                  <td style="font-size: 0.85rem; color:#bfbbae;">{{ exp.date | date:'mediumDate' }}</td>
                  <td><span class="badge badge-danger">{{ getCategoryLabel(exp.category) }}</span></td>
                  <td><code style="text-transform: uppercase;">{{ exp.cabVehicleNumber }}</code></td>
                  <td><strong>{{ exp.driverName }}</strong></td>
                  <td style="font-size: 0.9rem; color:#dfddd9;">{{ exp.description }}</td>
                  <td style="text-align: right; color: var(--danger); font-weight: 700;">{{ exp.amount | currency }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== REPORT TYPE D: EARNINGS ==================== -->
        <div *ngIf="activeReportType === 'earnings'">
          <!-- Summary Cards -->
          <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 1.5rem;">
            <div class="glass-card summary-card">
              <div class="stats-label">Revenue Triggers</div>
              <h2 style="color: var(--primary);">{{ earningsReportSummary.count }} Bookings</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Gross Revenue Total</div>
              <h2 style="color: var(--primary);">{{ earningsReportSummary.total | currency }}</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Average Trip Fare</div>
              <h2 style="color: var(--text-primary);">{{ earningsReportSummary.average | currency }}</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Highest Single Fare</div>
              <h2 style="color: var(--accent);">{{ earningsReportSummary.max | currency }}</h2>
            </div>
          </div>

          <!-- Earnings Data Table -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source Type</th>
                  <th>Cab Plate</th>
                  <th>Driver Name</th>
                  <th>Description Details</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredRevenueData.length === 0">
                  <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No earnings found matching search filters.</td>
                </tr>
                <tr *ngFor="let rev of filteredRevenueData">
                  <td style="font-size: 0.85rem; color:#bfbbae;">{{ rev.date | date:'mediumDate' }}</td>
                  <td><span class="badge badge-success">{{ rev.source }}</span></td>
                  <td><code *ngIf="rev.vehicleNumber" style="text-transform: uppercase;">{{ rev.vehicleNumber }}</code><span *ngIf="!rev.vehicleNumber" style="color:var(--text-muted)">N/A</span></td>
                  <td><strong>{{ rev.driverName }}</strong></td>
                  <td style="font-size: 0.9rem; color:#dfddd9;">{{ rev.description }}</td>
                  <td style="text-align: right; color: var(--primary); font-weight: 700;">{{ rev.amount | currency }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== REPORT TYPE E: PROFIT & LOSS ==================== -->
        <div *ngIf="activeReportType === 'profit'">
          <!-- Summary Cards -->
          <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 1.5rem;">
            <div class="glass-card summary-card">
              <div class="stats-label">Total Revenue</div>
              <h2 style="color: var(--primary);">{{ profitReportSummary.revenue | currency }}</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Total Operating Cost</div>
              <h2 style="color: var(--danger);">{{ profitReportSummary.expenses | currency }}</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Net profit</div>
              <h2 [style.color]="profitReportSummary.netProfit >= 0 ? 'var(--success)' : 'var(--danger)'">{{ profitReportSummary.netProfit | currency }}</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Profit Margin</div>
              <h2 style="color: var(--primary);">{{ profitReportSummary.margin | number:'1.1-1' }}%</h2>
            </div>
          </div>

          <!-- Profit comparison month table -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Accounting Period (Month)</th>
                  <th>Gross Revenue</th>
                  <th>Operating Cost</th>
                  <th>Calculated Net Profit</th>
                  <th style="text-align: right;">Net Margin Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of analytics.monthlyStats">
                  <td><strong>{{ m.month }}</strong></td>
                  <td style="color: var(--primary);">{{ m.revenue | currency }}</td>
                  <td style="color: var(--danger);">{{ m.expenses | currency }}</td>
                  <td style="font-weight:700;">{{ (m.revenue - m.expenses) | currency }}</td>
                  <td style="text-align: right; font-weight:800;" [style.color]="(m.revenue - m.expenses) >= 0 ? 'var(--primary)' : 'var(--danger)'">
                    {{ m.revenue > 0 ? (((m.revenue - m.expenses) / m.revenue) * 100 | number:'1.1-1') : '0.0' }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== REPORT TYPE F: ROUTE ANALYTICS ==================== -->
        <div *ngIf="activeReportType === 'route'">
          <!-- Summary Cards -->
          <div class="dashboard-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 1.5rem;">
            <div class="glass-card summary-card">
              <div class="stats-label">Tracked Routes</div>
              <h2 style="color: var(--primary);">{{ routeReportSummary.uniqueRoutes }} Routes</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Total Runs</div>
              <h2 style="color: var(--text-primary);">{{ routeReportSummary.totalRuns }} Runs</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Completed Shifts</div>
              <h2 style="color: var(--success);">{{ routeReportSummary.completedRuns }} Completed</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Completion Rate</div>
              <h2 [style.color]="routeReportSummary.completionRate >= 80 ? 'var(--success)' : (routeReportSummary.completionRate >= 50 ? 'var(--primary)' : 'var(--danger)')">{{ routeReportSummary.completionRate | number:'1.1-1' }}%</h2>
            </div>
          </div>

          <!-- Route Data Table -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Route (Start ➜ Destination)</th>
                  <th>Total Booked</th>
                  <th>Completed Runs</th>
                  <th>Cancelled Shifts</th>
                  <th>Odometer Avg Distance</th>
                  <th>Completion Rate</th>
                  <th style="text-align: right;">Total Fares Earned</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredRouteData.length === 0">
                  <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No trip logs recorded to generate route metrics.</td>
                </tr>
                <tr *ngFor="let r of filteredRouteData">
                  <td><strong>{{ r.route }}</strong></td>
                  <td>{{ r.total }}</td>
                  <td style="color: var(--success);">{{ r.completed }}</td>
                  <td style="color: var(--danger);">{{ r.cancelled }}</td>
                  <td style="color: #bfbbae;">{{ r.avgDistance | number:'1.0-0' }} km</td>
                  <td>
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                      <span style="font-weight:700;" [style.color]="r.rate >= 80 ? 'var(--success)' : (r.rate >= 50 ? 'var(--primary)' : 'var(--danger)')">{{ r.rate | number:'1.0-0' }}%</span>
                      <div style="background: rgba(255,255,255,0.06); height: 4px; width: 60px; border-radius: 4px;">
                        <div [style.width.%]="r.rate" [style.background]="r.rate >= 80 ? 'var(--success)' : (r.rate >= 50 ? 'var(--primary)' : 'var(--danger)')" style="height: 4px; border-radius: 4px;"></div>
                      </div>
                    </div>
                  </td>
                  <td style="text-align: right; color: var(--primary); font-weight: 700;">{{ r.earnings | currency }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .summary-card {
      padding: 1.25rem 1.5rem;
      background: rgba(255,255,255,0.02);
      border-color: rgba(197, 155, 39, 0.15);
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ReportsComponent implements OnInit {
  activeReportType: 'cab' | 'driver' | 'expense' | 'earnings' | 'profit' | 'route' = 'cab';
  loading = true;

  // Filter toolbar bindings
  dateFilter = 'all';
  startDate = '';
  endDate = '';
  selectedCabFilter = 'all';

  // Base datasets
  analytics: any = null;
  cabsList: any[] = [];
  driversList: any[] = [];
  expensesList: any[] = [];
  revenueList: any[] = [];
  tripsList: any[] = [];
  targetsList: any[] = [];

  // Filtered lists for rendering
  filteredCabData: any[] = [];
  filteredDriverData: any[] = [];
  filteredExpenseData: any[] = [];
  filteredRevenueData: any[] = [];
  filteredRouteData: any[] = [];

  // Report Summary Objects
  cabReportSummary = { totalCabs: 0, totalEarnings: 0, totalExpenses: 0, netProfit: 0 };
  driverReportSummary = { totalDrivers: 0, totalTrips: 0, totalClaims: 0, totalSalary: 0 };
  expenseReportSummary = { count: 0, total: 0, average: 0, max: 0 };
  earningsReportSummary = { count: 0, total: 0, average: 0, max: 0 };
  profitReportSummary = { revenue: 0, expenses: 0, netProfit: 0, margin: 0 };
  routeReportSummary = { uniqueRoutes: 0, totalRuns: 0, completedRuns: 0, completionRate: 0 };

  // Expense categories helper
  expenseCategorySums: { [key: string]: number } = {};

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadAllReportData();
  }

  loadAllReportData() {
    this.loading = true;
    
    // Fetch all core datasets concurrently
    forkJoin({
      analytics: this.apiService.getDashboardAnalytics(),
      cabs: this.apiService.getCabsDetails(),
      drivers: this.apiService.getDrivers(1, 1000, '', '', 'name', 'asc'),
      expenses: this.apiService.getExpenseDetails(),
      revenue: this.apiService.getRevenueDetails(),
      trips: this.apiService.getTrips(1, 1000, ''),
      targets: this.apiService.getTargets()
    }).subscribe({
      next: (res: any) => {
        this.analytics = res.analytics.data;
        this.cabsList = res.cabs.data;
        this.driversList = res.drivers.data.items;
        this.expensesList = res.expenses.data;
        this.revenueList = res.revenue.data;
        this.tripsList = res.trips.data.items;
        this.targetsList = res.targets.data;

        this.loading = false;
        this.onFilterChange();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading report datasets', err);
      }
    });
  }

  setReportType(type: 'cab' | 'driver' | 'expense' | 'earnings' | 'profit' | 'route') {
    this.activeReportType = type;
    this.onFilterChange();
  }

  onFilterChange() {
    this.compileCabReport();
    this.compileDriverReport();
    this.compileExpenseReport();
    this.compileEarningsReport();
    this.compileProfitReport();
    this.compileRouteReport();
  }

  // --- FILTER HELPERS ---
  isDateInRange(dateStr: string | Date): boolean {
    if (this.dateFilter === 'all') return true;
    
    const date = new Date(dateStr);
    const now = new Date();
    
    if (this.dateFilter === '1day') {
      return date.toDateString() === now.toDateString();
    } else if (this.dateFilter === '1week') {
      const oneWeekAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);
      return date >= oneWeekAgo;
    } else if (this.dateFilter === '1month') {
      const oneMonthAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
      return date >= oneMonthAgo;
    } else if (this.dateFilter === '1year') {
      const oneYearAgo = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365);
      return date >= oneYearAgo;
    } else if (this.dateFilter === 'custom') {
      if (!this.startDate) return true;
      const start = new Date(this.startDate);
      const end = this.endDate ? new Date(this.endDate) : new Date();
      // Ensure time borders are correct
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return date >= start && date <= end;
    }
    return true;
  }

  // --- REPORT COMPILATION LOGIC ---

  compileCabReport() {
    let raw = this.cabsList.map(cab => {
      // Calculate earnings and expenses for this cab based on filters
      const cabRevenue = this.revenueList
        .filter(r => r.vehicleNumber === cab.vehicleNumber && this.isDateInRange(r.date))
        .reduce((sum, r) => sum + r.amount, 0);

      const cabExpenses = this.expensesList
        .filter(e => e.cabVehicleNumber === cab.vehicleNumber && this.isDateInRange(e.date))
        .reduce((sum, e) => sum + e.amount, 0);

      const tripCount = this.tripsList
        .filter(t => t.vehicleNumber === cab.vehicleNumber && t.status === 2 && this.isDateInRange(t.startTime))
        .length;

      return {
        ...cab,
        earnings: cabRevenue,
        totalExpenses: cabExpenses,
        tripCount: tripCount
      };
    });

    if (this.selectedCabFilter !== 'all') {
      raw = raw.filter(c => c.vehicleNumber === this.selectedCabFilter);
    }

    this.filteredCabData = raw;

    // Summarize
    this.cabReportSummary = {
      totalCabs: raw.length,
      totalEarnings: raw.reduce((sum, c) => sum + c.earnings, 0),
      totalExpenses: raw.reduce((sum, c) => sum + c.totalExpenses, 0),
      netProfit: raw.reduce((sum, c) => sum + (c.earnings - c.totalExpenses - c.driverSalary), 0)
    };
  }

  compileDriverReport() {
    let raw = this.driversList.map(driver => {
      // Completed Trips
      const completedTrips = this.tripsList
        .filter(t => t.driverId === driver.id && t.status === 2 && this.isDateInRange(t.startTime) &&
          (this.selectedCabFilter === 'all' || t.vehicleNumber === this.selectedCabFilter))
        .length;

      // Expenses Claimed
      const expenseTotal = this.expensesList
        .filter(e => e.driverName === driver.name && this.isDateInRange(e.date) &&
          (this.selectedCabFilter === 'all' || e.cabVehicleNumber === this.selectedCabFilter))
        .reduce((sum, e) => sum + e.amount, 0);

      // Target rate
      const driverTargets = this.targetsList.filter(t => t.driverId === driver.id);
      const completedTargets = driverTargets.filter(t => t.status === 1).length;
      const targetRate = driverTargets.length > 0 ? Math.round((completedTargets / driverTargets.length) * 100) : 'N/A';

      // Associated cab plate if any
      const cab = this.cabsList.find(c => c.assignedDriverName === driver.name);

      return {
        name: driver.name,
        cabPlate: cab?.vehicleNumber,
        completedTrips,
        expenseTotal,
        salary: driver.salary || 0,
        targetRate
      };
    });

    if (this.selectedCabFilter !== 'all') {
      raw = raw.filter(d => d.cabPlate === this.selectedCabFilter);
    }

    this.filteredDriverData = raw;

    // Summarize
    this.driverReportSummary = {
      totalDrivers: raw.length,
      totalTrips: raw.reduce((sum, d) => sum + d.completedTrips, 0),
      totalClaims: raw.reduce((sum, d) => sum + d.expenseTotal, 0),
      totalSalary: raw.reduce((sum, d) => sum + d.salary, 0)
    };
  }

  compileExpenseReport() {
    let raw = this.expensesList.filter(e => this.isDateInRange(e.date));

    if (this.selectedCabFilter !== 'all') {
      raw = raw.filter(e => e.cabVehicleNumber === this.selectedCabFilter);
    }

    this.filteredExpenseData = raw;

    // Summarize
    const total = raw.reduce((sum, e) => sum + e.amount, 0);
    const count = raw.length;
    const average = count > 0 ? total / count : 0;
    const max = count > 0 ? Math.max(...raw.map(e => e.amount)) : 0;

    this.expenseReportSummary = { count, total, average, max };

    // Group categories sum
    this.expenseCategorySums = {};
    raw.forEach(e => {
      const cat = e.category || 'Other';
      this.expenseCategorySums[cat] = (this.expenseCategorySums[cat] || 0) + e.amount;
    });
  }

  compileEarningsReport() {
    let raw = this.revenueList.filter(r => this.isDateInRange(r.date));

    if (this.selectedCabFilter !== 'all') {
      raw = raw.filter(r => r.vehicleNumber === this.selectedCabFilter);
    }

    this.filteredRevenueData = raw;

    // Summarize
    const total = raw.reduce((sum, r) => sum + r.amount, 0);
    const count = raw.length;
    const average = count > 0 ? total / count : 0;
    const max = count > 0 ? Math.max(...raw.map(r => r.amount)) : 0;

    this.earningsReportSummary = { count, total, average, max };
  }

  compileProfitReport() {
    // Calculated based on revenue and expenses in range
    const revenue = this.revenueList
      .filter(r => this.isDateInRange(r.date) && (this.selectedCabFilter === 'all' || r.vehicleNumber === this.selectedCabFilter))
      .reduce((sum, r) => sum + r.amount, 0);

    const expenses = this.expensesList
      .filter(e => this.isDateInRange(e.date) && (this.selectedCabFilter === 'all' || e.cabVehicleNumber === this.selectedCabFilter))
      .reduce((sum, e) => sum + e.amount, 0);

    const netProfit = revenue - expenses;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    this.profitReportSummary = { revenue, expenses, netProfit, margin };
  }

  compileRouteReport() {
    // Map completed trips into routes
    const completedTrips = this.tripsList.filter(t => t.status === 2 && this.isDateInRange(t.startTime) && 
      (this.selectedCabFilter === 'all' || t.vehicleNumber === this.selectedCabFilter));

    const allTripsFiltered = this.tripsList.filter(t => this.isDateInRange(t.startTime) && 
      (this.selectedCabFilter === 'all' || t.vehicleNumber === this.selectedCabFilter));

    const routesMap = new Map<string, any>();

    allTripsFiltered.forEach(trip => {
      if (!trip.startLocation || !trip.endLocation) return;
      const key = `${trip.startLocation} ➜ ${trip.endLocation}`;
      if (!routesMap.has(key)) {
        routesMap.set(key, { route: key, total: 0, completed: 0, cancelled: 0, earnings: 0, totalDist: 0 });
      }

      const r = routesMap.get(key);
      r.total++;
      if (trip.status === 2) { // Completed
        r.completed++;
        r.earnings += trip.fareAmount || 0;
        if (trip.endOdometer && trip.startOdometer) {
          r.totalDist += (trip.endOdometer - trip.startOdometer);
        }
      } else if (trip.status === 3) { // Cancelled
        r.cancelled++;
      }
    });

    const raw = Array.from(routesMap.values()).map(r => {
      return {
        ...r,
        rate: r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0,
        avgDistance: r.completed > 0 ? r.totalDist / r.completed : 0
      };
    });

    this.filteredRouteData = raw;

    // Summarize
    const totalRuns = raw.reduce((sum, r) => sum + r.total, 0);
    const completedRuns = raw.reduce((sum, r) => sum + r.completed, 0);
    const completionRate = totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0;

    this.routeReportSummary = {
      uniqueRoutes: raw.length,
      totalRuns,
      completedRuns,
      completionRate
    };
  }

  // --- HELPER TRANSLATORS ---

  getCategoryLabel(cat: any): string {
    if (typeof cat === 'number') {
      switch (cat) {
        case 0: return 'Fuel / CNG';
        case 1: return 'Maintenance';
        case 2: return 'Tolls';
        case 3: return 'Insurance';
        case 4: return 'Other';
        default: return 'Custom';
      }
    }
    return cat;
  }

  getCabStatusLabel(status: number): string {
    switch (status) {
      case 0: return 'Active';
      case 1: return 'Maintenance';
      case 2: return 'OutOfService';
      default: return 'Unknown';
    }
  }

  // --- EXPORT UTILITIES ---

  getReportFilenameLabel(type: string): string {
    switch (type) {
      case 'cab': return 'Cab_Wise';
      case 'driver': return 'Driver_Wise';
      case 'expense': return 'Expense_Ledger';
      case 'earnings': return 'Earnings_Ledger';
      case 'profit': return 'Profit_Loss_Statement';
      case 'route': return 'Route_Analytics';
      default: return 'Business_Report';
    }
  }

  exportToCsv() {
    let csvContent = "data:text/csv;charset=utf-8,";
    let headers: string[] = [];
    let rows: any[] = [];
    
    const dateStr = new Date().toISOString().slice(0, 10);
    const label = this.getReportFilenameLabel(this.activeReportType);
    const filename = `MG_Tour_Travels_${label}_Report_${dateStr}.csv`;

    if (this.activeReportType === 'cab') {
      headers = ['Plate Number', 'Vehicle Details', 'Assigned Driver', 'Completed Trips', 'Fuel/Maint Cost', 'Driver Salary', 'Total Fares', 'Net Profit'];
      rows = this.filteredCabData.map(c => [
        c.vehicleNumber.toUpperCase(),
        `${c.make} ${c.model}`,
        c.assignedDriverName || 'Unassigned',
        c.tripCount,
        c.totalExpenses,
        c.driverSalary,
        c.earnings,
        c.earnings - c.totalExpenses - c.driverSalary
      ]);
    } else if (this.activeReportType === 'driver') {
      headers = ['Driver Name', 'Assigned Cab', 'Completed Trips', 'Expense Claims', 'Salary Package', 'Target Rate'];
      rows = this.filteredDriverData.map(d => [
        d.name,
        d.cabPlate ? d.cabPlate.toUpperCase() : 'Unassigned',
        d.completedTrips,
        d.expenseTotal,
        d.salary,
        d.targetRate !== 'N/A' ? `${d.targetRate}%` : 'No Targets'
      ]);
    } else if (this.activeReportType === 'expense') {
      headers = ['Date', 'Category', 'Cab Plate', 'Driver', 'Description', 'Amount'];
      rows = this.filteredExpenseData.map(e => [
        new Date(e.date).toLocaleDateString(),
        this.getCategoryLabel(e.category),
        e.cabVehicleNumber.toUpperCase(),
        e.driverName,
        e.description,
        e.amount
      ]);
    } else if (this.activeReportType === 'earnings') {
      headers = ['Date', 'Source Type', 'Cab Plate', 'Driver Name', 'Description Details', 'Amount'];
      rows = this.filteredRevenueData.map(r => [
        new Date(r.date).toLocaleDateString(),
        r.source,
        r.vehicleNumber ? r.vehicleNumber.toUpperCase() : 'N/A',
        r.driverName,
        r.description,
        r.amount
      ]);
    } else if (this.activeReportType === 'profit') {
      headers = ['Accounting Period', 'Gross Revenue', 'Operating Cost', 'Calculated Net Profit', 'Net Margin Rate'];
      rows = this.analytics.monthlyStats.map((m: any) => [
        m.month,
        m.revenue,
        m.expenses,
        m.revenue - m.expenses,
        m.revenue > 0 ? `${Math.round(((m.revenue - m.expenses) / m.revenue) * 100)}%` : '0%'
      ]);
    } else if (this.activeReportType === 'route') {
      headers = ['Route', 'Total Booked', 'Completed Runs', 'Cancelled Shifts', 'Avg Distance', 'Completion Rate', 'Total Fares'];
      rows = this.filteredRouteData.map(r => [
        r.route,
        r.total,
        r.completed,
        r.cancelled,
        `${Math.round(r.avgDistance)} km`,
        `${r.rate}%`,
        r.earnings
      ]);
    }

    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map((v: any) => typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printReport() {
    const originalTitle = document.title;
    const dateStr = new Date().toISOString().slice(0, 10);
    const label = this.getReportFilenameLabel(this.activeReportType);
    document.title = `MG_Tour_Travels_${label}_Report_${dateStr}`;
    
    window.print();
    
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  }
}
