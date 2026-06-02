import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-driver-layout',
  template: `
    <div class="driver-app-container">
      <header class="driver-header glass-card">
        <div class="brand">
          <h3 class="text-gradient">MG DRIVER</h3>
          <span class="status-indicator">ON DUTY</span>
        </div>
        <nav class="driver-nav">
          <a routerLink="/driver/dashboard" routerLinkActive="active" class="driver-nav-item">HUD</a>
          <a routerLink="/driver/trips" routerLinkActive="active" class="driver-nav-item">TRIPS</a>
          <a routerLink="/driver/expenses" routerLinkActive="active" class="driver-nav-item">EXPENSES</a>
        </nav>
        <div class="header-right">
          <span class="driver-name">{{ userName }}</span>
          <button class="btn btn-secondary btn-logout" (click)="logout()">LOGOUT</button>
        </div>
      </header>
      <main class="driver-content fade-in">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .driver-app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary);
      background-image: radial-gradient(circle at 50% 10%, rgba(0, 250, 217, 0.04) 0%, transparent 50%);
    }
    .driver-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      border-radius: 0;
      border-bottom: 1px solid var(--border-color);
      z-index: 10;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .status-indicator {
      font-size: 0.6rem;
      background: rgba(36, 161, 72, 0.15);
      color: #42be65;
      border: 1px solid rgba(36, 161, 72, 0.3);
      padding: 0.1rem 0.5rem;
      border-radius: 50px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .driver-nav {
      display: flex;
      gap: 1.5rem;
    }
    .driver-nav-item {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.5rem 0.25rem;
      transition: color var(--transition-speed);
      position: relative;
    }
    .driver-nav-item:hover {
      color: var(--text-primary);
    }
    .driver-nav-item.active {
      color: var(--primary);
    }
    .driver-nav-item.active::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary);
      box-shadow: 0 0 8px var(--primary-glow);
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .driver-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-primary);
    }
    .btn-logout {
      padding: 0.4rem 0.85rem;
      font-size: 0.75rem;
    }
    .driver-content {
      flex-grow: 1;
      padding: 2rem;
      max-width: 800px;
      width: 100%;
      margin: 0 auto;
    }
    @media (max-width: 768px) {
      .driver-header {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }
      .driver-content {
        padding: 1rem;
      }
    }
  `]
})
export class DriverLayoutComponent {
  userName = 'Driver';

  constructor(private authService: AuthService, private router: Router) {
    this.userName = this.authService.getUserName() || 'Driver';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
