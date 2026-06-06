import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://mg-fleet-api-g3behhepdyfxgfhh.centralindia-01.azurewebsites.net/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private inactivityTimeout: any;
  private readonly INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(private http: HttpClient, private router: Router) {
    const token = sessionStorage.getItem('token');
    console.log('AuthService constructor - token in sessionStorage:', token);
    if (token) {
      const decoded = this.decodeToken(token);
      console.log('AuthService constructor - decoded user:', decoded);
      this.currentUserSubject.next(decoded);
      this.initInactivityTracker();
    }
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    return sessionStorage.getItem('token');
  }

  loginAdmin(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/login`, dto).pipe(
      map(res => {
        if (res && res.success && res.data.token) {
          sessionStorage.setItem('token', res.data.token);
          this.currentUserSubject.next(this.decodeToken(res.data.token));
          this.initInactivityTracker();
        }
        return res;
      })
    );
  }

  loginGeneral(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, dto).pipe(
      map(res => {
        if (res && res.success && res.data.token) {
          sessionStorage.setItem('token', res.data.token);
          this.currentUserSubject.next(this.decodeToken(res.data.token));
          this.initInactivityTracker();
        }
        return res;
      })
    );
  }

  requestOtp(phone: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/otp/request`, { phone });
  }

  verifyOtp(phone: string, otpCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/otp/verify`, { phone, otpCode }).pipe(
      map(res => {
        if (res && res.success && res.data.token) {
          sessionStorage.setItem('token', res.data.token);
          this.currentUserSubject.next(this.decodeToken(res.data.token));
          this.initInactivityTracker();
        }
        return res;
      })
    );
  }

  signupDriver(phone: string, otpCode: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/driver/signup`, { phone, otpCode, password }).pipe(
      map(res => {
        if (res && res.success && res.data.token) {
          sessionStorage.setItem('token', res.data.token);
          this.currentUserSubject.next(this.decodeToken(res.data.token));
          this.initInactivityTracker();
        }
        return res;
      })
    );
  }

  logout() {
    console.log('AuthService - logging out and removing token');
    sessionStorage.removeItem('token');
    this.currentUserSubject.next(null);
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    const events = ['mousemove', 'click', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.removeEventListener(event, this.resetInactivityTimerBound);
    });
  }

  public initInactivityTracker() {
    this.resetInactivityTimer();
    const events = ['mousemove', 'click', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.removeEventListener(event, this.resetInactivityTimerBound);
      window.addEventListener(event, this.resetInactivityTimerBound);
    });
  }

  private resetInactivityTimerBound = () => this.resetInactivityTimer();

  private resetInactivityTimer() {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    this.inactivityTimeout = setTimeout(() => {
      this.handleAutoLogout();
    }, this.INACTIVITY_LIMIT);
  }

  private handleAutoLogout() {
    console.log('User inactive for 1 hour. Logging out automatically.');
    const role = this.getRole();
    this.logout();
    const portal = (role === 'Admin' || role === 'SuperAdmin') ? 'admin' : 'driver';
    this.router.navigate(['/auth/login'], { queryParams: { loggedOutReason: 'inactive', portal } });
  }

  isAuthenticated(): boolean {
    const token = this.token;
    if (!token) {
      console.log('AuthService.isAuthenticated - no token found');
      return false;
    }
    
    const decoded = this.decodeToken(token);
    if (!decoded) {
      console.log('AuthService.isAuthenticated - token decoding failed');
      return false;
    }

    // Check expiration
    const expiry = decoded.exp;
    if (expiry) {
      const isExpired = (Math.floor(new Date().getTime() / 1000)) >= expiry;
      console.log('AuthService.isAuthenticated - token expiry check:', { expiry, current: Math.floor(new Date().getTime() / 1000), isExpired });
      return !isExpired;
    }
    return true;
  }

  getRole(): string | null {
    const user = this.currentUserValue;
    console.log('AuthService.getRole - current user:', user);
    return user ? user.role : null;
  }

  getDriverId(): number | null {
    const user = this.currentUserValue;
    if (user && user.DriverId) {
      return parseInt(user.DriverId, 10);
    }
    return null;
  }

  getUserName(): string | null {
    const user = this.currentUserValue;
    return user ? user.unique_name || user.sub : null;
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      // Solve possible base64url issues by padding and replacing URL-safe characters
      let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      const decoded = JSON.parse(atob(base64));
      
      const roleKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
      const nameKey = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
      const idKey = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

      if (decoded[roleKey]) decoded.role = decoded[roleKey];
      if (decoded[nameKey]) decoded.unique_name = decoded[nameKey];
      if (decoded[idKey]) decoded.sub = decoded[idKey];

      return decoded;
    } catch (e: any) {
      console.error('AuthService - decodeToken error:', e);
      return null;
    }
  }
}
