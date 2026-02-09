import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { routers } from "./router";
import { BottomNav } from "./components/BottomNav";

const queryClient = new QueryClient();

function Layout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="flex-1 overflow-y-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}

const routesWithLayout = [
  {
    element: <Layout />,
    children: routers,
  },
];

const App = () => {
  const router = createBrowserRouter(routesWithLayout);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
