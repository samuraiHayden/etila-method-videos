import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";

export default function LiabilityWaiver() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 pt-28 pb-20 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2">Assumption of Risk, Liability Waiver, and Release Agreement</h1>
        <p className="text-sm text-muted-foreground mb-10">Last Updated: March 16, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-medium [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">
          <p>This Assumption of Risk, Liability Waiver, and Release Agreement ("Agreement") governs your participation in any health, fitness, nutrition, training, coaching, accountability, educational, or wellness services provided by Etila, LLC ("Etila," "Company," "we," "us," or "our"), including services delivered through websites, mobile applications, coaching portals, messaging platforms, digital programs, community forums, educational materials, and any related services or technologies (collectively, the "Services").</p>
          <p>By accessing or using the Services, you acknowledge that you have read, understood, and voluntarily agree to the terms of this Agreement. If you do not agree with this Agreement, you must not participate in the Services.</p>

          <section>
            <h2>1. Voluntary Participation</h2>
            <p>You acknowledge that participation in fitness training, exercise programs, physical conditioning, nutritional modifications, and related wellness activities is voluntary. You understand that you may choose whether or not to participate in any activity and that you are free to decline, modify, pause, or discontinue participation at any time. Etila does not supervise your physical movements in real time, does not control the environment in which workouts occur, and does not monitor your physiological responses to exercise.</p>
          </section>

          <section>
            <h2>2. Assumption of Inherent Risks</h2>
            <p>You acknowledge that participation in exercise, training, and nutrition programs involves inherent risks, including risks that cannot be eliminated regardless of the level of care exercised by Etila. These risks include, but are not limited to: muscle strains and tears, ligament injuries, joint injuries, overuse injuries, falls or impact injuries, dehydration, dizziness or fainting, cardiovascular stress or events, allergic reactions to foods or supplements, aggravation of pre-existing medical conditions, equipment malfunctions, or unsafe conditions at gyms or other training environments.</p>
            <p>Such risks may result in serious bodily injury, illness, permanent disability, or death. By participating in the Services, you knowingly and voluntarily assume all risks associated with such activities, whether known or unknown, foreseeable or unforeseeable.</p>
          </section>

          <section>
            <h2>3. Responsibility for Workout Environment</h2>
            <p>You acknowledge that workouts and physical activities recommended through the Services may occur in environments not controlled by Etila, including commercial gyms, home workout environments, outdoor spaces, or recreational facilities. You accept full responsibility for evaluating the safety and suitability of any environment, equipment, or facility used in connection with the Services.</p>
          </section>

          <section>
            <h2>4. Responsibility for Equipment Use</h2>
            <p>You acknowledge that certain workouts may involve the use of exercise equipment including weights, resistance bands, machines, cardio equipment, or other training devices. You agree that you are solely responsible for selecting appropriate equipment, using equipment safely, ensuring equipment is properly maintained, and understanding how to perform movements correctly.</p>
          </section>

          <section>
            <h2>5. Assumption of Nutrition-Related Risks</h2>
            <p>You acknowledge that implementing nutrition guidance, dietary changes, caloric modifications, or supplementation may carry risks. Such risks may include allergic reactions, digestive issues, metabolic responses, nutrient deficiencies, interactions with medications, and/or aggravation of medical conditions. You agree that you are solely responsible for evaluating whether any dietary recommendation is appropriate for your personal health status.</p>
          </section>

          <section>
            <h2>6. Health Status Representations</h2>
            <p>By participating in the Services, you represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You are physically capable of participating in exercise activities</li>
              <li>You have consulted with a qualified healthcare professional where appropriate</li>
              <li>You do not have a medical condition that would make participation unsafe without medical supervision</li>
              <li>You will discontinue exercise if you experience pain, dizziness, or other concerning symptoms</li>
            </ul>
            <p>You further agree to promptly disclose any injuries, medical conditions, or limitations that may affect your ability to participate safely.</p>
          </section>

          <section>
            <h2>7. Fitness Readiness Certification</h2>
            <p>By enrolling in or participating in the Services, you represent and warrant that you are physically capable of engaging in exercise activities and that you have no medical condition, injury, illness, impairment, or other health limitation that would make participation unsafe without appropriate medical supervision.</p>
            <p>You further represent that you have either: (1) consulted with a qualified physician or other licensed healthcare professional regarding your participation, or (2) voluntarily chosen to participate without seeking medical advice despite understanding that such consultation is recommended.</p>
            <p>You agree that you will immediately discontinue any exercise or dietary activity if you experience pain, dizziness, shortness of breath, nausea, fainting, or other symptoms indicating that continued participation may be unsafe.</p>
          </section>

          <section>
            <h2>8. Release of Liability</h2>
            <p>To the fullest extent permitted by applicable law, you hereby release, waive, discharge, and covenant not to sue Etila and its parent companies, subsidiaries, affiliates, members, managers, officers, directors, employees, contractors, coaches, agents, licensors, service providers, and successors (collectively, the "Etila Parties") from any and all claims, demands, causes of action, liabilities, damages, losses, or expenses arising from or related to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your participation in exercise or training activities</li>
              <li>Your implementation of nutrition or dietary recommendations</li>
              <li>Your use of workout environments or equipment</li>
              <li>Injuries occurring during workouts or training</li>
              <li>Adverse reactions to dietary changes or supplements</li>
              <li>Communication with coaches or other users</li>
              <li>Any reliance on information provided through the Services</li>
            </ul>
          </section>

          <section>
            <h2>9. Covenant Not to Sue</h2>
            <p>You agree that you will not initiate or participate in any lawsuit, arbitration, or legal proceeding against any of the Etila Parties arising out of or related to your participation in the Services, except to the extent such waiver is prohibited by applicable law.</p>
          </section>

          <section>
            <h2>10. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless the Etila Parties from and against any and all claims, damages, liabilities, losses, costs, or expenses (including attorneys' fees) arising out of or related to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your participation in exercise activities</li>
              <li>Injuries to yourself or others arising from your conduct</li>
              <li>Your misuse of equipment or facilities</li>
              <li>Your violation of the Terms of Service or applicable laws</li>
              <li>Your submission of inaccurate health information</li>
              <li>Your use of third-party facilities or services in connection with the Services</li>
            </ul>
          </section>

          <section>
            <h2>11. Third-Party Facilities and Services</h2>
            <p>Etila does not own, operate, or control gyms, fitness facilities, or training environments where users may perform workouts. You acknowledge that Etila shall not be responsible for the condition of third-party facilities, acts or omissions of gym staff or other patrons, or injuries occurring at third-party locations.</p>
          </section>

          <section>
            <h2>12. Media and Progress Content</h2>
            <p>You acknowledge that you may voluntarily submit progress photos, videos, testimonials, or other materials relating to your participation in the Services. Such materials may be used by Etila in accordance with the Terms of Service and Privacy Policy. Submission of such materials does not alter the allocation of risks described in this Agreement.</p>
          </section>

          <section>
            <h2>13. Severability</h2>
            <p>If any provision of this Agreement is determined by a court or arbitrator to be invalid or unenforceable, the remaining provisions shall remain in full force and effect. Any invalid provision shall be modified only to the extent necessary to make it enforceable while preserving its original intent.</p>
          </section>

          <section>
            <h2>14. Acknowledgment of Understanding</h2>
            <p>By accessing or using the Services, enrolling in a program, or otherwise participating in activities associated with the Services, you acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You have carefully read this Agreement</li>
              <li>You understand the risks associated with exercise and dietary changes</li>
              <li>You voluntarily assume those risks</li>
              <li>You agree to the liability waiver and release described above</li>
            </ul>
            <p>This Agreement is intended to be as broad and inclusive as permitted by applicable law.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground flex flex-wrap gap-2">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link to="/medical-disclaimer" className="hover:text-foreground transition-colors">Medical Disclaimer</Link>
          <span>·</span>
          <Link to="/" className="hover:text-foreground transition-colors">Back to Home</Link>
        </div>
      </main>
    </div>
  );
}
