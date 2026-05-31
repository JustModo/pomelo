import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout";
import DashboardPage from "@/pages/dashboard";
import SetupPage from "@/pages/setup";
import ContainersPage from "@/pages/containers";
import EnvironmentPage from "@/pages/environment";
import LogsPage from "@/pages/logs";
import StoragePage from "@/pages/storage";
import UsersPage from "@/pages/users";
import SettingsPage from "@/pages/settings";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="setup" element={<SetupPage />} />
          <Route path="containers" element={<ContainersPage />} />
          <Route path="environment" element={<EnvironmentPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="storage" element={<StoragePage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
