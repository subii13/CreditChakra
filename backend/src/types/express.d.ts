import "express";

declare global {
  namespace Express {
    interface Request {
      // Populated by middleware/auth.ts after verifying the Supabase
      // access token server-side. Never trust a client-supplied user
      // id anywhere else in the codebase — always read it from here.
      user?: {
        id: string;
        email: string | null;
      };
      requestId: string;
    }
  }
}
