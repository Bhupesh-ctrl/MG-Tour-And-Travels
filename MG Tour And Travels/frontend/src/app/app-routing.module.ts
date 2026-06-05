import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Auth Guard
import { AuthGuard } from './core/guards/auth.guard';

// Layouts
import { AdminLayoutComponent } from './features/admin/admin-layout.component';
import { DriverLayoutComponent } from './features/driver/driver-layout.component';

// Features
import { LoginComponent } from './features/auth/login.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { CabManagementComponent } from './features/admin/cabs/cab-management.component';
import { DriverManagementComponent } from './features/admin/drivers/driver-management.component';
import { TripManagementComponent } from './features/admin/trips/trip-management.component';
import { ExpenseManagementComponent } from './features/admin/expenses/expense-management.component';
import { TargetManagementComponent } from './features/admin/targets/target-management.component';
import { AuditTrailComponent } from './features/admin/audits/audit-trail.component';
import { AdminManagementComponent } from './features/admin/admins/admin-management.component';

import { DriverDashboardComponent } from './features/driver/dashboard/driver-dashboard.component';
import { DriverTripComponent } from './features/driver/trips/driver-trip.component';
import { DriverExpenseComponent } from './features/driver/expenses/driver-expense.component';
import { HomeComponent } from './features/home/home.component';
import { InquiriesComponent } from './features/admin/inquiries/inquiries.component';
import { ReportsComponent } from './features/admin/reports/reports.component';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'auth/login', component: LoginComponent },
  
  // Admin Routes (Protected)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'Admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'cabs', component: CabManagementComponent },
      { path: 'drivers', component: DriverManagementComponent },
      { path: 'trips', component: TripManagementComponent },
      { path: 'expenses', component: ExpenseManagementComponent },
      { path: 'targets', component: TargetManagementComponent },
      { path: 'inquiries', component: InquiriesComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'auditlogs', component: AuditTrailComponent },
      { path: 'admins', component: AdminManagementComponent, canActivate: [AuthGuard], data: { role: 'SuperAdmin' } }
    ]
  },

  // Driver Routes (Protected)
  {
    path: 'driver',
    component: DriverLayoutComponent,
    canActivate: [AuthGuard],
    data: { role: 'Driver' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DriverDashboardComponent },
      { path: 'trips', component: DriverTripComponent },
      { path: 'expenses', component: DriverExpenseComponent }
    ]
  },

  // Wildcard fallback
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
