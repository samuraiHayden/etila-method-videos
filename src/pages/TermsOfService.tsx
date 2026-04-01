import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 pt-28 pb-20 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last Updated: March 16, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-medium [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2 [&_strong]:text-foreground">
          <p>These Terms of Service (these "Terms") govern your access to and use of the websites, mobile applications, software platforms, coaching portals, community features, messaging systems, digital programs, educational materials, meal-planning tools, workout-tracking tools, progress-tracking features, and related services operated by Etila, LLC ("Etila," "Company," "we," "us," or "our") in connection with its health, fitness, nutrition, coaching, accountability, and educational offering (collectively, the "Services").</p>
          <p>By accessing or using the Services, creating an account, checking a box indicating acceptance of these Terms, purchasing a program, subscription, membership, or other offering, participating in coaching, or otherwise interacting with the Services, you acknowledge that you have read, understood, and agree to be bound by these Terms and all policies and supplemental terms incorporated herein by reference, including the Privacy Policy, any Health Disclaimer, any Assumption of Risk and Release provisions, and any applicable program-specific addenda.</p>
          <p>Etila reserves the right to modify or update these Terms at any time in its sole discretion. Updated versions will be posted through the Services and shall become effective upon posting unless otherwise specified.</p>

          <section>
            <h2>1. Definitions</h2>
            <p>"Etila," "Company," "we," "us," or "our" means Etila, LLC and its parents, subsidiaries, affiliates, successors, assigns, contractors, service providers, licensors, and authorized representatives. "Services" means all websites, mobile applications, software platforms, client portals, communication systems, coaching tools, educational materials, training programs, accountability systems, meal-planning tools, nutrition resources, fitness programming, exercise libraries, video content, digital downloads, communities, and related products or services provided by or on behalf of Etila. "User," "you," or "your" means any individual or entity that accesses, uses, purchases, enrolls in, or interacts with the Services. "Programs" means any coaching package, membership, subscription, course, challenge, transformation program, or similar offering made available through the Services. "User Content" means any content, information, messages, photos, videos, measurements, check-ins, questionnaire responses, workout logs, nutrition logs, health-related information, progress updates, testimonials, feedback, or other materials submitted by you through or in connection with the Services. "Health Information" means any information you provide relating to your body metrics, weight, exercise history, fitness level, food preferences, goals, injuries, restrictions, symptoms, medical history, medications, or similar information.</p>
          </section>

          <section>
            <h2>2. Eligibility</h2>
            <p>You must be at least eighteen (18) years of age and legally capable of entering into a binding contract in order to access or use the Services. By accessing or using the Services, you represent and warrant that you satisfy these eligibility requirements.</p>
          </section>

          <section>
            <h2>3. Account Registration; Electronic Acceptance; Records of Assent</h2>
            <p>Certain features of the Services require you to create an account. You agree to provide accurate, complete, and current information and to update such information as necessary. Your electronic assent to these Terms, whether by checking a box, clicking an acceptance button, or otherwise affirmatively indicating acceptance, constitutes a legally binding electronic signature.</p>
            <p>Etila may maintain records of your acceptance, including the date and time of acceptance, the version of the Terms presented, your account credentials, device information, IP address, and related authentication data, and such records shall be admissible to establish your assent.</p>
            <p>You are solely responsible for maintaining the confidentiality of your login credentials and for all activities occurring under your account.</p>
          </section>

          <section>
            <h2>4. Nature of Services; Educational Fitness Coaching Only</h2>
            <p>The Services may include educational content, coaching communications, accountability systems, general fitness programming, exercise demonstrations, general nutrition guidance, meal-structure suggestions, wellness resources, progress tracking tools, messaging systems, community features, and other technology-enabled fitness support services. The Services are offered for general educational, informational, motivational, and self-directed fitness purposes only. Etila does not provide medical care, mental health treatment, physical therapy, or any other licensed professional healthcare services.</p>
          </section>

          <section>
            <h2>5. No Medical Advice; No Healthcare Provider Relationship</h2>
            <p>The Services are provided for informational and educational purposes only and do not constitute medical advice, diagnosis, treatment, or any other form of healthcare service. Nothing contained in the Services shall be construed as creating a physician-patient relationship, therapist-patient relationship, or any other licensed professional relationship.</p>
            <p>You should consult a qualified physician or other licensed healthcare professional before beginning any exercise program, changing your diet, or acting upon any information obtained through the Services.</p>

            <h3>5.1 Nutrition Content; No Dietetic or Medical Claims</h3>
            <p>Any meal plans, macro targets, food suggestions, grocery lists, recipe ideas, calorie ranges, or nutrition-related content are intended solely as general educational guidance and convenience tools. Such materials are not individualized medical nutrition therapy.</p>

            <h3>5.2 No Guaranteed Results; Transformation Disclaimers</h3>
            <p>Health, fitness, physique, body composition, performance, and wellness outcomes vary significantly among individuals. Etila makes no representations or warranties regarding weight loss, fat loss, muscle gain, aesthetic changes, strength increases, performance outcomes, or any other results from participation in the Services. Any testimonials or before-and-after images are examples only and do not constitute a promise or guarantee of results.</p>
          </section>

          <section>
            <h2>6. Assumption of Risk</h2>
            <p>You acknowledge that participation in exercise, physical training, resistance training, cardiovascular training, stretching, mobility work, nutrition changes, and other health-related activities involves inherent and significant risks, including without limitation the risk of muscle strain, soft tissue injury, falls, dizziness, dehydration, aggravation of pre-existing conditions, allergic reactions, cardiovascular events, illness, emotional distress, property damage, or, in rare cases, serious injury, disability, or death.</p>
            <p>By accessing or using the Services, you knowingly, voluntarily, and expressly assume all risks associated with such participation, whether known or unknown, foreseeable or unforeseeable.</p>
          </section>

          <section>
            <h2>7. Release of Liability</h2>
            <p>To the fullest extent permitted by applicable law, you hereby release, waive, acquit, and forever discharge Etila and its parent companies, subsidiaries, affiliates, officers, directors, members, managers, employees, contractors, coaches, agents, licensors, service providers, successors, and assigns (collectively, the "Etila Parties") from any and all claims, demands, causes of action, damages, losses, liabilities, costs, or expenses of any kind arising out of or related to your participation in the Services.</p>
          </section>

          <section>
            <h2>8. User Health Disclosures; Accuracy of Information</h2>
            <p>You agree to provide complete and accurate information requested by Etila in connection with onboarding questionnaires, coaching check-ins, readiness assessments, progress updates, injuries, limitations, medications, prior conditions, training experience, dietary restrictions, or other health-related matters. Etila shall not be responsible for any injury, adverse event, or other harm arising from inaccurate, incomplete, outdated, or omitted information supplied by you.</p>
          </section>

          <section>
            <h2>9. Community Features; Messaging; No Emergency Monitoring</h2>
            <p>The Services may include messaging features, group communities, progress review channels, comment functions, or other communication tools. These communications are provided for convenience and coaching support only. The Services are not monitored for emergency, urgent, or time-sensitive medical communications. In the event of an emergency, call 911 or your local emergency services provider immediately.</p>
          </section>

          <section>
            <h2>10. User Content; Progress Photos; Feedback; License to Company</h2>
            <p>By submitting User Content through or in connection with the Services, you grant Etila a worldwide, non-exclusive, sublicensable, transferable, royalty-free license to host, store, reproduce, process, adapt, modify, transmit, display, perform, distribute, and otherwise use such User Content as reasonably necessary to operate, improve, support, and provide the Services.</p>

            <h3>10.1 Testimonials; Before-and-After Content; Publicity Rights</h3>
            <p>By submitting testimonials, progress photos, or before-and-after materials, you grant Etila a perpetual, irrevocable, worldwide, royalty-free, sublicensable license to reproduce, publish, display, distribute, and otherwise use such materials in connection with the marketing, promotion, and operation of the Services.</p>
          </section>

          <section>
            <h2>11. Intellectual Property Rights</h2>
            <p>All content, materials, and technology provided through the Services are owned by Etila or its licensors and are protected by copyright, trademark, trade secret, and other applicable laws. Subject to your compliance with these Terms, Etila grants you a limited, revocable, non-exclusive, non-transferable license to access and use the Services solely for your own personal, non-commercial use.</p>
          </section>

          <section>
            <h2>12. Payments; Subscriptions; Recurring Billing; Chargebacks</h2>
            <p>Certain Services require payment. By purchasing or enrolling in any paid Service, you agree to pay all fees and charges associated with the selected offering. Subscription Services may renew automatically on a recurring basis. All purchases are final and non-refundable unless expressly stated otherwise at the time of purchase. Initiating a chargeback without first making a good-faith effort to resolve the issue directly with Etila may constitute a material breach of these Terms.</p>
          </section>

          <section>
            <h2>13. Refunds; Cancellations; Pausing; Program Access</h2>
            <p>Unless an applicable offer page or program-specific addendum expressly provides otherwise, all sales are final and non-refundable. Cancellation of a recurring subscription prevents future billing cycles only and does not entitle you to a refund of fees already paid.</p>
          </section>

          <section>
            <h2>14. Privacy; Health Information; Data Processing</h2>
            <p>Etila may collect, receive, store, process, analyze, and use personal information, account information, Health Information, device information, payment-related information, communications, usage data, progress data, and other information in connection with the operation of the Services, as further described in the <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.</p>
          </section>

          <section>
            <h2>15. Data Collection; Analytics; Marketing Use</h2>
            <p>Etila collects, receives, generates, analyzes, and processes a variety of information in connection with the operation, improvement, marketing, and commercialization of the Services. By accessing or using the Services, you acknowledge and agree that Etila may collect and process data through automated technologies including cookies, pixels, tracking scripts, analytics tools, marketing platforms, and similar technologies. Etila's data practices are further described in its <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.</p>
          </section>

          <section>
            <h2>16. Text Messages; Emails; Marketing Communications; TCPA Consent</h2>
            <p>By creating an account, enrolling in a Program, submitting your contact information, or otherwise interacting with the Services, you expressly consent to receive communications from Etila via email, telephone calls, text messages (SMS or MMS), push notifications, in-app messaging, or other electronic communications technologies. You may opt out of marketing communications at any time by following the unsubscribe instructions included in the applicable communication.</p>
          </section>

          <section>
            <h2>17. Platform Availability; Modifications</h2>
            <p>Etila reserves the right to modify, update, suspend, discontinue, or restrict access to any portion of the Services at any time in its sole discretion. Etila does not guarantee uninterrupted availability of the Services.</p>
          </section>

          <section>
            <h2>18. Prohibited Conduct</h2>
            <p>You agree not to use the Services in any manner that violates applicable law, infringes the rights of others, or interferes with the operation of the Services. Without limitation, you may not:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Services if you are under eighteen (18)</li>
              <li>Share account credentials or permit multiple users to access a single paid account</li>
              <li>Upload false, misleading, infringing, harassing, defamatory, or unlawful content</li>
              <li>Impersonate another person</li>
              <li>Solicit other users for competing services</li>
              <li>Scrape, copy, download, or systematically extract content from the Services</li>
              <li>Reverse engineer or attempt to access source code</li>
              <li>Interfere with platform security or upload malware</li>
              <li>Use the Services to create competing materials or services</li>
            </ul>
          </section>

          <section>
            <h2>19. Third-Party Services</h2>
            <p>The Services may interact with or rely upon Third-Party Services, including payment processors, hosting providers, communication tools, analytics tools, and other external systems. Such Third-Party Services are operated independently from Etila, and Etila does not control their performance, security, policies, or terms.</p>
          </section>

          <section>
            <h2>20. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless the Etila Parties from and against any and all claims, demands, actions, proceedings, liabilities, damages, losses, costs, and expenses, including reasonable attorneys' fees, arising out of or relating to: your use of the Services; your participation in any Program; your breach of these Terms; your User Content; your violation of any law or third-party right; injuries or damages arising from your exercise activities, equipment use, food selections, supplement use, or health decisions; payment disputes or chargebacks; or your misuse of platform features.</p>
          </section>

          <section>
            <h2>21. Disclaimer of Warranties</h2>
            <p className="uppercase text-xs leading-relaxed">TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICES ARE PROVIDED ON AN "AS IS," "AS AVAILABLE," AND "WITH ALL FAULTS" BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. ETILA EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, QUIET ENJOYMENT, SYSTEM INTEGRATION, OR THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, SUITABLE, OR EFFECTIVE FOR YOUR PARTICULAR GOALS.</p>
          </section>

          <section>
            <h2>22. Limitation of Liability</h2>
            <p className="uppercase text-xs leading-relaxed">TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE ETILA PARTIES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, ENHANCED, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, LOSS OF REVENUE, LOSS OF GOODWILL, LOSS OF DATA, BUSINESS INTERRUPTION, PERSONAL INJURY, EMOTIONAL DISTRESS, REPUTATIONAL HARM, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO THE SERVICES.</p>
            <p>To the maximum extent permitted by applicable law, the total aggregate liability of the Etila Parties for all claims shall not exceed the greater of (a) the total amount paid by you to Etila for the specific Service giving rise to the claim during the twelve (12) months preceding the event, or (b) two hundred fifty U.S. dollars (US $250.00).</p>
          </section>

          <section>
            <h2>23. Dispute Resolution; Binding Arbitration; Class Action Waiver</h2>
            <p>You and Etila agree that any dispute, claim, or controversy arising out of or relating to these Terms or the Services shall be resolved exclusively through final and binding arbitration on an individual basis. This arbitration agreement shall be governed by the Federal Arbitration Act. Before initiating arbitration, the party asserting the Dispute must first provide written notice and the parties agree to attempt informal resolution for thirty (30) days.</p>
            <p className="uppercase text-xs leading-relaxed mt-3">TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, YOU AND ETILA WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, COLLECTIVE ACTION, PRIVATE ATTORNEY GENERAL ACTION, MASS ACTION, OR OTHER REPRESENTATIVE PROCEEDING.</p>
          </section>

          <section>
            <h2>24. Governing Law</h2>
            <p>These Terms and all Disputes shall be governed by and construed in accordance with the laws of the State of Florida, without regard to conflict-of-laws principles. Any action properly brought in court shall be brought exclusively in the state or federal courts located in Miami-Dade County, Florida.</p>
          </section>

          <section>
            <h2>25. Termination</h2>
            <p>You may terminate your participation in the Services at any time by discontinuing use and, where applicable, canceling any active subscription. Cancellation of a subscription prevents future billing cycles only and does not entitle you to a refund of fees already paid for the current billing period. Etila reserves the right to suspend, restrict, or terminate accounts that violate these Terms.</p>
          </section>

          <section>
            <h2>26. Force Majeure</h2>
            <p>Etila shall not be liable for any failure or delay in performance caused by events beyond its reasonable control, including acts of God, illness, pandemics, labor disruptions, internet outages, hosting failures, power failures, cyber incidents, governmental actions, natural disasters, war, terrorism, civil unrest, or failures of third-party service providers.</p>
          </section>

          <section>
            <h2>27. Assignment</h2>
            <p>You may not assign, transfer, delegate, or otherwise convey any rights or obligations under these Terms without Etila's prior written consent. Etila may assign or transfer these Terms without restriction in connection with mergers, acquisitions, reorganizations, or other corporate transactions.</p>
          </section>

          <section>
            <h2>28. Severability; Waiver; Entire Agreement</h2>
            <p>If any provision of these Terms is found invalid, illegal, or unenforceable, the remaining provisions shall remain in full force and effect. These Terms, together with the Privacy Policy, health disclaimers, assumption of risk and release provisions, and any program-specific addenda, constitute the entire agreement between you and Etila regarding the Services.</p>
          </section>

          <section>
            <h2>29. Contact Information</h2>
            <p>Questions regarding these Terms may be directed to Etila through the contact information provided on the applicable website or platform through which the Services are offered.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground flex flex-wrap gap-2">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link to="/medical-disclaimer" className="hover:text-foreground transition-colors">Medical Disclaimer</Link>
          <span>·</span>
          <Link to="/liability-waiver" className="hover:text-foreground transition-colors">Liability Waiver</Link>
          <span>·</span>
          <Link to="/" className="hover:text-foreground transition-colors">Back to Home</Link>
        </div>
      </main>
    </div>
  );
}
