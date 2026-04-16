// src/router.jsx

import { createBrowserRouter } from "react-router-dom";

// Import Layouts and Protection
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Import All Page Components
import { HomePage } from "./pages/HomePage";
import { DiscoverProjectsPage } from "./pages/DiscoverProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { BrowseUsersPage } from "./pages/BrowseUsersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SignUpPage } from "./pages/SignUpPage";
import { LoginPage } from "./pages/LoginPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MessagesPage } from "./pages/MessagesPage";
import { PostProjectPage } from "./pages/PostProjectPage";
import { RequestsPage } from "./pages/RequestsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SupportPage } from "./pages/SupportPage";
import { MyProjectsPage } from "./pages/MyProjectsPage";
import { EditProjectPage } from "./pages/EditProjectPage";
import { SentRequestsPage } from "./pages/SentRequestsPage";
import { AboutPage } from "./pages/AboutPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "./pages/TermsOfServicePage";
import { PaymentPage } from "./pages/PaymentPage";
import { MyNetworkPage } from './pages/MyNetworkPage';
import { OAuthCallback } from './pages/OAuthCallback';
import { OnboardingPage } from './pages/OnboardingPage';
import { PaymentSuccessPage } from "./pages/PaymentSuccessPage";
import { PaymentCancelPage } from "./pages/PaymentCancelPage";
import { InfoHubPage } from "./pages/InfoHubPage";
import { ArticleDetailPage } from "./pages/ArticleDetailPage";
import { ValidationBoardPage } from "./pages/ValidationBoardPage";
import { IdeaDetailPage } from "./pages/IdeaDetailPage";
import { CreateIdeaPage } from "./pages/CreateIdeaPage";
import { StackSuitePage } from "./pages/StackSuitePage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SavedItemsPage } from "./pages/SavedItemsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // --- PUBLIC CHILDREN ROUTES ---
      { index: true, element: <HomePage /> },
      { path: "projects", element: <DiscoverProjectsPage /> },
      { path: "projects/:projectId", element: <ProjectDetailPage /> },
      { path: "users", element: <BrowseUsersPage /> },
      { path: "users/:userId", element: <ProfilePage /> },
      { path: "signup", element: <SignUpPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password/:token", element: <ResetPasswordPage /> },
      { path: "support", element: <SupportPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "privacy", element: <PrivacyPolicyPage /> },
      { path: "terms", element: <TermsOfServicePage /> },
      { path: "info-hub", element: <InfoHubPage /> },
      { path: "info-hub/:slug", element: <ArticleDetailPage /> },
      { path: "auth/callback", element: <OAuthCallback /> },
      { path: "onboarding", element: <OnboardingPage /> },
      { path: "validation-board", element: <ValidationBoardPage /> },
      { path: "validation-board/:id", element: <IdeaDetailPage /> },
      { path: "stack-suite", element: <StackSuitePage /> },

      // --- PROTECTED CHILDREN ROUTES ---
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "my-projects", element: <MyProjectsPage /> },
          { path: "projects/edit/:projectId", element: <EditProjectPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "requests", element: <RequestsPage /> },
          { path: "my-applications", element: <SentRequestsPage /> },
          { path: "messages", element: <MessagesPage /> },
          { path: "messages/:userId", element: <MessagesPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "post-project", element: <PostProjectPage /> },
          { path: "validation-board/create", element: <CreateIdeaPage /> },
          { path: "payment", element: <PaymentPage /> },
          { path: "payment/success", element: <PaymentSuccessPage /> },
          { path: "payment/cancel", element: <PaymentCancelPage /> },
          { path: "my-network", element: <MyNetworkPage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "saved-items", element: <SavedItemsPage /> },
        ]
      }
    ]
  },
]);