import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-wrapper fade-in">
      <div class="glass-card login-card">
        <div class="login-header">
          <h2 class="text-gradient">MG TOUR & TRAVELS</h2>
          <p>Fleet & Cab Management Portal</p>
        </div>

        <div class="tab-header">
          <button [class.active]="activeTab === 'driver'" (click)="setTab('driver')">DRIVER PORTAL</button>
          <button [class.active]="activeTab === 'admin'" (click)="setTab('admin')">ADMIN CONTROL</button>
        </div>

        <!-- Error Alert -->
        <div *ngIf="errorMsg" class="badge badge-danger error-alert">
          {{ errorMsg }}
        </div>

        <!-- Password Form (For both Driver & Admin) -->
        <div *ngIf="loginMethod === 'password'" class="form-container">
          <div class="form-group">
            <label class="form-label">Username / Email / Phone</label>
            <input type="text" class="form-control" [(ngModel)]="passwordForm.username" placeholder="e.g., admin or driver phone" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-control" [(ngModel)]="passwordForm.password" placeholder="••••••••" />
          </div>
          <button class="btn btn-primary btn-full" (click)="loginWithPassword()" [disabled]="loading">
            {{ loading ? 'AUTHENTICATING...' : 'SECURE SIGN IN' }}
          </button>

          <!-- First Time Link for Driver Password Login -->
          <div *ngIf="activeTab === 'driver'" style="margin-top: 1.5rem; text-align: center;">
            <a (click)="setLoginMethod('signup')" style="color: var(--primary); font-size: 0.85rem; font-weight: 700; cursor: pointer; text-decoration: underline;">
              First time logging in or forgot password?
            </a>
          </div>
        </div>

        <!-- Sign Up / Set Password Form (Only for Driver) -->
        <div *ngIf="loginMethod === 'signup'" class="form-container">
          <h3 style="color: var(--primary); font-size: 1.1rem; margin-bottom: 1.25rem; font-weight: 700; text-align: center;">
            Setup / Reset Password
          </h3>
          <div class="form-group">
            <label class="form-label">Pre-registered Phone Number</label>
            <input type="tel" class="form-control" [(ngModel)]="signupForm.phone" placeholder="e.g., 9999999999" />
          </div>
          <div class="form-group">
            <label class="form-label">Choose New Password</label>
            <input type="password" class="form-control" [(ngModel)]="signupForm.password" placeholder="••••••••" />
          </div>
          <button class="btn btn-primary btn-full" (click)="signupDriver()" [disabled]="loading">
            {{ loading ? 'SAVING...' : 'UPDATE PASSWORD & SIGN IN' }}
          </button>

          <div style="margin-top: 1.5rem; text-align: center;">
            <a (click)="setLoginMethod('password')" style="color: var(--text-secondary); font-size: 0.85rem; font-weight: 700; cursor: pointer; text-decoration: underline;">
              Back to Login
            </a>
          </div>
        </div>


      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary);
      background-image: radial-gradient(circle at 50% 50%, rgba(197, 155, 39, 0.08) 0%, transparent 60%);
      padding: 1.5rem;
    }
    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem;
    }
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .login-header h2 {
      font-size: 1.75rem;
      margin-bottom: 0.25rem;
    }
    .login-header p {
      font-size: 0.875rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .tab-header {
      display: flex;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1.5rem;
    }
    .tab-header button {
      flex: 1;
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 700;
      padding: 0.75rem;
      cursor: pointer;
      letter-spacing: 0.05em;
      transition: color var(--transition-speed);
      position: relative;
    }
    .tab-header button.active {
      color: var(--primary);
    }
    .tab-header button.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary);
      box-shadow: 0 0 10px var(--primary-glow);
    }
    .form-container {
      display: flex;
      flex-direction: column;
    }
    .btn-full {
      width: 100%;
    }
    .error-alert {
      width: 100%;
      padding: 0.75rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.85rem;
      justify-content: center;
    }
    .helper-text {
      display: block;
      margin-top: 0.75rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.4;
      text-align: center;
    }
    .text-center {
      text-align: center;
    }
  `]
})
export class LoginComponent implements OnInit {
  activeTab: 'admin' | 'driver' = 'driver';
  loginMethod: 'password' | 'signup' = 'password';
  loading = false;
  errorMsg = '';
  passwordForm = {
    username: '',
    password: ''
  };

  signupForm = {
    phone: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl && returnUrl.toLowerCase().includes('/admin')) {
      this.activeTab = 'admin';
    } else if (returnUrl && returnUrl.toLowerCase().includes('/driver')) {
      this.activeTab = 'driver';
    }
  }

  setTab(tab: 'admin' | 'driver') {
    this.activeTab = tab;
    this.errorMsg = '';
    this.loginMethod = 'password';
  }

  setLoginMethod(method: 'password' | 'signup') {
    this.loginMethod = method;
    this.errorMsg = '';
  }

  loginWithPassword() {
    if (!this.passwordForm.username || !this.passwordForm.password) {
      this.errorMsg = 'Please enter both username/email/phone and password.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';

    const login$ = this.activeTab === 'admin'
      ? this.authService.loginAdmin(this.passwordForm)
      : this.authService.loginGeneral(this.passwordForm);

    login$.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          const userRole = res.data.role;

          // Double check role matches current selected tab
          if (this.activeTab === 'admin' && userRole !== 'Admin') {
            this.errorMsg = 'Access denied. You are not authorized as an Admin.';
            this.authService.logout();
            return;
          }
          if (this.activeTab === 'driver' && userRole !== 'Driver') {
            this.errorMsg = 'Access denied. You are not authorized as a Driver.';
            this.authService.logout();
            return;
          }

          if (userRole === 'Admin') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/driver/dashboard']);
          }
        } else {
          this.errorMsg = res.message || 'Authentication failed.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Server connection error.';
      }
    });
  }

  signupDriver() {
    if (!this.signupForm.phone || !this.signupForm.password) {
      this.errorMsg = 'Please enter both your phone number and new password.';
      return;
    }
    this.loading = true;
    this.errorMsg = '';

    // Pass empty string for OTP since the backend has bypassed OTP verification
    this.authService.signupDriver(
      this.signupForm.phone, 
      '', 
      this.signupForm.password
    ).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate(['/driver/dashboard']);
        } else {
          this.errorMsg = res.message || 'Failed to update password.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error?.message || 'Invalid phone number or password error.';
      }
    });
  }

}
