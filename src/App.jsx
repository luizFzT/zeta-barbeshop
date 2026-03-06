import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/hooks/useAuth';
import { BarbershopProvider } from './shared/hooks/useBarbershop';
import { ThemeProvider } from './shared/hooks/useTheme';
import ProtectedRoute from './core/guards/ProtectedRoute';
import AuthLayout from './core/layouts/AuthLayout';
import ShellLayout from './core/layouts/ShellLayout';
import LandingPage from './LandingPage';
import LoginPage from './auth/LoginPage';
import RegisterPage from './auth/RegisterPage';
import DashboardPage from './dashboard/DashboardPage';
import ClientQueuePage from './client/ClientQueuePage';

export default function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <AuthProvider>
                    <BarbershopProvider>
                        <Routes>
                            {/* Public - Default to login instead of broken mobile landing page for testing */}
                            <Route path="/" element={<Navigate to="/auth/login" replace />} />

                            {/* PWA entry — skips landing page when opened from home screen */}
                            <Route path="/app" element={<Navigate to="/auth/login" replace />} />

                            {/* Client Queue (public — Google login inside) */}
                            <Route path="/queue/:slug" element={<ClientQueuePage />} />

                            {/* Legacy storefront redirect */}
                            <Route path="/view/:slug" element={<ClientQueuePage />} />

                            {/* Auth */}
                            <Route path="/auth" element={<AuthLayout />}>
                                <Route path="login" element={<LoginPage />} />
                                <Route path="register" element={<RegisterPage />} />
                            </Route>

                            {/* Protected — Barber Dashboard */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <ShellLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<DashboardPage />} />
                            </Route>

                            {/* 404 */}
                            <Route path="*" element={
                                <div style={{
                                    minHeight: '100vh',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '1rem',
                                    textAlign: 'center',
                                    padding: '2rem',
                                }}>
                                    <span style={{ fontSize: '4rem' }}>😕</span>
                                    <h1 style={{ fontSize: '2rem' }}>Página não encontrada</h1>
                                    <a href="/" className="btn btn-primary">Voltar ao Início</a>
                                </div>
                            } />
                        </Routes>
                    </BarbershopProvider>
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}
