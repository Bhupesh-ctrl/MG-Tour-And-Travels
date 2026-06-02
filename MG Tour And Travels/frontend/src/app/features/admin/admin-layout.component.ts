import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  template: `
    <div class="app-container">
      <div class="sidebar">
        <div class="brand">
          <h3 class="text-gradient">MG FLEET</h3>
          <span class="role-badge">ADMIN CONTROL</span>
        </div>
        <nav class="nav-menu">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
            <span class="icon">📊</span> Dashboard
          </a>
          <a routerLink="/admin/cabs" routerLinkActive="active" class="nav-item">
            <span class="icon">🚕</span> Cab Management
          </a>
          <a routerLink="/admin/drivers" routerLinkActive="active" class="nav-item">
            <span class="icon">👥</span> Driver Management
          </a>
          <a routerLink="/admin/trips" routerLinkActive="active" class="nav-item">
            <span class="icon">🛣️</span> Trips Log
          </a>
          <a routerLink="/admin/expenses" routerLinkActive="active" class="nav-item">
            <span class="icon">💵</span> Expenses Approval
          </a>
          <a routerLink="/admin/targets" routerLinkActive="active" class="nav-item">
            <span class="icon">🎯</span> Target Tracking
          </a>
          <a routerLink="/admin/inquiries" routerLinkActive="active" class="nav-item">
            <span class="icon">📥</span> Inquiries
          </a>
          <a routerLink="/admin/reports" routerLinkActive="active" class="nav-item">
            <span class="icon">📄</span> Reports
          </a>
          <a routerLink="/admin/auditlogs" routerLinkActive="active" class="nav-item">
            <span class="icon">📜</span> Audit Trails
          </a>
        </nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <span class="user-avatar">A</span>
            <span class="user-name">{{ userName }}</span>
          </div>
          <button class="btn btn-secondary btn-logout" (click)="logout()">
            LOG OUT
          </button>
        </div>
      </div>
      <div class="main-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .brand {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1rem;
    }
    .brand h3 {
      font-size: 1.5rem;
      margin-bottom: 0.15rem;
      background: linear-gradient(135deg, #ffffff 0%, var(--primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 800;
      letter-spacing: 0.05em;
    }
    .role-badge {
      font-size: 0.65rem;
      background: rgba(197, 155, 39, 0.15);
      color: var(--primary);
      border: 1px solid var(--primary);
      padding: 0.1rem 0.5rem;
      border-radius: 50px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex-grow: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.85rem 1rem;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      font-weight: 600;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all var(--transition-speed);
      gap: 0.75rem;
    }
    .nav-item:hover {
      background: rgba(197, 155, 39, 0.08);
      color: var(--primary);
    }
    .nav-item.active {
      background: var(--primary);
      color: #000000;
      font-weight: 700;
      box-shadow: 0 4px 14px var(--primary-glow);
    }
    .sidebar-footer {
      border-top: 1px solid var(--border-color);
      padding-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50px;
      background: var(--accent);
      color: var(--bg-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    .user-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: #ffffff;
    }
    .btn-logout {
      width: 100%;
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
    }
  `]
})
export class AdminLayoutComponent {
  userName = 'Admin';

  constructor(private authService: AuthService, private router: Router) {
    this.userName = this.authService.getUserName() || 'Admin';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
