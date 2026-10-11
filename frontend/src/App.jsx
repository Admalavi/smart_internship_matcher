import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AdaptiveLayout, DashboardLayout, PublicLayout } from './layouts/Layouts';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import About from './pages/About';
import Discover from './pages/Discover';
import InternshipDetails from './pages/InternshipDetails';
import Notifications from './pages/Notifications';
import StudentDashboard from './pages/student/Dashboard';
import { Profile, ProfileEdit } from './pages/student/Profile';
import Skills from './pages/student/Skills';
import Projects from './pages/student/Projects';
import Recommendations from './pages/student/Recommendations';
import Saved from './pages/student/Saved';
import Applications from './pages/student/Applications';
import { SkillGaps, Learning } from './pages/student/SkillGaps';
import Settings from './pages/student/Settings';
import CompanyDashboard from './pages/company/Dashboard';
import CompanyProfile from './pages/company/Profile';
import InternshipForm from './pages/company/InternshipForm';
import MyInternships from './pages/company/MyInternships';
import CompanyApplications from './pages/company/Applications';
import Candidate from './pages/company/Candidate';
import AdminDashboard from './pages/admin/Dashboard';
import { ManageStudents, ManageCompanies, ManageInternships, ManageApplications } from './pages/admin/Manage';
import { Analytics, SkillAnalytics } from './pages/admin/Analytics';

const Guard = ({ role, children }) => <ProtectedRoute roles={[role]}>{children}</ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/about" element={<About />} />
      </Route>
      <Route element={<AdaptiveLayout />}>
        <Route path="/internships" element={<Discover />} /><Route path="/internships/:id" element={<InternshipDetails />} />
      </Route>

      <Route path="/student" element={<Guard role="student"><DashboardLayout /></Guard>}>
        <Route index element={<StudentDashboard />} /><Route path="profile" element={<Profile />} /><Route path="profile/edit" element={<ProfileEdit />} />
        <Route path="skills" element={<Skills />} /><Route path="projects" element={<Projects />} /><Route path="recommendations" element={<Recommendations />} />
        <Route path="saved" element={<Saved />} /><Route path="applications" element={<Applications />} /><Route path="skill-gaps" element={<SkillGaps />} />
        <Route path="learning" element={<Learning />} /><Route path="notifications" element={<Notifications />} /><Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/company" element={<Guard role="company"><DashboardLayout /></Guard>}>
        <Route index element={<CompanyDashboard />} /><Route path="profile" element={<CompanyProfile />} /><Route path="internships" element={<MyInternships />} />
        <Route path="internships/new" element={<InternshipForm />} /><Route path="internships/:id/edit" element={<InternshipForm />} />
        <Route path="applications" element={<CompanyApplications />} /><Route path="applications/:id" element={<Candidate />} /><Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="/admin" element={<Guard role="admin"><DashboardLayout /></Guard>}>
        <Route index element={<AdminDashboard />} /><Route path="analytics" element={<Analytics />} /><Route path="skills" element={<SkillAnalytics />} />
        <Route path="students" element={<ManageStudents />} /><Route path="companies" element={<ManageCompanies />} /><Route path="internships" element={<ManageInternships />} />
        <Route path="applications" element={<ManageApplications />} /><Route path="notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
