import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import VaultPage from "./pages/VaultPage";
import TemplatePage from "./pages/TemplatePage";
import QuickPreviewPage from "./pages/QuickPreviewPage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={VaultPage} />
      <Route path={"/template/:id"} component={TemplatePage} />
      <Route path={"/preview"} component={QuickPreviewPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
