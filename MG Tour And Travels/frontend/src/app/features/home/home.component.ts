import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <div class="home-container fade-in">
      <!-- Top Navigation Bar (AdvantageGo Style: Black background) -->
      <header class="header">
        <div class="logo-area" (click)="scrollToTop()">
          <img src="/assets/logo.png" alt="MG Logo" class="logo-img" />
          <div class="brand-text">
            <h1 class="brand-name">MG Tour & Travels</h1>
            <p class="brand-tagline">Premium Travel Experience</p>
          </div>
        </div>

        <!-- Hamburger Icon -->
        <button class="hamburger" (click)="toggleMenu()" [class.is-active]="isMenuOpen" aria-label="Toggle Navigation">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>

        <!-- Navigation Drawer Overlay -->
        <nav class="nav-drawer" [class.is-open]="isMenuOpen">
          <ul class="nav-links">
            <li><a (click)="scrollToSection('hero')">Home</a></li>
            <li><a (click)="openOutstationModal()">Outstation Inquiry</a></li>
            <li><a routerLink="/auth/login" (click)="toggleMenu()">Portal Sign In</a></li>
            <li><a (click)="scrollToSection('fleet')">Our Fleet</a></li>
            <li><a (click)="scrollToSection('services')">Services</a></li>
            <li><a (click)="scrollToSection('contact')">Contact Us</a></li>
          </ul>
          <div class="drawer-footer">
            <p>MG Tour & Travels</p>
            <span>Manager: Rahul Solanki (+91 8920552795)</span>
          </div>
        </nav>
        <div class="drawer-backdrop" [class.is-open]="isMenuOpen" (click)="toggleMenu()"></div>
      </header>

      <!-- Hero Section -->
      <section id="hero" class="hero-section">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <span class="badge badge-warning hero-badge">DELHI NCR PREFERRED PARTNER</span>
          <h2 class="hero-title">Experience the Premium Comfort on Every Road</h2>
          <p class="hero-subtitle">
            Reliable, clean, and professional corporate car rentals and taxi services across Delhi NCR. Serving you with excellence for over 2.5 years.
          </p>
          <div class="hero-actions">
            <button class="btn btn-primary" (click)="scrollToSection('inquiry')">Quick Inquiry</button>
            <button class="btn btn-secondary" (click)="openOutstationModal()" style="border-color: var(--primary); color: white; background: var(--primary);">Plan Outstation Trip</button>
          </div>
        </div>
      </section>

      <!-- Stats Grid -->
      <section class="stats-section">
        <div class="stats-container">
          <div class="stat-card glass-card">
            <div class="stat-icon">🚕</div>
            <div class="stat-details">
              <span class="stat-value">25+</span>
              <span class="stat-label">Premium Cabs</span>
            </div>
          </div>
          <div class="stat-card glass-card">
            <div class="stat-icon">📅</div>
            <div class="stat-details">
              <span class="stat-value">2.5+ Yrs</span>
              <span class="stat-label">Industry Trust</span>
            </div>
          </div>
          <div class="stat-card glass-card">
            <div class="stat-icon">📍</div>
            <div class="stat-details">
              <span class="stat-value">NCR</span>
              <span class="stat-label">Active Coverage</span>
            </div>
          </div>
          <div class="stat-card glass-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-details">
              <span class="stat-value">100%</span>
              <span class="stat-label">Comfort & Safety</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Corporate Partners Section (AdvantageGo Style: Black, Gold, White) -->
      <section class="partners-section">
        <div class="partners-container">
          <span class="partners-label">Trusted by Corporate Giants</span>
          <div class="partners-logos">
            <div class="partner-logo">SRC</div>
            <div class="partner-logo">Orix</div>
            <div class="partner-logo">SkyJet</div>
          </div>
        </div>
      </section>

      <!-- Fleet Section -->
      <section id="fleet" class="fleet-section">
        <div class="section-header">
          <span class="section-subtitle">OUR VEHICLES</span>
          <h3 class="section-title">The Premium Sedan Fleet</h3>
          <p class="section-desc">Our entire fleet consists of well-maintained, air-conditioned premium sedans driven by professional, verified chauffeurs.</p>
        </div>

        <div class="fleet-grid">
          <div class="fleet-card glass-card">
            <div class="car-badge">POPULAR</div>
            <div class="car-image-container">
              <img src="/assets/swift_dzire.png" alt="Swift Dzire" class="car-img" />
            </div>
            <div class="fleet-info">
              <h4>Maruti Suzuki Swift Dzire</h4>
              <p class="fleet-type">Executive Sedan</p>
              <ul class="fleet-features">
                <li><span>✔</span> 4 + 1 Passengers</li>
                <li><span>✔</span> Ample Luggage Space</li>
                <li><span>✔</span> Climate Control AC</li>
                <li><span>✔</span> GPS Tracked & Clean</li>
              </ul>
              <button class="btn btn-secondary btn-full" (click)="selectCar('Swift Dzire')">Select for Inquiry</button>
            </div>
          </div>

          <div class="fleet-card glass-card">
            <div class="car-badge">PREMIUM</div>
            <div class="car-image-container">
              <img src="/assets/hyundai_aura.png" alt="Hyundai Aura" class="car-img" />
            </div>
            <div class="fleet-info">
              <h4>Hyundai Aura</h4>
              <p class="fleet-type">Executive Sedan</p>
              <ul class="fleet-features">
                <li><span>✔</span> 4 + 1 Passengers</li>
                <li><span>✔</span> Advanced Comfort Seats</li>
                <li><span>✔</span> Climate Control AC</li>
                <li><span>✔</span> GPS Tracked & Clean</li>
              </ul>
              <button class="btn btn-secondary btn-full" (click)="selectCar('Hyundai Aura')">Select for Inquiry</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Services Section (Chauffeur Excellence removed) -->
      <section id="services" class="services-section">
        <div class="section-header">
          <span class="section-subtitle">WHAT WE OFFER</span>
          <h3 class="section-title">Professional Transport Solutions</h3>
        </div>

        <div class="services-grid">
          <div class="service-item glass-card">
            <div class="service-icon">💼</div>
            <h4>Corporate Travel</h4>
            <p>Reliable and timely employee transportation and executive travel services tailored to corporate schedules.</p>
          </div>
          <div class="service-item glass-card">
            <div class="service-icon">✈</div>
            <h4>Airport Transfers</h4>
            <p>Hassle-free pick-ups and drop-offs at Indira Gandhi International (IGI) Airport with real-time arrival tracking.</p>
          </div>
          <div class="service-item glass-card">
            <div class="service-icon">⛰</div>
            <h4>Outstation Tours</h4>
            <p>Safe and comfortable travel across major historical and tourist spots near NCR, Haryana, and Rajasthan.</p>
          </div>
        </div>
      </section>

      <!-- Quick Inquiry Section -->
      <section id="inquiry" class="inquiry-section">
        <div class="inquiry-wrapper glass-card">
          <div class="inquiry-content">
            <h3>Get a Quick Quote</h3>
            <p>Planning a trip or need corporate fleet booking? Submit details and our manager Rahul Solanki will call you back within 15 minutes.</p>
            <div class="quick-contacts">
              <div class="quick-contact-item">
                <span class="c-icon">📞</span>
                <div>
                  <strong>Call Manager (Rahul Solanki):</strong>
                  <a href="tel:+918920552795">+91 8920552795</a>
                </div>
              </div>
              <div class="quick-contact-item">
                <span class="c-icon">✉</span>
                <div>
                  <strong>Company Email:</strong>
                  <a href="mailto:mgtourandtravels01@gmail.com">mgtourandtravels01@gmail.com</a>
                </div>
              </div>
            </div>
          </div>

          <div class="inquiry-form-container">
            <div *ngIf="inquirySubmitted" class="badge badge-success success-alert">
              Thank you! Your inquiry was sent. Our manager will call you back shortly.
            </div>
            
            <form *ngIf="!inquirySubmitted" (submit)="submitInquiry($event)">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" name="name" [(ngModel)]="inquiryForm.name" required placeholder="e.g. John Doe" />
              </div>
              <div class="form-group">
                <label class="form-label">Mobile Number</label>
                <input type="tel" class="form-control" name="phone" [(ngModel)]="inquiryForm.phone" required placeholder="e.g. 9876543210" />
              </div>
              <div class="form-group">
                <label class="form-label">Vehicle Preference</label>
                <select class="form-control" name="carPreference" [(ngModel)]="inquiryForm.carPreference">
                  <option value="Swift Dzire">Maruti Swift Dzire (Sedan)</option>
                  <option value="Hyundai Aura">Hyundai Aura (Sedan)</option>
                  <option value="Any Sedan">Any Sedan (Comfort class)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Requirement Details</label>
                <textarea class="form-control" name="notes" [(ngModel)]="inquiryForm.notes" rows="3" placeholder="e.g. Airport pick up tomorrow at 8 AM, or corporate fleet requirement..."></textarea>
              </div>
              <button type="submit" class="btn btn-primary btn-full">SUBMIT ENQUIRY</button>
            </form>
          </div>
        </div>
      </section>

      <!-- Outstation Inquiry Modal Dialog (AdvantageGo Theme: Light modal body) -->
      <div class="modal-overlay" *ngIf="isOutstationModalOpen" (click)="closeOutstationModal()">
        <div class="modal-content-scroll" (click)="$event.stopPropagation()">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:2px solid var(--primary); padding-bottom:1rem;">
            <h3 style="margin:0; color:var(--primary); font-size:1.5rem;">Plan Outstation Trip</h3>
            <button (click)="closeOutstationModal()" style="background:none; border:none; font-size:2rem; cursor:pointer; color:var(--text-muted); line-height: 0.5;">&times;</button>
          </div>

          <div *ngIf="outstationSubmitted" class="badge badge-success success-alert" style="margin-bottom:1.5rem; width:100%; box-sizing:border-box;">
            Thank you! Your Outstation Inquiry was submitted. Manager Rahul Solanki will call you back shortly.
          </div>

          <form *ngIf="!outstationSubmitted" (submit)="submitOutstationQuery($event)">
            <!-- Name & Phone -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" name="oName" [(ngModel)]="outstationForm.name" required placeholder="e.g. John Doe" />
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="tel" class="form-control" name="oPhone" [(ngModel)]="outstationForm.phone" required placeholder="e.g. 9999999999" />
              </div>
            </div>

            <!-- Trip Type & Passenger Count -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div class="form-group">
                <label class="form-label">Trip Type</label>
                <select class="form-control" name="oTripType" [(ngModel)]="outstationForm.tripType">
                  <option value="One Way">One Way</option>
                  <option value="Round Trip">Round Trip</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">No. of Passengers</label>
                <input type="number" class="form-control" name="oPeople" [(ngModel)]="outstationForm.passengerCount" required min="1" max="4" placeholder="1-4" />
              </div>
            </div>

            <!-- Locations: Pickup & Drop -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div class="form-group">
                <label class="form-label">Pickup Location</label>
                <input type="text" class="form-control" name="oPickup" [(ngModel)]="outstationForm.pickupLocation" required placeholder="e.g. Delhi Airport T3" />
              </div>
              <div class="form-group">
                <label class="form-label">Drop Location</label>
                <input type="text" class="form-control" name="oDrop" [(ngModel)]="outstationForm.dropLocation" required placeholder="e.g. Jaipur, Rajasthan" />
              </div>
            </div>

            <!-- Dates: Start & Return (conditional) -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div class="form-group">
                <label class="form-label">Start Date & Time</label>
                <input type="datetime-local" class="form-control" name="oCheckin" [(ngModel)]="outstationForm.checkinDateTime" required />
              </div>
              <div class="form-group" *ngIf="outstationForm.tripType === 'Round Trip'">
                <label class="form-label">Return Date & Time</label>
                <input type="datetime-local" class="form-control" name="oCheckout" [(ngModel)]="outstationForm.checkoutDateTime" required />
              </div>
              <div class="form-group">
                <label class="form-label">Car Preference</label>
                <select class="form-control" name="oCar" [(ngModel)]="outstationForm.carPreference">
                  <option value="Swift Dzire">Maruti Swift Dzire (Sedan)</option>
                  <option value="Hyundai Aura">Hyundai Aura (Sedan)</option>
                  <option value="Any Sedan">Any Sedan (Comfort class)</option>
                </select>
              </div>
            </div>

            <!-- Remarks Textbox -->
            <div style="margin-top:0.5rem;">
              <div class="form-group">
                <label class="form-label">Additional Instructions / Requirements</label>
                <textarea class="form-control" name="oRemarks" [(ngModel)]="outstationForm.remarks" rows="2" placeholder="e.g. Need space for 3 suitcases, multiple stops on the way, etc..."></textarea>
              </div>
            </div>

            <div style="margin-top:1.5rem; display:flex; justify-content:flex-end; gap:1rem; border-top:1px solid var(--border-color); padding-top:1.5rem;">
              <button type="button" class="btn btn-secondary" (click)="closeOutstationModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Query</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Footer Section (AdvantageGo Style: Black background) -->
      <footer id="contact" class="footer">
        <div class="footer-gradient-line"></div>
        <div class="footer-content">
          <div class="footer-main">
            <!-- Left Info -->
            <div class="footer-brand-column">
              <div class="logo-area">
                <img src="/assets/logo.png" alt="MG Logo" class="logo-img" />
                <div class="brand-text">
                  <h4 class="brand-name">MG Tour & Travels</h4>
                  <p class="brand-tagline">Premium Travel Experience</p>
                </div>
              </div>
              <p class="footer-intro-desc">
                Serving the Delhi NCR area with corporate and private premium travel solutions. Professional, verified drivers and modern sedans.
              </p>
              <div class="executive-list">
                <div class="exec-item">
                  <span class="role">Owner:</span>
                  <span class="name">Mayank Goyal</span>
                </div>
                <div class="exec-item">
                  <span class="role">Manager:</span>
                  <span class="name">Rahul Solanki</span>
                </div>
              </div>
            </div>

            <!-- Middle Quick Links -->
            <div class="footer-links-column">
              <h5>Quick Navigation</h5>
              <ul>
                <li><a (click)="scrollToSection('hero')">Home</a></li>
                <li><a (click)="openOutstationModal()">Outstation Inquiry</a></li>
                <li><a (click)="scrollToSection('fleet')">Our Fleet</a></li>
                <li><a (click)="scrollToSection('services')">Core Services</a></li>
                <li><a routerLink="/auth/login">Internal Login Portal</a></li>
              </ul>
            </div>

            <!-- Right Contact Details -->
            <div class="footer-contacts-column">
              <h5>Official Details</h5>
              <div class="contact-detail-line">
                <span class="footer-icon">🧾</span>
                <span><strong>GSTIN:</strong> 06BPRPG4723B2Z3</span>
              </div>
              <div class="contact-detail-line">
                <span class="footer-icon">📞</span>
                <span><strong>Mob (Manager):</strong> <a href="tel:+918920552795">+91 8920552795</a></span>
              </div>
              <div class="contact-detail-line">
                <span class="footer-icon">✉</span>
                <span><strong>Email:</strong> <a href="mailto:mgtourandtravels01@gmail.com">mgtourandtravels01@gmail.com</a></span>
              </div>
              <div class="contact-detail-line">
                <span class="footer-icon">🏢</span>
                <span>
                  <strong>Regd. Office:</strong><br />
                  Plot No. 1, Ward No. 12, Garh Ander, Near Jain Mandir, Ferozepur Jhirka, Nuh, Haryana - 122104
                </span>
              </div>
              <div class="contact-detail-line">
                <span class="footer-icon">📍</span>
                <span>
                  <strong>Branch Office:</strong><br />
                  H. No. 415, Street No. 1, Patel Nagar, Near Sector 15, Gurugram, Haryana-122001
                </span>
              </div>
            </div>
          </div>

          <div class="footer-bottom">
            <p>&copy; 2024 MG Tour & Travels. All Rights Reserved. Designed for Premium Travel Experience.</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .home-container {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      width: 100vw;
      overflow-x: hidden;
    }

    /* Header (AdvantageGo Theme: Pure black background) */
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 75px;
      background: #000000;
      border-bottom: 1px solid var(--primary);
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 5%;
      z-index: 999;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
    }

    .logo-img {
      width: 45px;
      height: 45px;
      object-fit: contain;
      border-radius: 5px;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: white; /* White text on black navbar */
      margin: 0;
      line-height: 1.2;
    }

    .brand-tagline {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }

    /* Hamburger Menu Button */
    .hamburger {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 5px;
      z-index: 1001;
      padding: 5px;
    }

    .hamburger .bar {
      display: block;
      width: 25px;
      height: 3px;
      background-color: var(--primary); /* Gold bars */
      transition: all var(--transition-speed);
      border-radius: 2px;
    }

    .hamburger.is-active .bar:nth-child(1) {
      transform: translateY(8px) rotate(45deg);
      background-color: var(--primary);
    }
    .hamburger.is-active .bar:nth-child(2) {
      opacity: 0;
    }
    .hamburger.is-active .bar:nth-child(3) {
      transform: translateY(-8px) rotate(-45deg);
      background-color: var(--primary);
    }

    /* Slide-out Navigation Drawer */
    .nav-drawer {
      position: fixed;
      top: 0;
      right: -320px;
      width: 320px;
      height: 100vh;
      background: #000000;
      border-left: 1px solid var(--primary);
      color: white;
      padding: 100px 2.5rem 2.5rem 2.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      z-index: 1000;
      transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.15);
    }

    .nav-drawer.is-open {
      right: 0;
    }

    .nav-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .nav-links li a {
      color: #dfddd9;
      font-size: 1.25rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: color var(--transition-speed), padding-left var(--transition-speed);
      display: block;
    }

    .nav-links li a:hover {
      color: var(--primary);
      padding-left: 8px;
    }

    .drawer-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 1.5rem;
    }

    .drawer-footer p {
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.25rem;
    }

    .drawer-footer span {
      font-size: 0.8rem;
      color: #a2a2ad;
    }

    .drawer-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      z-index: 998;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--transition-speed);
    }

    .drawer-backdrop.is-open {
      opacity: 1;
      pointer-events: auto;
    }

    /* Hero Section */
    .hero-section {
      position: relative;
      height: 85vh;
      min-height: 550px;
      margin-top: 75px;
      background: url('/assets/hero_sedan.png') no-repeat center center;
      background-size: cover;
      display: flex;
      align-items: center;
      padding: 0 10%;
    }

    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.3) 100%);
      z-index: 1;
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 650px;
      color: white;
    }

    .hero-badge {
      display: inline-block;
      margin-bottom: 1.5rem;
      font-size: 0.75rem;
      padding: 0.35rem 1rem;
      font-weight: 700;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 800;
      color: white;
      line-height: 1.15;
      margin-bottom: 1.5rem;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .hero-subtitle {
      font-size: 1.1rem;
      color: #e5e2db;
      line-height: 1.6;
      margin-bottom: 2.25rem;
      text-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
    }

    /* Stats Grid Section */
    .stats-section {
      background: #ffffff;
      padding: 3rem 5%;
      position: relative;
      z-index: 10;
      margin-top: -50px;
    }

    .stats-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(197, 155, 39, 0.06);
    }

    .stat-icon {
      font-size: 2rem;
      width: 50px;
      height: 50px;
      background: var(--bg-tertiary);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.1;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Section Headers */
    .section-header {
      text-align: center;
      max-width: 600px;
      margin: 0 auto 3rem auto;
    }

    .section-subtitle {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    .section-title {
      font-size: 2.25rem;
      font-weight: 800;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
    }

    .section-desc {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    /* Fleet Section */
    .fleet-section {
      padding: 5rem 5%;
      background: #faf9f6;
    }

    .fleet-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2.5rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .fleet-card {
      position: relative;
      background: #ffffff;
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .car-badge {
      position: absolute;
      top: 15px;
      left: 15px;
      background: var(--primary);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 50px;
      z-index: 5;
    }

    .car-image-container {
      height: 250px;
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 1rem;
    }

    .car-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      transition: transform 0.3s;
    }

    .fleet-card:hover .car-img {
      transform: scale(1.05);
    }

    .fleet-info {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .fleet-info h4 {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }

    .fleet-type {
      font-size: 0.8rem;
      color: var(--primary);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1.5rem;
    }

    .fleet-features {
      list-style: none;
      padding: 0;
      margin: 0 0 2rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .fleet-features li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .fleet-features li span {
      color: var(--primary);
      font-weight: bold;
    }

    /* Partners Section (AdvantageGo Theme: black background, gold border, white text) */
    .partners-section {
      background: #000000;
      padding: 2.5rem 5%;
      border-top: 1px solid rgba(197, 155, 39, 0.3);
      border-bottom: 1px solid rgba(197, 155, 39, 0.3);
    }
    .partners-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }
    .partners-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.15em;
    }
    .partners-logos {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 4rem;
      flex-wrap: wrap;
    }
    .partner-logo {
      font-size: 2.25rem;
      font-weight: 800;
      color: #ffffff;
      opacity: 0.85;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-family: var(--font-family);
      border: 2px solid rgba(197, 155, 39, 0.3);
      padding: 0.5rem 2.5rem;
      border-radius: 8px;
      background: rgba(197, 155, 39, 0.05);
      transition: all var(--transition-speed);
      cursor: default;
    }
    .partner-logo:hover {
      opacity: 1;
      border-color: var(--primary);
      color: var(--primary);
      box-shadow: 0 0 15px var(--primary-glow);
    }

    /* Services Section */
    .services-section {
      padding: 5rem 5%;
      background: #ffffff;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .service-item {
      text-align: center;
      padding: 2.5rem 1.5rem;
    }

    .service-icon {
      font-size: 2.5rem;
      margin-bottom: 1.25rem;
    }

    .service-item h4 {
      font-size: 1.1rem;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
    }

    .service-item p {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    /* Inquiry Section */
    .inquiry-section {
      padding: 5rem 5%;
      background: #faf9f6;
    }

    .inquiry-wrapper {
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 4.5fr 5.5fr;
      gap: 3rem;
      padding: 3rem;
      background: #ffffff;
    }

    .inquiry-content h3 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .inquiry-content p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .quick-contacts {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .quick-contact-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .quick-contact-item .c-icon {
      width: 45px;
      height: 45px;
      background: #faf9f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: var(--primary);
    }

    .quick-contact-item div {
      display: flex;
      flex-direction: column;
    }

    .quick-contact-item div strong {
      font-size: 0.8rem;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .quick-contact-item div a {
      color: var(--text-primary);
      font-weight: 700;
      text-decoration: none;
      font-size: 1.05rem;
      transition: color var(--transition-speed);
    }

    .quick-contact-item div a:hover {
      color: var(--primary);
    }

    .inquiry-form-container {
      background: #ffffff;
      padding: 2rem;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .success-alert {
      display: flex;
      padding: 1.5rem;
      font-size: 0.95rem;
      line-height: 1.5;
      text-transform: none;
      border-radius: 8px;
    }

    /* Footer Styles (AdvantageGo style: black background) */
    .footer {
      background: #000000;
      color: #e5e2db;
      position: relative;
      padding-top: 4px;
    }

    .footer-gradient-line {
      height: 6px;
      background: linear-gradient(90deg, var(--primary) 0%, #aa7c11 50%, var(--primary) 100%);
      width: 100%;
    }

    .footer-content {
      padding: 5rem 5% 2rem 5%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .footer-main {
      display: grid;
      grid-template-columns: 4.5fr 2.5fr 5fr;
      gap: 4rem;
      margin-bottom: 4rem;
    }

    .footer-brand-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .footer-brand-column .brand-name {
      color: white;
    }

    .footer-brand-column .brand-tagline {
      color: var(--primary);
    }

    .footer-intro-desc {
      font-size: 0.85rem;
      color: #bfbbae;
      line-height: 1.6;
    }

    .executive-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .exec-item {
      display: flex;
      font-size: 0.85rem;
      gap: 0.5rem;
    }

    .exec-item .role {
      color: var(--primary);
      font-weight: 700;
    }

    .exec-item .name {
      color: white;
      font-weight: 600;
    }

    .footer-links-column h5,
    .footer-contacts-column h5 {
      color: white;
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .footer-links-column ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .footer-links-column ul li a {
      color: #bfbbae;
      text-decoration: none;
      font-size: 0.875rem;
      cursor: pointer;
      transition: color var(--transition-speed);
    }

    .footer-links-column ul li a:hover {
      color: var(--primary);
    }

    .footer-contacts-column {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .contact-detail-line {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: #bfbbae;
      line-height: 1.5;
    }

    .contact-detail-line .footer-icon {
      font-size: 1.1rem;
      color: var(--primary);
    }

    .contact-detail-line a {
      color: white;
      text-decoration: none;
      font-weight: 600;
    }

    .contact-detail-line a:hover {
      color: var(--primary);
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 1.5rem;
      text-align: center;
      font-size: 0.8rem;
      color: #8c887d;
    }

    /* Responsive adjustments */
    @media (max-width: 992px) {
      .footer-main {
        grid-template-columns: 1fr;
        gap: 3rem;
      }
      .inquiry-wrapper {
        grid-template-columns: 1fr;
        gap: 2rem;
        padding: 2rem;
      }
      .services-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .hero-section {
        height: 70vh;
        padding: 0 5%;
      }
      .hero-title {
        font-size: 2.25rem;
      }
      .stats-container {
        grid-template-columns: repeat(2, 1fr);
      }
      .fleet-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .stats-container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  isMenuOpen = false;
  inquirySubmitted = false;
  isOutstationModalOpen = false;
  outstationSubmitted = false;

  inquiryForm = {
    name: '',
    phone: '',
    carPreference: 'Any Sedan',
    notes: ''
  };

  outstationForm = {
    name: '',
    phone: '',
    tripType: 'One Way',
    pickupLocation: '',
    dropLocation: '',
    checkinDateTime: '',
    checkoutDateTime: '',
    passengerCount: 1,
    carPreference: 'Any Sedan',
    remarks: ''
  };

  ngOnInit(): void {
    // Initial load logic
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  scrollToSection(sectionId: string) {
    this.isMenuOpen = false;
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 75;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  scrollToTop() {
    this.isMenuOpen = false;
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  selectCar(carName: string) {
    this.inquiryForm.carPreference = carName;
    this.scrollToSection('inquiry');
  }

  openOutstationModal() {
    this.isMenuOpen = false;
    this.isOutstationModalOpen = true;
  }

  closeOutstationModal() {
    this.isOutstationModalOpen = false;
    this.outstationSubmitted = false;
    this.outstationForm = {
      name: '',
      phone: '',
      tripType: 'One Way',
      pickupLocation: '',
      dropLocation: '',
      checkinDateTime: '',
      checkoutDateTime: '',
      passengerCount: 1,
      carPreference: 'Any Sedan',
      remarks: ''
    };
  }

  submitInquiry(event: Event) {
    event.preventDefault();
    if (!this.inquiryForm.name || !this.inquiryForm.phone) {
      alert('Please fill in your name and phone number.');
      return;
    }
    
    // Save to local storage for the Admin Panel inquiries view
    const current = JSON.parse(localStorage.getItem('general_inquiries') || '[]');
    const newInquiry = {
      id: Date.now(),
      name: this.inquiryForm.name,
      phone: this.inquiryForm.phone,
      carPreference: this.inquiryForm.carPreference,
      notes: this.inquiryForm.notes,
      date: new Date().toISOString(),
      status: 'New'
    };
    current.push(newInquiry);
    localStorage.setItem('general_inquiries', JSON.stringify(current));

    console.log('[Inquiry Submitted]', newInquiry);
    this.inquirySubmitted = true;
    
    // Reset form after delay
    setTimeout(() => {
      this.inquirySubmitted = false;
      this.inquiryForm = {
        name: '',
        phone: '',
        carPreference: 'Any Sedan',
        notes: ''
      };
    }, 5000);
  }

  submitOutstationQuery(event: Event) {
    event.preventDefault();
    if (!this.outstationForm.name || !this.outstationForm.phone || !this.outstationForm.pickupLocation || !this.outstationForm.dropLocation) {
      alert('Please fill in all required fields.');
      return;
    }

    // Save to local storage for the Admin Panel outstation requests view
    const current = JSON.parse(localStorage.getItem('outstation_queries') || '[]');
    const newQuery = {
      id: Date.now(),
      name: this.outstationForm.name,
      phone: this.outstationForm.phone,
      tripType: this.outstationForm.tripType,
      pickupLocation: this.outstationForm.pickupLocation,
      dropLocation: this.outstationForm.dropLocation,
      checkinDateTime: this.outstationForm.checkinDateTime,
      checkoutDateTime: this.outstationForm.tripType === 'Round Trip' ? this.outstationForm.checkoutDateTime : '',
      passengerCount: this.outstationForm.passengerCount,
      carPreference: this.outstationForm.carPreference,
      remarks: this.outstationForm.remarks,
      date: new Date().toISOString(),
      status: 'New'
    };
    current.push(newQuery);
    localStorage.setItem('outstation_queries', JSON.stringify(current));

    console.log('[Outstation Query Submitted]', newQuery);
    this.outstationSubmitted = true;

    // Close modal after brief delay
    setTimeout(() => {
      this.closeOutstationModal();
    }, 4000);
  }
}
