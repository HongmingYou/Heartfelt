import HomePage from "./pages/HomePage";
import SetupPage from "./pages/SetupPage";
import NewRecordPage from "./pages/NewRecordPage";
import EditRecordPage from "./pages/EditRecordPage";
import TimelinePage from "./pages/TimelinePage";
import StarsPage from "./pages/StarsPage";
import CapsulePage from "./pages/CapsulePage";
import LetterPage from "./pages/LetterPage";
import SettingsPage from "./pages/SettingsPage";
import ForYouPage from "./pages/ForYouPage";
import NotFound from "./pages/NotFound";

export const routers = [
    {
      path: "/",
      name: 'home',
      element: <HomePage />,
    },
    {
      path: "/setup",
      name: 'setup',
      element: <SetupPage />,
    },
    {
      path: "/new",
      name: 'new',
      element: <NewRecordPage />,
    },
    {
      path: "/edit/:id",
      name: 'edit',
      element: <EditRecordPage />,
    },
    {
      path: "/timeline",
      name: 'timeline',
      element: <TimelinePage />,
    },
    {
      path: "/stars",
      name: 'stars',
      element: <StarsPage />,
    },
    {
      path: "/capsule",
      name: 'capsule',
      element: <CapsulePage />,
    },
    {
      path: "/letter",
      name: 'letter',
      element: <LetterPage />,
    },
    {
      path: "/settings",
      name: 'settings',
      element: <SettingsPage />,
    },
    {
      path: "/for-you",
      name: 'for-you',
      element: <ForYouPage />,
    },
    /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
    {
      path: "*",
      name: '404',
      element: <NotFound />,
    },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;
