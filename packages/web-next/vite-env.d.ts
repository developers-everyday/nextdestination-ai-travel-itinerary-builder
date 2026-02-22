// Type shim so Next.js TypeScript can compile @nextdestination/shared files
// that use Vite's import.meta.env. The values will be undefined at runtime in
// Next.js (shared services fall back to process.env or localhost defaults).
interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
