import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import Layout from '@/components/Layout';

import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import CreateEvent from '@/pages/CreateEvent';
import EventHub from '@/pages/EventHub';
import AvailabilityPicker from '@/pages/AvailabilityPicker';
import ActivitySwipe from '@/pages/ActivitySwipe';
import Results from '@/pages/Results';
import Sticker from '@/pages/Sticker';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/create" component={CreateEvent} />
        <Route path="/event/:shareCode" component={EventHub} />
        <Route path="/event/:shareCode/availabilities" component={AvailabilityPicker} />
        <Route path="/event/:shareCode/swipe" component={ActivitySwipe} />
        <Route path="/event/:shareCode/results" component={Results} />
        <Route path="/event/:shareCode/sticker" component={Sticker} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
