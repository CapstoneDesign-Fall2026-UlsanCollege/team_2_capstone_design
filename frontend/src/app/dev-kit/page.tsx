import { notFound } from "next/navigation";
import { DevKitClient } from "./DevKitClient";

/**
 * Development-only component gallery. Returns 404 in production/test builds.
 * TEMPORARY: delete this folder in Step 5.
 */
export default function DevKitPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DevKitClient />;
}
