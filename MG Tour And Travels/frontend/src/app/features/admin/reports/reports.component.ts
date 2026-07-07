import { Component, OnInit, HostListener } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-reports',
  template: `
    <div class="fade-in">
      <div style="margin-bottom: 2rem;" class="reports-title-row">
        <h1 class="text-gradient">Business Intelligence & Reports</h1>
        <p class="no-print" style="color: var(--text-secondary);">Generate, print, and export structured ledger audits for fleet operations</p>
      </div>

      <!-- Print-only Date and Cab details -->
      <div class="print-only" style="margin-bottom: 2rem; color: #000000; font-size: 1rem; font-family: sans-serif; line-height: 1.5; border-bottom: 1px solid #ccc; padding-bottom: 1rem;">
        <div><strong>Date:</strong> {{ getFormattedPrintDateRange() }}</div>
        <div style="margin-top: 0.25rem;"><strong>Cab:</strong> {{ getSelectedCabsLabelForPrint() }}</div>
      </div>

      <!-- Report Type Selection Tab Header -->
      <div class="tab-header reports-tab-header no-print" style="display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1.5rem; flex-wrap: wrap;">
        <button [class.active]="activeReportType === 'cab'" (click)="setReportType('cab')">🚕 Cab-wise</button>
        <button [class.active]="activeReportType === 'driver'" (click)="setReportType('driver')">👥 Driver-wise</button>
        <button [class.active]="activeReportType === 'expense'" (click)="setReportType('expense')">💸 Expense Ledger</button>
        <button [class.active]="activeReportType === 'earnings'" (click)="setReportType('earnings')">💰 Earnings Ledger</button>
        <button [class.active]="activeReportType === 'profit'" (click)="setReportType('profit')">📈 Profit/Loss Statement</button>
        <button [class.active]="activeReportType === 'route'" (click)="setReportType('route')">🛣️ Route Analytics</button>
      </div>

      <!-- Filters & Export Header Toolbar -->
      <div class="glass-card reports-filters-toolbar no-print" style="margin-bottom: 2rem; padding: 1.25rem 1.5rem; display: flex; gap: 1rem; align-items: center; justify-content: space-between; flex-wrap: wrap; position: relative; z-index: 1001;">
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          
          <!-- Date Filter (Custom Dropdown) -->
          <div style="display: flex; flex-direction: column; gap: 0.25rem; position: relative;">
            <span class="form-label" style="font-size: 0.7rem; margin: 0; font-weight:700;">Date Range Filter</span>
            <div 
              class="form-control" 
              style="width: 170px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: rgba(197, 155, 39, 0.02); border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; height: 45px;"
              (click)="toggleDateDropdown($event)"
            >
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px;">
                {{ getDateFilterLabel() }}
              </span>
              <span style="font-size: 0.7rem; color: var(--primary);">▼</span>
            </div>

            <div 
              *ngIf="isDateDropdownOpen" 
              class="glass-card" 
              style="position: absolute; top: 100%; left: 0; width: 180px; z-index: 1000; padding: 0.5rem; background: #121212; border: 1px solid var(--primary); margin-top: 0.25rem; display: flex; flex-direction: column; gap: 0.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"
              (click)="$event.stopPropagation()"
            >
              <div (click)="setDateFilter('all')" [style.background]="dateFilter === 'all' ? 'rgba(197,155,39,0.15)' : (hoveredDateOpt === 'all' ? 'rgba(255,255,255,0.05)' : 'transparent')" [style.color]="dateFilter === 'all' ? 'var(--primary)' : '#dfddd9'" (mouseenter)="hoveredDateOpt = 'all'" (mouseleave)="hoveredDateOpt = ''" style="padding: 0.5rem 0.75rem; cursor: pointer; border-radius: 4px; font-size: 0.875rem; font-weight: 600; transition: background 0.2s;">All Time</div>
              <div (click)="setDateFilter('1day')" [style.background]="dateFilter === '1day' ? 'rgba(197,155,39,0.15)' : (hoveredDateOpt === '1day' ? 'rgba(255,255,255,0.05)' : 'transparent')" [style.color]="dateFilter === '1day' ? 'var(--primary)' : '#dfddd9'" (mouseenter)="hoveredDateOpt = '1day'" (mouseleave)="hoveredDateOpt = ''" style="padding: 0.5rem 0.75rem; cursor: pointer; border-radius: 4px; font-size: 0.875rem; font-weight: 600; transition: background 0.2s;">1 Day (Today)</div>
              <div (click)="setDateFilter('1week')" [style.background]="dateFilter === '1week' ? 'rgba(197,155,39,0.15)' : (hoveredDateOpt === '1week' ? 'rgba(255,255,255,0.05)' : 'transparent')" [style.color]="dateFilter === '1week' ? 'var(--primary)' : '#dfddd9'" (mouseenter)="hoveredDateOpt = '1week'" (mouseleave)="hoveredDateOpt = ''" style="padding: 0.5rem 0.75rem; cursor: pointer; border-radius: 4px; font-size: 0.875rem; font-weight: 600; transition: background 0.2s;">1 Week</div>
              <div (click)="setDateFilter('1month')" [style.background]="dateFilter === '1month' ? 'rgba(197,155,39,0.15)' : (hoveredDateOpt === '1month' ? 'rgba(255,255,255,0.05)' : 'transparent')" [style.color]="dateFilter === '1month' ? 'var(--primary)' : '#dfddd9'" (mouseenter)="hoveredDateOpt = '1month'" (mouseleave)="hoveredDateOpt = ''" style="padding: 0.5rem 0.75rem; cursor: pointer; border-radius: 4px; font-size: 0.875rem; font-weight: 600; transition: background 0.2s;">1 Month</div>
              <div (click)="setDateFilter('1year')" [style.background]="dateFilter === '1year' ? 'rgba(197,155,39,0.15)' : (hoveredDateOpt === '1year' ? 'rgba(255,255,255,0.05)' : 'transparent')" [style.color]="dateFilter === '1year' ? 'var(--primary)' : '#dfddd9'" (mouseenter)="hoveredDateOpt = '1year'" (mouseleave)="hoveredDateOpt = ''" style="padding: 0.5rem 0.75rem; cursor: pointer; border-radius: 4px; font-size: 0.875rem; font-weight: 600; transition: background 0.2s;">1 Year</div>
              <div (click)="setDateFilter('custom')" [style.background]="dateFilter === 'custom' ? 'rgba(197,155,39,0.15)' : (hoveredDateOpt === 'custom' ? 'rgba(255,255,255,0.05)' : 'transparent')" [style.color]="dateFilter === 'custom' ? 'var(--primary)' : '#dfddd9'" (mouseenter)="hoveredDateOpt = 'custom'" (mouseleave)="hoveredDateOpt = ''" style="padding: 0.5rem 0.75rem; cursor: pointer; border-radius: 4px; font-size: 0.875rem; font-weight: 600; transition: background 0.2s;">Custom Date Range</div>
            </div>
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

          <!-- Cab Filter (Multi-Select) -->
          <div style="display: flex; flex-direction: column; gap: 0.25rem; position: relative;">
            <span class="form-label" style="font-size: 0.7rem; margin: 0; font-weight:700;">Filter by Cab</span>
            <div 
              class="form-control" 
              style="width: 220px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: rgba(197, 155, 39, 0.02); border: 1px solid var(--border-color); color: var(--text-primary); padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; height: 45px;"
              (click)="toggleCabDropdown($event)"
            >
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px;">
                {{ getSelectedCabsLabel() }}
              </span>
              <span style="font-size: 0.7rem; color: var(--primary);">▼</span>
            </div>

            <div 
              *ngIf="isCabDropdownOpen" 
              class="glass-card" 
              style="position: absolute; top: 100%; left: 0; width: 250px; max-height: 250px; overflow-y: auto; z-index: 1000; padding: 0.75rem; background: #121212; border: 1px solid var(--primary); margin-top: 0.25rem; display: flex; flex-direction: column; gap: 0.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.5);"
              (click)="$event.stopPropagation()"
            >
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #ffffff; font-size: 0.85rem; padding: 0.25rem; margin: 0;">
                <input 
                  type="checkbox" 
                  [checked]="isAllCabsSelected()" 
                  (change)="toggleSelectAllCabs($event)" 
                  style="cursor: pointer;"
                />
                <strong>All Cabs</strong>
              </label>
              
              <hr style="margin: 0.25rem 0; border: none; border-top: 1px solid rgba(255, 255, 255, 0.1);" />

              <label 
                *ngFor="let cab of cabsList" 
                style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #dfddd9; font-size: 0.85rem; padding: 0.25rem; margin: 0;"
              >
                <input 
                  type="checkbox" 
                  [checked]="isCabSelectedInFilter(cab.vehicleNumber || cab.VehicleNumber)" 
                  (change)="toggleCabSelection(cab.vehicleNumber || cab.VehicleNumber, $event)" 
                  style="cursor: pointer;"
                />
                {{ (cab.vehicleNumber || cab.VehicleNumber) | uppercase }}
              </label>
            </div>
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
                  <td style="text-align: right; font-weight: 800;" [style.color]="(cab.earnings - cab.totalExpenses) >= 0 ? 'var(--primary)' : 'var(--danger)'">
                    {{ (cab.earnings - cab.totalExpenses) | currency }}
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
                  <td><code style="text-transform: uppercase;">{{ exp.cabVehicleNumber || 'General' }}</code></td>
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
              <div class="stats-label">Guard Routes</div>
              <h2 style="color: var(--primary);">{{ routeReportSummary.guardRoutes }} Routes</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Total Trips</div>
              <h2 style="color: var(--text-primary);">{{ routeReportSummary.totalTrips }} Trips</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Gurgaon Routes</div>
              <h2 style="color: var(--success);">{{ routeReportSummary.gurgaonRoutes }} Gurgaon</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Delhi Routes</div>
              <h2 style="color: var(--accent);">{{ routeReportSummary.delhiRoutes }} Delhi</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Faridabad Routes</div>
              <h2 style="color: #bfbbae;">{{ routeReportSummary.faridabadRoutes }} Faridabad</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Manesar Routes</div>
              <h2 style="color: #dfddd9;">{{ routeReportSummary.manesarRoutes }} Manesar</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Noida Routes</div>
              <h2 style="color: var(--primary);">{{ routeReportSummary.noidaRoutes }} Noida</h2>
            </div>
            <div class="glass-card summary-card">
              <div class="stats-label">Ghaziabad Routes</div>
              <h2 style="color: var(--success);">{{ routeReportSummary.ghaziabadRoutes }} Ghaziabad</h2>
            </div>
          </div>

          <!-- Route Data Table -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Cab No</th>
                  <th>Trip ID</th>
                  <th>Route Type</th>
                  <th>Service Type</th>
                  <th>Route (Start ➜ Destination)</th>
                  <th>Guard</th>
                  <th>Toll</th>
                  <th style="text-align: right;">Distance travelled</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredRouteData.length === 0">
                  <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No trip logs recorded to generate route metrics.</td>
                </tr>
                <tr *ngFor="let trip of filteredRouteData">
                  <td style="font-size: 0.85rem; color:#bfbbae;">{{ trip.startTime | date:'mediumDate' }}</td>
                  <td><code style="text-transform: uppercase;">{{ trip.vehicleNumber }}</code></td>
                  <td><strong>#{{ trip.vendorTripId || trip.id }}</strong></td>
                  <td>{{ trip.routeType }}</td>
                  <td><span class="badge" [class.badge-success]="trip.pickupOrDrop === 'Pickup'" [class.badge-info]="trip.pickupOrDrop === 'Drop'">{{ trip.pickupOrDrop }}</span></td>
                  <td><strong>{{ trip.startLocation }} ➜ {{ trip.endLocation || '...' }}</strong></td>
                  <td>
                    <span class="badge" [class.badge-success]="trip.isGuardRoute" [class.badge-secondary]="!trip.isGuardRoute">
                      {{ trip.isGuardRoute ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-success]="trip.isTollRoute" [class.badge-secondary]="!trip.isTollRoute">
                      {{ trip.isTollRoute ? 'Yes' : 'No' }}
                    </span>
                  </td>
                  <td style="text-align: right; font-weight: 700; color: #bfbbae;">
                    {{ trip.endOdometer && trip.startOdometer ? (trip.endOdometer - trip.startOdometer) + ' km' : '0 km' }}
                  </td>
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

    .print-only {
      display: none;
    }

    @media print {
      .no-print {
        display: none !important;
      }
      .print-only {
        display: block !important;
      }
      body {
        background: #ffffff !important;
        color: #000000 !important;
      }
      .glass-card, .table-container, table, th, td {
        background: transparent !important;
        color: #000000 !important;
        border-color: #cccccc !important;
      }
    }
  `]
})
export class ReportsComponent implements OnInit {
  activeReportType: 'cab' | 'driver' | 'expense' | 'earnings' | 'profit' | 'route' = 'cab';
  loading = true;

