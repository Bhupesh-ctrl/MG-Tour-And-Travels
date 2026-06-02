import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:5165/api';

  constructor(private http: HttpClient) {}

  // Cabs API
  getCabs(page: number, pageSize: number, search: string, sortBy: string, sortOrder: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('search', search)
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);
    return this.http.get<any>(`${this.baseUrl}/cabs`, { params });
  }

  getCab(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cabs/${id}`);
  }

  createCab(cab: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/cabs`, cab);
  }

  updateCab(id: number, cab: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/cabs/${id}`, cab);
  }

  deleteCab(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/cabs/${id}`);
  }

  // Drivers API
  getDrivers(page: number, pageSize: number, search: string, verificationStatus: string, sortBy: string, sortOrder: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('search', search)
      .set('verificationStatus', verificationStatus)
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);
    return this.http.get<any>(`${this.baseUrl}/drivers`, { params });
  }

  getDriver(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/drivers/${id}`);
  }

  createDriver(driver: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/drivers`, driver);
  }

  updateDriver(id: number, driver: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/drivers/${id}`, driver);
  }

  assignCab(driverId: number, cabId: number | null): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/drivers/${driverId}/assign-cab/${cabId || ''}`, {});
  }

  deleteDriver(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/drivers/${id}`);
  }

  // Trips API
  getTrips(page: number, pageSize: number, status: string = '', driverId?: number, cabId?: number): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('status', status);

    if (driverId) params = params.set('driverId', driverId.toString());
    if (cabId) params = params.set('cabId', cabId.toString());

    return this.http.get<any>(`${this.baseUrl}/trips`, { params });
  }

  getTrip(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/trips/${id}`);
  }

  startTrip(dto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/trips/start`, dto);
  }

  endTrip(tripId: number, dto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/trips/${tripId}/end`, dto);
  }

  cancelTrip(tripId: number, dto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/trips/${tripId}/cancel`, dto);
  }

  logPastTrip(dto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/trips/log-past`, dto);
  }

  // Expenses API
  getExpenses(page: number, pageSize: number, status: string = '', driverId?: number): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('status', status);

    if (driverId) params = params.set('driverId', driverId.toString());

    return this.http.get<any>(`${this.baseUrl}/expenses`, { params });
  }

  createExpense(dto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/expenses`, dto);
  }

  updateExpenseStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/expenses/${id}/status?status=${status}`, {});
  }

  // Targets API
  getTargets(driverId?: number): Observable<any> {
    let params = new HttpParams();
    if (driverId) params = params.set('driverId', driverId.toString());
    return this.http.get<any>(`${this.baseUrl}/targets`, { params });
  }

  createTarget(dto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/targets`, dto);
  }

  deleteTarget(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/targets/${id}`);
  }

  // Audit Logs API
  getAuditLogs(page: number, pageSize: number): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<any>(`${this.baseUrl}/auditlogs`, { params });
  }

  // Dashboard Analytics
  getDashboardAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/analytics/dashboard`);
  }

  getRevenueDetails(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/analytics/revenue-details`);
  }

  getExpenseDetails(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/analytics/expense-details`);
  }

  getCabsDetails(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/analytics/cabs-details`);
  }

  updateExpense(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/expenses/${id}`, dto);
  }

  updateTrip(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/trips/${id}`, dto);
  }

  updateTarget(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/targets/${id}`, dto);
  }

  getDocuments(entityType: string, entityId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/documents?entityType=${entityType}&entityId=${entityId}`);
  }

  uploadDocument(dto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/documents`, dto);
  }

  updateDocument(id: number, dto: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/documents/${id}`, dto);
  }

  deleteDocument(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/documents/${id}`);
  }
}
