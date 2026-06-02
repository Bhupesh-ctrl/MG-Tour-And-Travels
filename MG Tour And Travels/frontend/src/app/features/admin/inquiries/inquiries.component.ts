import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-inquiries',
  template: `
    <div class="fade-in">
      <div style="margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 class="text-gradient">Customer Leads & Inquiries</h1>
          <p style="color: var(--text-secondary);">Manage general inquiries and outstation booking requests</p>
        </div>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn btn-secondary" (click)="resetMockData()">Reset Demo Data</button>
        </div>
      </div>

      <!-- Tab Header Switcher -->
      <div class="tab-header" style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 2rem;">
        <button [class.active]="activeTab === 'general'" (click)="setTab('general')">
          📥 General Inquiries ({{ generalInquiries.length }})
        </button>
        <button [class.active]="activeTab === 'outstation'" (click)="setTab('outstation')">
          ⛰ Outstation Requests ({{ outstationQueries.length }})
        </button>
      </div>

      <!-- Search Filters -->
      <div class="glass-card" style="margin-bottom: 1.5rem; padding: 1rem 1.5rem; display: flex; gap: 1rem; align-items: center; justify-content: space-between;">
        <div style="display:flex; gap:1rem; align-items:center; flex-grow:1; max-width: 500px;">
          <span style="font-size:1.25rem;">🔍</span>
          <input type="text" class="form-control" placeholder="Search by name, phone or location..." [(ngModel)]="searchTerm" (input)="filterData()" />
        </div>
        <div style="display:flex; gap:1rem; align-items:center;">
          <span style="font-size:0.85rem; color:var(--text-secondary); font-weight:600;">STATUS FILTER:</span>
          <select class="form-control" style="width: 150px; padding: 0.5rem 1rem;" [(ngModel)]="statusFilter" (change)="filterData()">
            <option value="All">All Leads</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Booked">Booked</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      <!-- Tab 1: General Inquiries Table -->
      <div *ngIf="activeTab === 'general'">
        <div class="table-container" *ngIf="filteredGeneral.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date Received</th>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Preferred Car</th>
                <th>Requirement Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredGeneral">
                <td style="font-size: 0.85rem; font-weight:600; color:var(--text-secondary);">
                  {{ item.date | date:'mediumDate' }}<br/>
                  <small style="color:var(--text-muted);">{{ item.date | date:'shortTime' }}</small>
                </td>
                <td><strong>{{ item.name }}</strong></td>
                <td><a href="tel:{{ item.phone }}" style="color:var(--primary); font-weight:700; text-decoration:none;">{{ item.phone }}</a></td>
                <td><span class="badge badge-info">{{ item.carPreference }}</span></td>
                <td style="max-width: 300px; white-space: normal; line-height: 1.4; font-size: 0.9rem; color: var(--text-secondary);">
                  {{ item.notes || 'No details provided.' }}
                </td>
                <td>
                  <select 
                    [class]="getStatusClass(item.status)" 
                    style="border-radius: 50px; padding: 0.25rem 0.5rem; font-weight: 700; outline:none; cursor:pointer;" 
                    [(ngModel)]="item.status"
                    (change)="updateGeneralStatus(item.id, item.status)"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Booked">Booked</option>
                    <option value="Archived">Archived</option>
                  </select>
                </td>
                <td>
                  <button class="btn btn-danger" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="deleteGeneral(item.id)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="glass-card" style="text-align: center; padding: 3rem 0; color: var(--text-secondary);" *ngIf="filteredGeneral.length === 0">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📥</div>
          <h4>No general inquiries found matching filters.</h4>
        </div>
      </div>

      <!-- Tab 2: Outstation Requests Table -->
      <div *ngIf="activeTab === 'outstation'">
        <div class="table-container" *ngIf="filteredOutstation.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Trip Type</th>
                <th>Route (Pickup / Drop)</th>
                <th>Schedule (Start / Return)</th>
                <th>Pax / Car</th>
                <th>Remarks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredOutstation">
                <td style="font-size: 0.85rem; font-weight:600; color:var(--text-secondary);">
                  {{ item.date | date:'mediumDate' }}<br/>
                  <small style="color:var(--text-muted);">{{ item.date | date:'shortTime' }}</small>
                </td>
                <td><strong>{{ item.name }}</strong></td>
                <td><a href="tel:{{ item.phone }}" style="color:var(--primary); font-weight:700; text-decoration:none;">{{ item.phone }}</a></td>
                <td>
                  <span class="badge" [class.badge-success]="item.tripType === 'Round Trip'" [class.badge-info]="item.tripType !== 'Round Trip'">
                    {{ item.tripType || 'One Way' }}
                  </span>
                </td>
                <td style="font-size:0.9rem; line-height: 1.4;">
                  <span style="color:var(--success);">🛫</span> <strong>Pickup:</strong> {{ item.pickupLocation }}<br/>
                  <span style="color:var(--danger);">🛬</span> <strong>Drop:</strong> {{ item.dropLocation }}
                </td>
                <td style="font-size: 0.85rem; line-height: 1.4; color: var(--text-secondary);">
                  <strong>Start:</strong> {{ item.checkinDateTime | date:'medium' }}<br/>
                  <strong *ngIf="item.tripType === 'Round Trip'">Return:</strong> {{ item.tripType === 'Round Trip' && item.checkoutDateTime ? (item.checkoutDateTime | date:'medium') : '' }}
                  <span *ngIf="item.tripType !== 'Round Trip'" style="color:var(--text-muted);">N/A (One Way)</span>
                </td>
                <td style="font-size:0.9rem;">
                  <strong>Pax:</strong> {{ item.passengerCount }}<br/>
                  <small style="color:var(--primary); font-weight:600;">{{ item.carPreference }}</small>
                </td>
                <td style="max-width: 200px; white-space: normal; line-height: 1.4; font-size: 0.85rem; color: var(--text-secondary);">
                  {{ item.remarks || '-' }}
                </td>
                <td>
                  <select 
                    [class]="getStatusClass(item.status)" 
                    style="border-radius: 50px; padding: 0.25rem 0.5rem; font-weight: 700; outline:none; cursor:pointer;" 
                    [(ngModel)]="item.status"
                    (change)="updateOutstationStatus(item.id, item.status)"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Booked">Booked</option>
                    <option value="Archived">Archived</option>
                  </select>
                </td>
                <td>
                  <button class="btn btn-danger" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;" (click)="deleteOutstation(item.id)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="glass-card" style="text-align: center; padding: 3rem 0; color: var(--text-secondary);" *ngIf="filteredOutstation.length === 0">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⛰</div>
          <h4>No outstation trip requests found matching filters.</h4>
        </div>
      </div>
    </div>

    <style>
      .tab-header button {
        background: none;
        border: none;
        color: var(--text-muted);
        font-size: 1rem;
        font-weight: 700;
        padding: 0.75rem 1rem;
        cursor: pointer;
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
        height: 2.5px;
        background: var(--primary);
      }
      .status-select-new {
        background: #000000;
        color: #ffffff;
        border: 1px solid var(--primary);
      }
      .status-select-contacted {
        background: var(--primary);
        color: #000000;
        border: 1px solid var(--primary);
      }
      .status-select-booked {
        background: #ffffff;
        color: #000000;
        border: 1px solid var(--primary);
      }
      .status-select-archived {
        background: #000000;
        color: var(--text-muted);
        border: 1px solid var(--text-muted);
      }
    </style>
  `
})
export class InquiriesComponent implements OnInit {
  activeTab: 'general' | 'outstation' = 'general';
  searchTerm = '';
  statusFilter = 'All';

