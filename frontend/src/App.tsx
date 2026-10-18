import { AppShell } from '@/components/layout/AppShell'
import { AircraftProfilePage } from '@/pages/AircraftProfilePage'
import { AlertsPage } from '@/pages/AlertsPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DemoPage } from '@/pages/DemoPage'
import { FleetPage } from '@/pages/FleetPage'
import { HealthPage } from '@/pages/HealthPage'
import { InsightsPage } from '@/pages/InsightsPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { LoginPage } from '@/pages/LoginPage'
import { PredictivePage } from '@/pages/PredictivePage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TimelinePage } from '@/pages/TimelinePage'
import { TwinPage } from '@/pages/TwinPage'
import { WorkOrdersPage } from '@/pages/WorkOrdersPage'
import { useApp } from '@/store/AppStore'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

function Guard({ children }: { children: ReactNode }) {
  const { session } = useApp()
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <Guard>
            <AppShell />
          </Guard>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/fleet/:id" element={<AircraftProfilePage />} />
        <Route path="/twin" element={<TwinPage />} />
        <Route path="/predictive" element={<PredictivePage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/work-orders" element={<WorkOrdersPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/demo" element={<DemoPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
