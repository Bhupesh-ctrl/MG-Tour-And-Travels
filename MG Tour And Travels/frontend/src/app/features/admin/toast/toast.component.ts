import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Toast, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts"
        class="toast-item"
        [class.toast-success]="toast.type === 'success'"
        [class.toast-error]="toast.type === 'error'"
        [class.toast-info]="toast.type === 'info'"
        (click)="toastService.dismiss(toast.id)"
      >
        <span class="toast-icon">
          {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ' }}
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="toastService.dismiss(toast.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column-reverse;
      gap: 0.6rem;
      pointer-events: none;
    }

    .toast-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.9rem 1.25rem;
      border-radius: 8px;
      min-width: 300px;
      max-width: 440px;
      font-size: 0.9rem;
      font-weight: 600;
      line-height: 1.4;
      cursor: pointer;
      pointer-events: all;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      animation: toastSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes toastSlideIn {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }

    .toast-success {
      background: linear-gradient(135deg, #166534 0%, #15803d 100%);
      border: 1.5px solid #22c55e;
      color: #ffffff;
    }
    .toast-error {
      background: linear-gradient(135deg, #991b1b 0%, #b91c1c 100%);
      border: 1.5px solid #ef4444;
      color: #ffffff;
    }
    .toast-info {
      background: linear-gradient(135deg, #92400e 0%, #b45309 100%);
      border: 1.5px solid #f59e0b;
      color: #ffffff;
    }

    .toast-icon {
      font-size: 1.15rem;
      font-weight: 700;
      flex-shrink: 0;
      width: 20px;
      text-align: center;
    }

    .toast-message {
      flex: 1;
    }

    .toast-close {
      background: none;
      border: none;
      color: inherit;
      font-size: 1.25rem;
      cursor: pointer;
      opacity: 0.75;
      padding: 0;
      line-height: 1;
      flex-shrink: 0;
      transition: opacity 0.15s;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub!: Subscription;

  constructor(public toastService: ToastService) {}

  ngOnInit() {
    this.sub = this.toastService.toasts$.subscribe(t => this.toasts = t);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
