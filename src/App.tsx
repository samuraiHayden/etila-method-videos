import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useEffect } from "react";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Client pages
import Dashboard from "./pages/Dashboard";
import WorkoutsPage from "./pages/Workouts";
import WorkoutDetail from "./pages/WorkoutDetail";
import DayWorkoutDetail from "./pages/DayWorkoutDetail";
import CoursesPage from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import MealsPage from "./pages/Meals";
import ProfilePage from "./pages/Profile";
import ProgressPage from "./pages/Progress";
import MessagesPage from "./pages/Messages";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import ResetPasswordPage from "./pages/ResetPassword";
import PaymentSuccessPage from "./pages/PaymentSuccess";
import LandingPage from "./pages/Landing";
import QuestionnairePage from "./pages/Questionnaire";
import BookCallPage from "./pages/BookCall";
import CourseOfferPage from "./pages/CourseOffer";
import CheckoutPage from "./pages/Checkout";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import MedicalDisclaimer from "./pages/MedicalDisclaimer";
import LiabilityWaiver from "./pages/LiabilityWaiver";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPrograms from "./pages/admin/AdminPrograms";
import AdminWorkouts from "./pages/admin/AdminWorkouts";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseDetail from "./pages/admin/AdminCourseDetail";
import AdminMeals from "./pages/admin/AdminMeals";
import AdminScheduling from "./pages/admin/AdminScheduling";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminClientWorkouts from "./pages/admin/AdminClientWorkouts";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminEmailWorkflows from "./pages/admin/AdminEmailWorkflows";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/questionnaire" element={<QuestionnairePage />} />
            <Route path="/book-call" element={<BookCallPage />} />
            <Route path="/course-offer" element={<CourseOfferPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/medical-disclaimer" element={<MedicalDisclaimer />} />
            <Route path="/liability-waiver" element={<LiabilityWaiver />} />

            {/* Client routes (protected) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts"
              element={
                <ProtectedRoute>
                  <WorkoutsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workout/:id"
              element={
                <ProtectedRoute>
                  <WorkoutDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workout/day/:dayOfWeek"
              element={
                <ProtectedRoute>
                  <DayWorkoutDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <CoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <ProtectedRoute>
                  <CourseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id/module/:moduleId"
              element={
                <ProtectedRoute>
                  <CourseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meals"
              element={
                <ProtectedRoute>
                  <MealsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <ProgressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes (protected, admin only) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/leads"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLeads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users/:userId"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/programs"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPrograms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/scheduling"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminScheduling />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/workouts"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminWorkouts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses/:courseId"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminCourseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/meals"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminMeals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/client-workouts"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminClientWorkouts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/client-workouts/:userId"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminClientWorkouts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminMessages />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/workflows"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminEmailWorkflows />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
