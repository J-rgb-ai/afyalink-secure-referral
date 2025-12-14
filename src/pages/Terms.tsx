import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">AFYALINK – Terms and Conditions</h1>
          <p className="text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-slate max-w-none space-y-8 text-foreground">
            <p className="leading-relaxed">
              AFYALINK is a secure digital health platform designed to support electronic referrals, 
              healthcare coordination, and secure medical information exchange. By accessing or using 
              AFYALINK, you agree to these Terms and Conditions.
            </p>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">1. Definitions</h2>
              <ul className="space-y-2 list-none">
                <li><span className="font-semibold">“AFYALINK”</span> refers to the electronic health referral and information management system.</li>
                <li><span className="font-semibold">“User”</span> refers to authorized healthcare professionals, administrators, and approved staff.</li>
                <li><span className="font-semibold">“Patient Data”</span> refers to personal and sensitive health information as defined under the Kenya Data Protection Act, 2019.</li>
                <li><span className="font-semibold">“Doctor Data”</span> refers to professional and personal data of healthcare providers processed within the system.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">2. Acceptance of Terms</h2>
              <p className="mb-2">By using AFYALINK, you confirm that you:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Have read and understood these Terms</li>
                <li>Agree to comply with them</li>
                <li>Are authorized to process health data under applicable Kenyan law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">3. User Eligibility and Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access is restricted to verified and authorized users.</li>
                <li>Users must comply with confidentiality obligations under Section 25 and 26 of the Data Protection Act, 2019.</li>
                <li>Login credentials must not be shared.</li>
                <li>Any misuse or unauthorized access constitutes a legal violation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">4. Purpose and Permitted Use</h2>
              <p className="mb-2">AFYALINK shall be used solely for:</p>
              <ul className="list-disc pl-6 space-y-1 mb-2">
                <li>Secure patient referrals</li>
                <li>Clinical data exchange</li>
                <li>Healthcare reporting and coordination</li>
              </ul>
              <p>Use of the system must comply with the lawfulness, fairness, and transparency principles set out in Section 25 of the Data Protection Act, 2019.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">5. Data Protection, Privacy, and Security</h2>
              <p className="mb-4">AFYALINK is committed to protecting patient and doctor data in compliance with the Kenya Data Protection Act (2019) and relevant health regulations.</p>
              
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div>
                  <h3 className="font-semibold text-lg">5.1 Lawful Processing</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Personal and health data is processed in accordance with Section 30 of the Act.</li>
                    <li>Data is processed only for specified, explicit, and legitimate healthcare purposes.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg">5.2 Consent and Patient Rights</h3>
                  <p>Where required, patient consent is obtained before processing data, as provided under Section 32.</p>
                  <p>Data subjects have the right to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Access their data</li>
                    <li>Request correction or deletion</li>
                    <li>Object to unlawful processing</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-1">as provided under Section 26 of the Act.</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg">5.3 Access Control</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Role-Based Access Control (RBAC) limits data access to authorized users only.</li>
                    <li>Authentication mechanisms prevent unauthorized access.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg">5.4 Data Encryption</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Data in transit is protected using secure encryption protocols (HTTPS/TLS).</li>
                    <li>Sensitive data at rest is encrypted to prevent unauthorized disclosure.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg">5.5 Secure Storage and Retention</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Data is stored securely in compliance with Section 41 of the Act.</li>
                    <li>Data is retained only for as long as necessary to fulfill healthcare purposes.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg">5.6 Audit Logs and Accountability</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>All system activities are logged in accordance with Section 31.</li>
                    <li>Logs support accountability and breach investigation.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg">5.7 Data Breach Management</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Any data breach is handled in accordance with Section 43 of the Act.</li>
                    <li>Relevant authorities and affected parties are notified where legally required.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">6. Confidentiality Obligations</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Users must maintain confidentiality of all personal and health data as required under Section 25.</li>
                <li>Unauthorized disclosure may result in access termination and legal action.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">7. Intellectual Property</h2>
              <p>All system software, content, and designs remain the intellectual property of the AFYALINK Project.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">8. System Availability</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>AFYALINK aims to provide reliable service but does not guarantee uninterrupted availability.</li>
                <li>Maintenance and security updates may cause temporary downtime.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">9. Limitation of Liability</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>AFYALINK supports healthcare delivery but does not replace professional medical judgment.</li>
                <li>The project is not liable for decisions made based on system data or user errors.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">10. Termination of Access</h2>
              <p className="mb-2">AFYALINK may suspend or terminate access if:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>These Terms are violated</li>
                <li>Data protection obligations are breached</li>
                <li>Security risks are detected</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">11. Amendments</h2>
              <p>AFYALINK reserves the right to update these Terms. Continued use constitutes acceptance of revisions.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-primary">12. Governing Law</h2>
              <p>These Terms and Conditions are governed by the laws of the Republic of Kenya, including the Kenya Data Protection Act, 2019.</p>
            </section>

            <section className="bg-secondary/20 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-3 text-primary">13. Contact Information</h2>
              <div className="space-y-2">
                <p><span className="font-semibold">Project Name:</span> AFYALINK</p>
                <p><span className="font-semibold">Email:</span> vanessakrystal231@gmail.com</p>
              </div>
            </section>

            <section className="bg-primary/5 p-8 rounded-lg border border-primary/20 text-center">
              <h2 className="text-2xl font-bold mb-4 text-primary">Declaration</h2>
              <p className="text-lg leading-relaxed">
                By using AFYALINK, you acknowledge your obligations under the Kenya Data Protection Act (2019) 
                and agree to comply with all data protection and confidentiality requirements.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
