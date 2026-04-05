# UI Changes vs `main`

This document summarizes user-visible UI changes between the current branch and `main` for `app/` and `components/`.

It focuses on visible layout, interaction, navigation-flow, and error-state changes. Pure formatting updates and auth-only request wiring are called out separately when they do not materially change the UI.

## Executive Summary

- The app shell now consistently uses `react-native-safe-area-context` at the root and on affected screens, reducing safe-area layout risk across the app.
- Registration now nudges users toward better-formatted names by auto-capitalizing words and surfacing a new visible validation rule for capitalized names.
- The home screen has a more resilient AI-advice experience with user-facing error messaging, retry affordances, and goal-based macro presentation.
- The meal details flow gained a share action and updated modal chrome styling.
- The food-detection results screen was substantially redesigned, with new quantity-editing interactions, inline error banners, removal flow, and a cleaner save/edit action layout.
- A reusable `ShareButton` UI component was added for meal sharing.

## App UI Changes

### `app/_layout.tsx`

- Added `SafeAreaProvider` at the app root.
- This is a structural UI change rather than a visible redesign, but it affects how safe-area-aware screens render across devices with notches and inset areas.
- No direct routing UI text changed.

### `app/(auth)/register.tsx`

- The full-name field handler was renamed internally, but the visible UI changes are:
- The full-name input now uses `autoCapitalize="words"` instead of `autoCapitalize="none"`.
- A new validation message was added: each name part must begin with a capital letter.
- Resulting UI effect:
- Users now see immediate form rejection if they enter non-capitalized names.
- The keyboard/input behavior better matches a full-name field.

### `app/(tabs)/home.tsx`

- `SafeAreaView` now comes from `react-native-safe-area-context`.
- The AI advice flow gained a visible error state:
- Red error card
- Error message text
- Retry button
- The screen now clears prior AI errors before retrying.
- AI advice parsing failures now produce a user-visible message instead of silently failing or only logging.
- Network failures now also render a visible error message.
- Nutrition targets are now goal-based:
- weight-loss goals bias protein/fat/carbs differently than gain/muscle goals
- the dashboard can therefore render different macro targets for different users
- Pull-to-refresh now waits on meal refresh and uses a shorter delay, which should feel more responsive.

### `app/(tabs)/profile.tsx`

- `SafeAreaView` moved from the core `react-native` import to `react-native-safe-area-context`.
- There is no other visible redesign in this file.
- Effectively this is a layout/safe-area correctness update.

### `app/(tabs)/statistics.tsx`

- `SafeAreaView` also moved to `react-native-safe-area-context`.
- No material chart, layout, or interaction redesign was introduced in the visible UI from this diff alone.
- The rest of the file changes are mostly request wiring and formatting.

### App Files With No Material UI Change

These files changed against `main`, but the current diff does not introduce meaningful visible UI changes:

- `app/(tabs)/_layout.tsx`
- `app/(tabs)/camera.tsx`
- `app/(tabs)/history.tsx`
- `app/context/authprovider.tsx`

## Components UI Changes

### `components/Ai-Advice/RecommendationsList.tsx`

- The recommendations list now renders all recommendation items instead of truncating to the first two.
- Visible result:
- the card/list can be longer
- users see the full recommendation set rather than a preview subset

### `components/Main/MealDetailModal.tsx`

- A share action was added to the meal detail modal through a new `ShareButton`.
- The share control is positioned as an overlay button near the top-left area of the modal content.
- The close button styling changed:
- icon size reduced from `24` to `20`
- icon color changed from black to white
- close button background became darker and more pronounced
- A darker translucent button background and added border radius/padding make modal controls look more intentional and visually distinct over the image/content.
- The modal now exposes meal sharing as a first-class action.

### `components/camera/FoodDetectionResults.tsx`

