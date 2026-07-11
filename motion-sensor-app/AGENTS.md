# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Fonts

All text must use the Google Sans font family via the `font-google-sans-*` classes defined in `tailwind.config.js` (e.g. `font-google-sans`, `font-google-sans-medium`, `font-google-sans-bold`). Do not use plain Tailwind font-weight utilities like `font-bold` or `font-medium` on their own — React Native does not synthesize weights for custom TTF fonts, so those will silently fall back to the system font instead of Google Sans.
