import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { useAISStream } from "./hooks/useAISStream.ts";

const queryClient = new QueryClient();

// ✅ Hook is now INSIDE the component body
const AppInner = () => {
  const { ships, connected, error, usingDemoData } = useAISStream(
    "faaac984568dae11955e17064ed70703"
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Index
              ships={ships}
              connected={connected}
              error={error}
              usingDemoData={usingDemoData}
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppInner />
  </QueryClientProvider>
);

export default App;
