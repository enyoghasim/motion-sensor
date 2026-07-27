# Motion Sensor App — Agent Guide

Expo (React Native) app for the motion sensor IoT product. Expo Router (file-based routing) + TanStack Query + Zustand + NativeWind (Tailwind for RN) + Zod + react-hook-form.

# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Project structure

```
src/
  app/                      Expo Router routes ONLY. File path = URL path. No business logic here.
    (auth)/                 Route group: unauthenticated screens (login, register, forgot-password)
    (app)/                  Route group: authenticated screens, gated by AppLayout (redirects to /(auth)/login if no user)
      (tabs)/               Route group: bottom-tab screens (index/Space, devices, me)
      spaces/, devices/     Nested stacks for detail/CRUD flows (e.g. spaces/[id]/devices/add.tsx)
    _layout.tsx             Root layout: fonts, QueryClientProvider, GestureHandlerRootView, splash screen
  modules/                  All business/domain logic. Screens in app/ import FROM here — never the reverse.
    <domain>/               e.g. auth, devices, spaces, shared
      components/           Domain-specific UI components (not routes)
      services/              API layer, split by concern (see below)
      store/                 Zustand stores, e.g. selected-space.store.ts
      validations/           Zod schemas + inferred types for forms
      lib/                   Domain-specific helpers
      types.ts               Flat file for the domain's shared TS types (NOT a types/ folder, except shared/)
  components/               App-wide, non-domain UI (e.g. animated-icon, orbiting-logo). Rare — prefer modules/shared.
  global.css                Tailwind entrypoint
```

`modules/shared/` is the one exception with extra structure (`lib/api.ts`, `lib/util.ts`, `lib/env.ts`, `services/query-client.ts`, `services/query-keys.ts`, `types/api.ts`) since it's imported by every other module.

A new domain (e.g. `firmware`) gets its own `modules/firmware/` following the same shape — don't bolt firmware logic onto an unrelated module just because a screen happens to live near it in `app/`.

# Naming conventions — follow strictly

- **Files & folders:** kebab-case, always. `device-card.tsx`, `auth-storage.ts`, `email-verification-overlay.tsx`. Never PascalCase or camelCase filenames.
- **Components:** PascalCase export, named export (not default), kebab-case filename matching it — `export const Button = ...` in `button.tsx`. Route files under `app/` are the only default exports (Expo Router requires it).
- **Service files per domain**, split by responsibility — do not merge these:
  - `<domain>.endpoints.ts` — a single `const X_ENDPOINTS = { ... } as const` object. Path builders for dynamic segments are functions: `update: (id) => \`/api/spaces/${id}\``.
  - `<domain>.query.ts` — `useXQuery` / `useXxxQuery` hooks (TanStack `useQuery`).
  - `<domain>.mutation.ts` — `useXMutation` hooks (TanStack `useMutation`), wrapped in `buildMutationOptions(...)` from `shared/services/query-client` when the mutation should invalidate a query key on success.
  - Hook naming: always prefixed `use`, always suffixed `Query` or `Mutation` — `useSpacesQuery`, `useCreateSpaceMutation`, `useGetSpaceDevices` (list-with-args pattern is the one accepted exception).
- **Query keys:** never hand-roll a query key. Register every domain once in `shared/services/query-keys.ts` via `queryKeysFactory('domain')`, then use `.all` / `.list(query)` / `.detail(id)` from it.
- **Zod validation files:** one file per domain at `modules/<domain>/validations/<domain>.ts`. Every schema `xSchema` exports a matching inferred type `export type XValues = z.infer<typeof xSchema>` directly beneath it.
- **Types:** domain types live in `modules/<domain>/types.ts` as plain exported `type` aliases matching the backend response shape (snake_case fields like `created_at`, `email_verified` — do NOT camelCase fields that come from the API).
- **Variants/sizes on components:** define as string union types (`type ButtonVariant = "light" | "outline-light" | ...`) plus `Record<Variant, string>` style maps for the Tailwind classes — see `button.tsx`. Don't inline ternary chains for variant styling.

# Imports — follow strictly

- Inside `src/modules/**`: use **relative imports** (`../../shared/lib/api`), not the `@/` alias. This is the established pattern across every existing module — stay consistent with it.
- Inside `src/app/**` (route files) and `src/components/**`: use the **`@/` alias** (`@/modules/shared/lib/util`), which maps to `src/*` per `tsconfig.json`.
- Never introduce a new alias or deviate from whichever pattern the surrounding directory already uses.

# API layer conventions

- All backend responses are wrapped in `ApiResponse<T>` (`shared/types/api.ts`): `{ success, message, data?, errors? }`. Never read `response.data` directly off axios without going through `validateApiResponse<T>()` (mutations) or `data.data ?? <fallback>` (queries) — see `shared/lib/util.ts`.
- Mutation error handling is always `try { ... } catch (error) { throw handleApiError(error) }` inside `mutationFn` — this normalizes axios errors into `ApiError` with a `.errors: string | string[]`. Don't let raw `AxiosError` reach a component.
- Paginated list endpoints return `{ items, next_cursor }` (cursor pagination, not page numbers) — see `DevicePaginatedResponse`/`MotionPaginatedResponse` on the backend. Follow this shape for any new paginated endpoint rather than inventing offset/limit paging.
- The auth token lives in `expo-secure-store` via `auth-storage.ts`, attached by the `api.ts` request interceptor. Never read/write the token anywhere else.

# Fonts

All text must use the Google Sans font family via the `font-google-sans-*` classes defined in `tailwind.config.js` (e.g. `font-google-sans`, `font-google-sans-medium`, `font-google-sans-bold`). Do not use plain Tailwind font-weight utilities like `font-bold` or `font-medium` on their own — React Native does not synthesize weights for custom TTF fonts, so those will silently fall back to the system font instead of Google Sans.

# Testing

Do not write Chromium/Playwright/browser-automation tests for this app — they are not worth the token cost here. If asked to verify a change, run/build the app (Expo) and check behavior directly rather than writing browser-based e2e tests.

# Commit & push

Once a change is done and you've actually verified it works — run/build the app and check the behavior, not just read the diff — commit and push it. Scope the commit to `motion-sensor-app/` only; don't sweep in unrelated changes from `motion-sensor-be/` or `motion-sensor-firmware/`.

---

thank you and be a good companion, i love you.
