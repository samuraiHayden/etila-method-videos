import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";

export default function MedicalDisclaimer() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 pt-28 pb-20 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-2">Health and Medical Disclaimer</h1>
        <p className="text-sm text-muted-foreground mb-10">Last Updated: March 16, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:font-medium [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">
          <p>This Health and Medical Disclaimer ("Disclaimer") governs your participation in any health, fitness, nutrition, coaching, educational, or wellness services provided by Etila, LLC ("Etila," "Company," "we," "us," or "our"), including services delivered through websites, mobile applications, software platforms, client portals, messaging systems, community platforms, educational materials, coaching communications, digital programs, and any associated services or technologies (collectively, the "Services").</p>
          <p>By accessing or using the Services, you acknowledge that you have read, understood, and agree to the terms of this Disclaimer. If you do not agree with this Disclaimer, you must not participate in the Services.</p>

          <section>
            <h2>1. Informational Purposes Only</h2>
            <p>The Services provided by Etila, including workout plans, exercise demonstrations, meal guidance, nutrition suggestions, coaching communications, educational materials, and related content, are provided solely for general informational, educational, and motivational purposes.</p>
            <p>The Services are not intended to diagnose, treat, cure, prevent, or manage any disease, injury, medical condition, or mental health condition. Any information provided through the Services should not be interpreted as medical advice, healthcare guidance, or treatment recommendations.</p>
          </section>

          <section>
            <h2>2. No Physician-Patient or Healthcare Provider Relationship</h2>
            <p>Your use of the Services does not create any physician-patient relationship, therapist-patient relationship, registered dietitian-client relationship, or any other licensed healthcare provider relationship between you and Etila. Etila does not provide medical care, physical therapy, rehabilitation services, clinical nutrition therapy, or other regulated healthcare services.</p>
          </section>

          <section>
            <h2>3. Consult a Physician Before Participation</h2>
            <p>You are strongly advised to consult with a qualified physician or other licensed healthcare professional before beginning any exercise program, modifying your diet, engaging in caloric restriction, beginning supplementation, resuming exercise following injury or illness, or implementing any recommendation provided through the Services.</p>
            <p>You should seek professional medical guidance particularly if you:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Have a known medical condition</li>
              <li>Have experienced chest pain, dizziness, fainting, or shortness of breath</li>
              <li>Are pregnant or postpartum</li>
              <li>Are recovering from surgery or injury</li>
              <li>Have cardiovascular disease, metabolic disease, orthopedic injuries, or other health conditions</li>
              <li>Are taking medications that may affect exercise tolerance or metabolism</li>
              <li>Have a history of eating disorders or other medical conditions affected by dietary changes</li>
            </ul>
          </section>

          <section>
            <h2>4. Fitness and Exercise Risks</h2>
            <p>Participation in physical exercise, resistance training, cardiovascular training, stretching, mobility work, or other fitness activities involves inherent risks, including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Muscle strains</li>
              <li>Ligament or tendon injuries</li>
              <li>Joint injuries</li>
              <li>Overuse injuries</li>
              <li>Dizziness or fainting</li>
              <li>Dehydration</li>
              <li>Cardiovascular events</li>
              <li>Allergic reactions</li>
              <li>Aggravation of pre-existing medical conditions</li>
              <li>Falls or equipment accidents</li>
            </ul>
            <p>In rare circumstances, exercise participation may result in serious injury, disability, or death. Etila does not supervise your physical movements in real time, does not monitor your physiological responses to exercise, and does not control the environment in which you perform workouts.</p>
            <p>You are solely responsible for determining whether any exercise, workout, or training activity is appropriate for your personal condition.</p>
          </section>

          <section>
            <h2>5. Nutrition and Dietary Guidance Disclaimer</h2>
            <p>Any nutrition information provided through the Services, including meal plans, macro targets, caloric ranges, food suggestions, grocery lists, or recipe materials, is provided solely for general educational purposes. Such materials are not individualized medical nutrition therapy and are not intended to diagnose, treat, cure, or prevent any disease.</p>
            <p>You remain solely responsible for determining whether any dietary recommendation or food suggestion is safe and appropriate for your individual circumstances. You should consult a qualified physician or registered dietitian before making significant dietary changes.</p>
          </section>

          <section>
            <h2>6. Supplements and Products</h2>
            <p>From time to time, the Services may reference supplements, nutrition products, equipment, or other health-related products. Any such references are provided solely for informational purposes. Etila does not guarantee the safety, effectiveness, purity, legality, or suitability of any supplement, product, or third-party item referenced through the Services.</p>
          </section>

          <section>
            <h2>7. No Guarantee of Results</h2>
            <p>Health, fitness, weight loss, body composition, and performance outcomes vary significantly among individuals. Factors affecting results include, but are not limited to, adherence to programs, effort and consistency, sleep, stress, genetics, medical conditions, and lifestyle factors.</p>
          </section>

          <section>
            <h2>8. User Responsibility for Health Decisions</h2>
            <p>You acknowledge that you are solely responsible for all decisions relating to your health, exercise activities, dietary choices, supplement use, and lifestyle changes. You may decline, modify, pause, or discontinue any recommendation at any time. All participation is undertaken voluntarily and at your own risk.</p>
          </section>

          <section>
            <h2>9. No Emergency Services</h2>
            <p>The Services do not provide emergency monitoring, emergency medical response, or urgent healthcare support. Messaging systems, coaching platforms, or community features are not monitored continuously. If you experience a medical emergency, you should immediately contact emergency services (such as 911) or seek assistance from a qualified healthcare professional.</p>
          </section>

          <section>
            <h2>10. Limitation of Reliance</h2>
            <p>You acknowledge that any educational content, coaching communication, fitness materials, nutrition guidance, or other information provided through the Services is intended solely as general guidance. You agree that you are acting independently in evaluating whether and how to implement any such information.</p>
          </section>

          <section>
            <h2>11. User Representations</h2>
            <p>By using the Services, you represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You are physically capable of participating in exercise activities</li>
              <li>You have obtained appropriate medical advice where necessary</li>
              <li>You will discontinue activity if you experience pain, dizziness, or symptoms of medical distress</li>
              <li>You will exercise reasonable judgment when participating in workouts or implementing recommendations</li>
            </ul>
          </section>

          <section>
            <h2>12. Acknowledgment</h2>
            <p>By accessing or using the Services, you acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>You have read this Health and Medical Disclaimer</li>
              <li>You understand the risks associated with exercise and dietary changes</li>
              <li>You understand that Etila does not provide medical care or medical advice</li>
              <li>You agree to assume responsibility for your health decisions</li>
            </ul>
            <p>Your participation in the Services constitutes your voluntary acceptance of the terms of this Disclaimer.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground flex flex-wrap gap-2">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link to="/liability-waiver" className="hover:text-foreground transition-colors">Liability Waiver</Link>
          <span>·</span>
          <Link to="/" className="hover:text-foreground transition-colors">Back to Home</Link>
        </div>
      </main>
    </div>
  );
}