- This is the largest UI rewrite in the diff.
- Detection input model changed from aggregated detection maps to `analyzedItems`, which supports richer rendering per detected item.
- Food item cards now show:
- item label
- confidence percentage
- quantity controls
- removable item action
- Quantity editing flow was redesigned:
- inline tap-to-edit quantity
- plus/minus controls
- quantity validation by unit type
- clearer error messaging for invalid quantity input
- Item removal behavior changed:
- active items are removed from a tracked list
- if all items are removed, navigation returns to `/(tabs)/home`
- Macro summary cards were restructured:
- cleaner shared card configuration
- edit vs read mode presentation is more explicit
- inline edit focus state and shake animation logic were simplified around current fields
- Error presentation improved:
- nutrition validation errors render as visible banners
- food-quantity errors render as visible banners
- generic `alert()` usage was replaced with `Alert.alert(...)`
- Bottom action area was reorganized:
- primary edit/save-nutrition action
- separate save action only when not in edit mode
- Save flow now returns to `/(tabs)/home` after success.
- Overall visible effect:
- the screen is more interactive, more guided, and better surfaced for correction flows
- save/edit actions are clearer
- validation feedback is more visible and structured

### `components/profile/user-setting.tsx`

- The visible UI change here is small:
- icon color lookup is now guarded through `lucideIconColor(...)`
- This reduces the risk of rendering an undefined icon color in the settings menu.
- Most of the rest of the file change is typing/formatting cleanup.

### `components/ui/ShareButton.tsx`

- New reusable UI component added.
- Provides:
- share icon button
- loading spinner while sharing
- optional image sharing
- generated meal-summary message text
- This is the main new reusable UI primitive introduced by the diff.
- It supports both local images and downloaded remote images before invoking native share.

## Components With UI-Adjacent But Not Materially Visual Changes

These files changed, but the branch diff mostly affects auth wiring, typing, or non-visible behavior rather than the rendered UI:

- `components/Ai-Advice/SaveRecipeButton.tsx`
- `components/Main/recently-eaten.tsx`
- `components/ParallaxScrollView.tsx`
- `components/history/recently-eaten.tsx`
- `components/profile/change-password.tsx`
- `components/profile/edit-basic-info.tsx`
- `components/profile/edit-personal-info.tsx`
- `components/profile/user-profile.tsx`
- `components/ui/IconSymbol.tsx`

## Appendix: UI-Only Raw Diff Notes

### App

- `app/_layout.tsx`
- added `SafeAreaProvider` wrapper around the app tree
- `app/(auth)/register.tsx`
- full-name input changed to `autoCapitalize="words"`
- added capitalized-name validation error
- `app/(tabs)/home.tsx`
- imported `View`, `Text`, `TouchableOpacity`
- moved screen safe area to `react-native-safe-area-context`
- added `aiError` state
- added visible red error card with retry button
- changed nutrition target ratios to depend on `user.goal`
- refresh flow now awaits `fetchMeals()`
- `app/(tabs)/profile.tsx`
- moved `SafeAreaView` import to `react-native-safe-area-context`
- `app/(tabs)/statistics.tsx`
- moved `SafeAreaView` import to `react-native-safe-area-context`

### Components

- `components/Ai-Advice/RecommendationsList.tsx`
- changed `recommendations.slice(0, 2)` to `recommendations`
- `components/Main/MealDetailModal.tsx`
- added `ShareButton`
- updated close icon size/color
- darkened top-left action styling
- `components/camera/FoodDetectionResults.tsx`
- moved to `memo(...)`
- changed props to `analyzedItems`
- added confidence text in food item cards
- redesigned quantity editing and removal flow
- added structured error banners
- reorganized action buttons
- changed successful save navigation to `router.replace("/(tabs)/home")`
- `components/profile/user-setting.tsx`
- added `lucideIconColor(...)` helper for safer icon color rendering
- `components/ui/ShareButton.tsx`
- new file
- share icon button with loading state
- optional image download/share flow
- meal-summary text generation for share sheet

## Notes

- Several files under `app/` and `components/` were changed only to switch request calls from `fetch(...)` to `authFetch(...)`. Those are important behavior changes, but they are not listed as primary UI changes unless they also changed visible error handling or interaction flow.
- A few files also contain formatting-only changes such as commas, indentation, and type refinements. Those were intentionally excluded from the main UI summary.

