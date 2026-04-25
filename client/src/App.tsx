import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from './pages/Landing';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Strategies from './pages/Strategies';
import StrategyBuilder from './pages/StrategyBuilder';
import Backtest from './pages/Backtest';
import Trades from './pages/Trades';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import AuthenticatedLayout from './components/AuthenticatedLayout';

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path={"/"} component={Landing} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/forgot-password"} component={ForgotPassword} />

      {/* Authenticated Routes */}
      <Route path="/dashboard">
        {() => (
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/estrategias">
        {() => (
          <AuthenticatedLayout>
            <Strategies />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/estrategias/builder">
        {() => <StrategyBuilder />}
      </Route>
      <Route path="/backtest">
        {() => (
          <AuthenticatedLayout>
            <Backtest />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/trades">
        {() => (
          <AuthenticatedLayout>
            <Trades />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/billing">
        {() => (
          <AuthenticatedLayout>
            <Billing />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <AuthenticatedLayout>
            <Settings />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/settings/:tab">
        {() => (
          <AuthenticatedLayout>
            <Settings />
          </AuthenticatedLayout>
        )}
      </Route>

      {/* Fallback */}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