  generalInquiries: any[] = [];
  outstationQueries: any[] = [];

  filteredGeneral: any[] = [];
  filteredOutstation: any[] = [];

  ngOnInit() {
    this.loadData();
  }

  setTab(tab: 'general' | 'outstation') {
    this.activeTab = tab;
    this.searchTerm = '';
    this.statusFilter = 'All';
    this.filterData();
  }

  loadData() {
    // Load general callback requests
    let general = localStorage.getItem('general_inquiries');
    if (!general) {
      // Seed initial mock inquiries
      const mockGeneral = [
        {
          id: 1,
          name: 'Amit Kumar',
          phone: '9810981098',
          carPreference: 'Swift Dzire',
          notes: 'Looking for a daily corporate pick and drop fleet from Noida to Gurugram. Please send details.',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          status: 'New'
        },
        {
          id: 2,
          name: 'Sunita Sharma',
          phone: '8800880088',
          carPreference: 'Hyundai Aura',
          notes: 'Airport drop transfer from Sector 56 Gurugram tomorrow early morning at 6:00 AM.',
          date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
          status: 'New'
        }
      ];
      localStorage.setItem('general_inquiries', JSON.stringify(mockGeneral));
      this.generalInquiries = mockGeneral;
    } else {
      this.generalInquiries = JSON.parse(general);
    }

    // Load outstation requests
    let outstation = localStorage.getItem('outstation_queries');
    if (!outstation) {
      // Seed initial mock outstation inquiries
      const mockOutstation = [
        {
          id: 1,
          name: 'Rajesh Gupta',
          phone: '9911223344',
          tripType: 'Round Trip',
          pickupLocation: 'Delhi Airport T3',
          dropLocation: 'Hotel Hilton, Jaipur, Rajasthan',
          checkinDateTime: '2026-06-15T10:00',
          checkoutDateTime: '2026-06-18T18:00',
          passengerCount: 3,
          carPreference: 'Any Sedan',
          remarks: 'Requires driver fluent in English, trunk space for 3 suitcases.',
          date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
          status: 'New'
        },
        {
          id: 2,
          name: 'Vikram Singh',
          phone: '9560123456',
          tripType: 'One Way',
          pickupLocation: 'DLF Cyber City, Phase 3 Gurugram',
          dropLocation: 'Taj Mahal East Gate, Agra, UP',
          checkinDateTime: '2026-06-20T07:00',
          checkoutDateTime: '',
          passengerCount: 4,
          carPreference: 'Swift Dzire',
          remarks: 'No return, drops only.',
          date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
          status: 'Contacted'
        }
      ];
      localStorage.setItem('outstation_queries', JSON.stringify(mockOutstation));
      this.outstationQueries = mockOutstation;
    } else {
      this.outstationQueries = JSON.parse(outstation);
    }

    this.filterData();
  }

