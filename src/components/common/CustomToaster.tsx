"use client";

import { Toaster } from 'sonner';

export default function CustomToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          success: 'sonner-success',
          info: 'sonner-info',
          error: 'sonner-error',
        },
      }}
    />
  );
}
