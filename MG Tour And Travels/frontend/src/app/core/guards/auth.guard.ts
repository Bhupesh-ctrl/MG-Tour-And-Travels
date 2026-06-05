import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      const expectedRole = route.data['role'];
      if (expectedRole) {
        const userRole = this.authService.getRole();
        const hasAccess = expectedRole === userRole || (expectedRole === 'Admin' && userRole === 'SuperAdmin');
        if (!hasAccess) {
          const portal = expectedRole === 'Driver' ? 'driver' : 'admin';
          this.router.navigate(['/auth/login'], { queryParams: { portal } });
          return false;
        }
      }
      return true;
    }

    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