  filterData() {
    const term = this.searchTerm.toLowerCase();
    
    // Filter General Inquiries
    this.filteredGeneral = this.generalInquiries.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(term) || 
                            item.phone.includes(term) || 
                            (item.notes && item.notes.toLowerCase().includes(term));
      const matchesStatus = this.statusFilter === 'All' || item.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filter Outstation Queries
    this.filteredOutstation = this.outstationQueries.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(term) || 
                            item.phone.includes(term) || 
                            item.pickupLocation.toLowerCase().includes(term) || 
                            item.dropLocation.toLowerCase().includes(term) ||
                            (item.remarks && item.remarks.toLowerCase().includes(term));
      const matchesStatus = this.statusFilter === 'All' || item.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'New': return 'status-select-new';
      case 'Contacted': return 'status-select-contacted';
      case 'Booked': return 'status-select-booked';
      default: return 'status-select-archived';
    }
  }

  updateGeneralStatus(id: number, newStatus: string) {
    const idx = this.generalInquiries.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.generalInquiries[idx].status = newStatus;
      localStorage.setItem('general_inquiries', JSON.stringify(this.generalInquiries));
      this.filterData();
    }
  }

  updateOutstationStatus(id: number, newStatus: string) {
    const idx = this.outstationQueries.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.outstationQueries[idx].status = newStatus;
      localStorage.setItem('outstation_queries', JSON.stringify(this.outstationQueries));
      this.filterData();
    }
  }

  deleteGeneral(id: number) {
    if (confirm('Are you sure you want to delete this general lead?')) {
      this.generalInquiries = this.generalInquiries.filter(i => i.id !== id);
      localStorage.setItem('general_inquiries', JSON.stringify(this.generalInquiries));
      this.filterData();
    }
  }

  deleteOutstation(id: number) {
    if (confirm('Are you sure you want to delete this outstation request?')) {
      this.outstationQueries = this.outstationQueries.filter(i => i.id !== id);
      localStorage.setItem('outstation_queries', JSON.stringify(this.outstationQueries));
      this.filterData();
    }
  }

  resetMockData() {
    if (confirm('Reset to default mock lead list? This will remove custom submissions.')) {
      localStorage.removeItem('general_inquiries');
      localStorage.removeItem('outstation_queries');
      this.loadData();
    }
  }
}
