'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-neutral-900">
          <div className="w-full max-w-md space-y-4 text-center">
            <h2 className="text-2xl font-bold">Something went wrong!</h2>
            <p className="text-neutral-600">
              A critical error occurred. Our team has been notified.
            </p>
            <button
              onClick={() => reset()}
              className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
