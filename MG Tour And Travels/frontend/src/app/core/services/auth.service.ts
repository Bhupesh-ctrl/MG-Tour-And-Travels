import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5165/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('token');
    if (token) {
      this.currentUserSubject.next(this.decodeToken(token));
    }
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    return localStorage.getItem('token');
  }

  loginAdmin(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/login`, dto).pipe(
      map(res => {
        if (res && res.success && res.data.token) {
          localStorage.setItem('token', res.data.token);
          this.currentUserSubject.next(this.decodeToken(res.data.token));
        }
        return res;
      })
    );
  }

  loginGeneral(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, dto).pipe(
      map(res => {
        if (res && res.success && res.data.token) {
          localStorage.setItem('token', res.data.token);
          this.currentUserSubject.next(this.decodeToken(res.data.token));
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
          localStorage.setItem('token', res.data.token);
          this.currentUserSubject.next(this.decodeToken(res.data.token));
        }
        return res;
      })
    );
  }

  signupDriver(phone: string, otpCode: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/driver/signup`, { phone, otpCode, password }).pipe(
      map(res => {
        if (res && res.success && res.data.token) {
          localStorage.setItem('token', res.data.token);
          this.currentUserSubject.next(this.decodeToken(res.data.token));
        }
        return res;
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = this.token;
    if (!token) return false;
    
    const decoded = this.decodeToken(token);
    if (!decoded) return false;

    // Check expiration
    const expiry = decoded.exp;
    if (expiry) {
      return (Math.floor(new Date().getTime() / 1000)) < expiry;
    }
    return true;
  }

  getRole(): string | null {
    const user = this.currentUserValue;
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
      const decoded = JSON.parse(atob(payload));
      
      const roleKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
      const nameKey = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
      const idKey = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

      if (decoded[roleKey]) decoded.role = decoded[roleKey];
      if (decoded[nameKey]) decoded.unique_name = decoded[nameKey];
      if (decoded[idKey]) decoded.sub = decoded[idKey];

      return decoded;
    } catch {
      return null;
    }
  }
}
