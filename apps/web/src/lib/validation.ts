/**
 * Reusable Zod validation schemas for API route input validation.
 *
 * Usage in a Route Handler:
 *   import { validateBody } from "@/lib/validation";
 *   import { z } from "zod";
 *
 *   const CreateItemSchema = z.object({
 *     name: z.string().min(1).max(255),
 *     email: emailSchema,
 *   });
 *
 *   export async function POST(request: Request) {
 *     const result = await validateBody(request, CreateItemSchema);
 *     if (!result.success) {
 *       return NextResponse.json({ error: result.error }, { status: 400 });
 *     }
 *     const { name, email } = result.data;
 *     // ... handle request
 *   }
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Reusable field schemas
// ---------------------------------------------------------------------------

/** Email address — trimmed, lowercased, max 255 chars. */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255)
  .transform((v) => v.trim().toLowerCase());

/** Password — minimum 8 characters. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

/** Pagination parameters — page (1-based) and pageSize (1-100, default 20). */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** CUID identifier — matches Prisma's default ID format. */
export const cuidSchema = z.string().cuid();

/** Stripe Price ID — must start with price_. */
export const stripePriceIdSchema = z
  .string()
  .startsWith("price_", "Invalid Stripe Price ID");

// ---------------------------------------------------------------------------
// Request body validation helper
// ---------------------------------------------------------------------------

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; error: string };

/**
 * Parse and validate a JSON request body against a Zod schema.
 *
 * Returns `{ success: true, data }` on valid input, or
 * `{ success: false, error }` with a human-readable error string.
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ValidationSuccess<T> | ValidationFailure> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { success: false, error: "Invalid JSON body" };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    return { success: false, error: messages };
  }

  return { success: true, data: result.data };
}

// ---------------------------------------------------------------------------
// Search params validation helper
// ---------------------------------------------------------------------------

/**
 * Parse and validate URL search params against a Zod schema.
 *
 * Usage:
 *   const params = validateSearchParams(request.nextUrl.searchParams, paginationSchema);
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodType<T>,
): ValidationSuccess<T> | ValidationFailure {
  const raw = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    return { success: false, error: messages };
  }
  return { success: true, data: result.data };
}
