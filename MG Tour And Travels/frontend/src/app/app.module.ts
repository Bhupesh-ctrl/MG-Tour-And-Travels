import { NgModule, DEFAULT_CURRENCY_CODE } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Interceptor
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

// Layouts
import { AdminLayoutComponent } from './features/admin/admin-layout.component';
import { DriverLayoutComponent } from './features/driver/driver-layout.component';

// Components
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
import { ToastComponent } from './features/admin/toast/toast.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AdminLayoutComponent,
    AdminDashboardComponent,
    CabManagementComponent,
    DriverManagementComponent,
    TripManagementComponent,
    ExpenseManagementComponent,
    TargetManagementComponent,
    AuditTrailComponent,
    DriverLayoutComponent,
    DriverDashboardComponent,
    DriverTripComponent,
    DriverExpenseComponent,
    HomeComponent,
    InquiriesComponent,
    ReportsComponent,
    ToastComponent,
    AdminManagementComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'INR' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
