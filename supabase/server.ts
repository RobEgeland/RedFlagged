import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, return a mock client that won't cause errors
  if (!supabaseUrl || !supabaseAnonKey) {
    // Create a chainable mock query builder
    const createMockQueryBuilder = () => {
      const builder = {
        eq: (column: string, value: any) => builder,
        neq: (column: string, value: any) => builder,
        gt: (column: string, value: any) => builder,
        lt: (column: string, value: any) => builder,
        gte: (column: string, value: any) => builder,
        lte: (column: string, value: any) => builder,
        like: (column: string, pattern: string) => builder,
        ilike: (column: string, pattern: string) => builder,
        is: (column: string, value: any) => builder,
        in: (column: string, values: any[]) => builder,
        contains: (column: string, value: any) => builder,
        single: async () => ({ data: null, error: { message: "Supabase not configured" } }),
        maybeSingle: async () => ({ data: null, error: { message: "Supabase not configured" } }),
        limit: (count: number) => builder,
        order: (column: string, options?: { ascending?: boolean }) => builder,
      };
      return builder;
    };

    // Return a mock client that throws helpful errors when used
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ error: { message: "Supabase not configured" } }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ error: { message: "Supabase not configured" } }),
        updateUser: async () => ({ error: { message: "Supabase not configured" } }),
      },
      from: (table: string) => ({
        select: (columns?: string) => createMockQueryBuilder(),
        insert: (values: any) => ({
          select: (columns?: string) => createMockQueryBuilder(),
        }),
        update: (values: any) => ({
          eq: (column: string, value: any) => createMockQueryBuilder(),
        }),
        delete: () => ({
          eq: (column: string, value: any) => createMockQueryBuilder(),
        }),
      }),
      functions: {
        invoke: async () => ({ data: null, error: { message: "Supabase not configured" } }),
      },
    } as any;
  }

  const cookieStore = cookies();

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll().map(({ name, value }) => ({
              name,
              value,
            }));
          } catch (error) {
            // If cookies() is called in an environment where it's not allowed
            console.error("Error accessing cookies:", error);
            return [];
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // If cookies() is called in an environment where it's not allowed
            console.error("Error setting cookies:", error);
          }
        },
      },
    }
  );
};