  // Filter toolbar bindings
  dateFilter = 'all';
  startDate = '';
  endDate = '';
  selectedCabFilter: string[] = ['all'];

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
  routeReportSummary = {
    guardRoutes: 0,
    totalTrips: 0,
    gurgaonRoutes: 0,
    delhiRoutes: 0,
    faridabadRoutes: 0,
    manesarRoutes: 0,
    noidaRoutes: 0,
    ghaziabadRoutes: 0
  };

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
        this.cabsList = res.cabs.data || res.cabs || [];
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

    if (!this.selectedCabFilter.includes('all')) {
      raw = raw.filter(c => this.selectedCabFilter.includes(c.vehicleNumber));
    }

    this.filteredCabData = raw;

    // Summarize
    this.cabReportSummary = {
      totalCabs: raw.length,
      totalEarnings: raw.reduce((sum, c) => sum + c.earnings, 0),
      totalExpenses: raw.reduce((sum, c) => sum + c.totalExpenses, 0),
      netProfit: raw.reduce((sum, c) => sum + (c.earnings - c.totalExpenses), 0)
    };
  }

  compileDriverReport() {
    let raw = this.driversList.map(driver => {
      // Completed Trips
      const completedTrips = this.tripsList
        .filter(t => t.driverId === driver.id && t.status === 2 && this.isDateInRange(t.startTime) &&
          (this.selectedCabFilter.includes('all') || this.selectedCabFilter.includes(t.vehicleNumber)))
        .length;

      // Expenses Claimed
      const expenseTotal = this.expensesList
        .filter(e => e.driverName === driver.name && this.isDateInRange(e.date) &&
          (this.selectedCabFilter.includes('all') || this.selectedCabFilter.includes(e.cabVehicleNumber)))
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

    if (!this.selectedCabFilter.includes('all')) {
      raw = raw.filter(d => this.selectedCabFilter.includes(d.cabPlate));
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

    if (!this.selectedCabFilter.includes('all')) {
      raw = raw.filter(e => this.selectedCabFilter.includes(e.cabVehicleNumber));
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

    if (!this.selectedCabFilter.includes('all')) {
      raw = raw.filter(r => this.selectedCabFilter.includes(r.vehicleNumber));
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
      .filter(r => this.isDateInRange(r.date) && (this.selectedCabFilter.includes('all') || this.selectedCabFilter.includes(r.vehicleNumber)))
      .reduce((sum, r) => sum + r.amount, 0);

    const expenses = this.expensesList
      .filter(e => this.isDateInRange(e.date) && (this.selectedCabFilter.includes('all') || this.selectedCabFilter.includes(e.cabVehicleNumber)))
      .reduce((sum, e) => sum + e.amount, 0);

    const netProfit = revenue - expenses;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    this.profitReportSummary = { revenue, expenses, netProfit, margin };
  }

  compileRouteReport() {
    const allTripsFiltered = this.tripsList.filter(t => this.isDateInRange(t.startTime) && 
      (this.selectedCabFilter.includes('all') || this.selectedCabFilter.includes(t.vehicleNumber)));

    // Sort by startTime descending so latest trips are at the top
    allTripsFiltered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    this.filteredRouteData = allTripsFiltered;

    // Summarize
    const guardRoutes = allTripsFiltered.filter(t => t.isGuardRoute).length;
    const totalTrips = allTripsFiltered.length;

    let gurgaonRoutes = 0;
    let delhiRoutes = 0;
    let faridabadRoutes = 0;
    let manesarRoutes = 0;
    let noidaRoutes = 0;
    let ghaziabadRoutes = 0;

    allTripsFiltered.forEach(t => {
      const dest = (t.routeType || '').toLowerCase().trim();
      if (dest === 'gurgaon') gurgaonRoutes++;
      else if (dest === 'delhi') delhiRoutes++;
      else if (dest === 'faridabad') faridabadRoutes++;
      else if (dest === 'manesar') manesarRoutes++;
      else if (dest === 'noida') noidaRoutes++;
      else if (dest === 'ghaziabad') ghaziabadRoutes++;
    });

    this.routeReportSummary = {
      guardRoutes,
      totalTrips,
      gurgaonRoutes,
      delhiRoutes,
      faridabadRoutes,
      manesarRoutes,
      noidaRoutes,
      ghaziabadRoutes
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
        case 4: return 'Challan';
        case 5: return 'Salary';
        case 6: return 'Permit';
        case 7: return 'Accessories';
        case 8: return 'Other';
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
    const dateRangeLabel = this.getFormattedPrintDateRange();
    const cabFilterLabel = this.getSelectedCabsLabelForPrint();

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Date:,${dateRangeLabel}\n`;
    csvContent += `Cab:,"${cabFilterLabel}"\n`;

    // Add dynamic summary statistics to Excel header based on report type
    if (this.activeReportType === 'cab') {
      csvContent += `Total Cabs,${this.cabReportSummary.totalCabs}\n`;
      csvContent += `Total Fares Earned,${this.cabReportSummary.totalEarnings}\n`;
      csvContent += `Operating Expenses,${this.cabReportSummary.totalExpenses}\n`;
      csvContent += `Net Cab Profit,${this.cabReportSummary.netProfit}\n`;
    } else if (this.activeReportType === 'driver') {
      csvContent += `Total Drivers,${this.driverReportSummary.totalDrivers}\n`;
      csvContent += `Trips Logged,${this.driverReportSummary.totalTrips}\n`;
      csvContent += `Total Expenses Claimed,${this.driverReportSummary.totalClaims}\n`;
      csvContent += `Driver Salaries (base),${this.driverReportSummary.totalSalary}\n`;
    } else if (this.activeReportType === 'expense') {
      csvContent += `Approved Claims,${this.expenseReportSummary.count}\n`;
      csvContent += `Sum Total Expenses,${this.expenseReportSummary.total}\n`;
      csvContent += `Average Claim Value,${this.expenseReportSummary.average}\n`;
      csvContent += `Highest Single Claim,${this.expenseReportSummary.max}\n`;
    } else if (this.activeReportType === 'earnings') {
      csvContent += `Revenue Triggers,${this.earningsReportSummary.count}\n`;
      csvContent += `Gross Revenue Total,${this.earningsReportSummary.total}\n`;
      csvContent += `Average Trip Fare,${this.earningsReportSummary.average}\n`;
      csvContent += `Highest Single Fare,${this.earningsReportSummary.max}\n`;
    } else if (this.activeReportType === 'profit') {
      csvContent += `Total Revenue,${this.profitReportSummary.revenue}\n`;
      csvContent += `Total Operating Cost,${this.profitReportSummary.expenses}\n`;
      csvContent += `Net Profit,${this.profitReportSummary.netProfit}\n`;
      csvContent += `Profit Margin,${this.profitReportSummary.margin.toFixed(1)}%\n`;
    } else if (this.activeReportType === 'route') {
      csvContent += `Guard Routes,${this.routeReportSummary.guardRoutes}\n`;
      csvContent += `Total Trips,${this.routeReportSummary.totalTrips}\n`;
      csvContent += `Gurgaon Routes,${this.routeReportSummary.gurgaonRoutes}\n`;
      csvContent += `Delhi Routes,${this.routeReportSummary.delhiRoutes}\n`;
      csvContent += `Faridabad Routes,${this.routeReportSummary.faridabadRoutes}\n`;
      csvContent += `Manesar Routes,${this.routeReportSummary.manesarRoutes}\n`;
      csvContent += `Noida Routes,${this.routeReportSummary.noidaRoutes}\n`;
      csvContent += `Ghaziabad Routes,${this.routeReportSummary.ghaziabadRoutes}\n`;
    }

    csvContent += `\n`; // Add empty line separation

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
        c.earnings - c.totalExpenses
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
      headers = ['Date', 'Cab No', 'Trip ID', 'Route Type', 'Service Type', 'Route (Start ➜ Destination)', 'Guard', 'Toll', 'Distance travelled'];
      rows = this.filteredRouteData.map(t => [
        new Date(t.startTime).toLocaleDateString(),
        t.vehicleNumber ? t.vehicleNumber.toUpperCase() : '',
        t.vendorTripId || t.id,
        t.routeType || '',
        t.pickupOrDrop || '',
        `${t.startLocation} ➜ ${t.endLocation || ''}`,
        t.isGuardRoute ? 'Yes' : 'No',
        t.isTollRoute ? 'Yes' : 'No',
        t.endOdometer && t.startOdometer ? `${t.endOdometer - t.startOdometer} km` : '0 km'
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

  getFormattedPrintDateRange(): string {
    const now = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let start: Date;
    let end: Date = now;

    switch (this.dateFilter) {
      case 'all':
        let dates: number[] = [];
        if (this.activeReportType === 'cab' && this.filteredCabData.length > 0) {
          this.tripsList.forEach(t => { if (t.startTime) dates.push(new Date(t.startTime).getTime()); });
          this.revenueList.forEach(r => { if (r.date) dates.push(new Date(r.date).getTime()); });
          this.expensesList.forEach(e => { if (e.date) dates.push(new Date(e.date).getTime()); });
        } else if (this.activeReportType === 'driver' && this.filteredDriverData.length > 0) {
          this.tripsList.forEach(t => { if (t.startTime) dates.push(new Date(t.startTime).getTime()); });
          this.expensesList.forEach(e => { if (e.date) dates.push(new Date(e.date).getTime()); });
        } else if (this.activeReportType === 'expense' && this.filteredExpenseData.length > 0) {
          this.filteredExpenseData.forEach(e => { if (e.date) dates.push(new Date(e.date).getTime()); });
        } else if (this.activeReportType === 'earnings' && this.filteredRevenueData.length > 0) {
          this.filteredRevenueData.forEach(r => { if (r.date) dates.push(new Date(r.date).getTime()); });
        } else if (this.activeReportType === 'profit') {
          this.revenueList.forEach(r => { if (r.date) dates.push(new Date(r.date).getTime()); });
          this.expensesList.forEach(e => { if (e.date) dates.push(new Date(e.date).getTime()); });
        } else if (this.activeReportType === 'route' && this.filteredRouteData.length > 0) {
          this.filteredRouteData.forEach(t => { if (t.startTime) dates.push(new Date(t.startTime).getTime()); });
        }

        if (dates.length > 0) {
          const minDate = new Date(Math.min(...dates));
          const maxDate = new Date(Math.max(...dates));
          return `${formatDate(minDate)} to ${formatDate(maxDate)}`;
        }
        return 'All Time';

      case '1day':
        return `${formatDate(now)} to ${formatDate(now)}`;

      case '1week':
        start = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);
        return `${formatDate(start)} to ${formatDate(end)}`;

      case '1month':
        start = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30);
        return `${formatDate(start)} to ${formatDate(end)}`;

      case '1year':
        start = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 365);
        return `${formatDate(start)} to ${formatDate(end)}`;

      case 'custom':
        if (!this.startDate) {
          return `All Time to ${this.endDate ? formatDate(new Date(this.endDate)) : formatDate(now)}`;
        }
        const s = new Date(this.startDate);
        const e = this.endDate ? new Date(this.endDate) : now;
        return `${formatDate(s)} to ${formatDate(e)}`;

      default:
        return 'All Time';
    }
  }

  getSelectedCabsLabelForPrint(): string {
    if (!this.selectedCabFilter || this.selectedCabFilter.includes('all')) {
      if (this.cabsList && this.cabsList.length > 0) {
        return this.cabsList.map(c => (c.vehicleNumber || c.VehicleNumber || '').toUpperCase()).filter(v => !!v).join(', ');
      }
      return 'All Cabs';
    }
    if (this.selectedCabFilter.length === 0) {
      return 'No Cabs Selected';
    }
    return this.selectedCabFilter.map(c => c.toUpperCase()).join(', ');
  }

  isCabDropdownOpen = false;
  isDateDropdownOpen = false;
  hoveredDateOpt = '';

  toggleCabDropdown(event: Event) {
    event.stopPropagation();
    this.isCabDropdownOpen = !this.isCabDropdownOpen;
    this.isDateDropdownOpen = false;
  }

  toggleDateDropdown(event: Event) {
    event.stopPropagation();
    this.isDateDropdownOpen = !this.isDateDropdownOpen;
    this.isCabDropdownOpen = false;
  }

  setDateFilter(value: string) {
    this.dateFilter = value;
    this.isDateDropdownOpen = false;
    this.onFilterChange();
  }

  getDateFilterLabel(): string {
    switch (this.dateFilter) {
      case 'all': return 'All Time';
      case '1day': return '1 Day (Today)';
      case '1week': return '1 Week';
      case '1month': return '1 Month';
      case '1year': return '1 Year';
      case 'custom': return 'Custom Date Range';
      default: return 'All Time';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.isCabDropdownOpen = false;
    this.isDateDropdownOpen = false;
  }

  getSelectedCabsLabel(): string {
    if (!this.selectedCabFilter || this.selectedCabFilter.includes('all')) {
      return 'All Cabs';
    }
    if (this.selectedCabFilter.length === 0) {
      return 'No Cabs Selected';
    }
    return this.selectedCabFilter.map(c => c.toUpperCase()).join(', ');
  }

  isAllCabsSelected(): boolean {
    return this.selectedCabFilter.includes('all');
  }

  toggleSelectAllCabs(event: any) {
    if (event.target.checked) {
      this.selectedCabFilter = ['all'];
    } else {
      this.selectedCabFilter = [];
    }
    this.onFilterChange();
  }

  isCabSelectedInFilter(vehicleNumber: string): boolean {
    return this.selectedCabFilter.includes(vehicleNumber);
  }

  toggleCabSelection(vehicleNumber: string, event: any) {
    if (event.target.checked) {
      const allIndex = this.selectedCabFilter.indexOf('all');
      if (allIndex > -1) {
        this.selectedCabFilter.splice(allIndex, 1);
      }
      if (!this.selectedCabFilter.includes(vehicleNumber)) {
        this.selectedCabFilter.push(vehicleNumber);
      }
    } else {
      const idx = this.selectedCabFilter.indexOf(vehicleNumber);
      if (idx > -1) {
        this.selectedCabFilter.splice(idx, 1);
      }
      if (this.selectedCabFilter.length === 0) {
        this.selectedCabFilter.push('all');
      }
    }
    this.onFilterChange();
  }
}
