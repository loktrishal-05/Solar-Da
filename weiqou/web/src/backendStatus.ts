// Shown when the Python agent runtime cannot be reached.
// Typical cause: the UI is a static preview (for example on Vercel) with no backend behind it.
export const BACKEND_OFFLINE_MESSAGE =
  'Backend not connected. This page is the front end only. ' +
  'Run the full stack with Docker (see the README) or open the hosted demo that includes the backend.';
