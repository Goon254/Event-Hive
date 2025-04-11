# Event Creation Form Refactoring

This directory contains the refactored implementation of the event creation form, originally located in `app/screens/Create.tsx`.

## Refactoring Approach

The original monolithic component (3700+ lines) has been broken down into smaller, more maintainable components following these principles:

1. **Separation of Concerns**: UI components, state management, and business logic are separated.
2. **Component Composition**: The UI is composed of smaller, reusable components.
3. **Custom Hooks**: Form state and submission logic are extracted into custom hooks.
4. **Consistent Styling**: Styles are organized into separate files by category.
5. **Type Safety**: TypeScript interfaces are used throughout for better type checking.

## Directory Structure

```
app/screens/create/
├── index.tsx                    # Main container component
├── types.ts                     # Shared interfaces and types
├── constants.ts                 # Constant values and defaults
├── README.md                    # Documentation (this file)
├── hooks/
│   ├── useEventForm.ts          # Form state and validation logic
│   └── useEventSubmission.ts    # Event submission logic
├── components/
│   ├── EventFormHeader.tsx      # Header with back button and preview
│   ├── EventFormProgress.tsx    # Progress indicator
│   ├── sections/
│   │   ├── BasicInfoSection.tsx # Section 1: Basic event details
│   │   └── ...                  # Other sections (to be implemented)
│   └── shared/
│       ├── FormField.tsx        # Reusable form field component
│       ├── TagInput.tsx         # Tag input component
│       └── SectionNavigation.tsx # Next/back buttons
└── styles/
    ├── index.ts                 # Main styles export
    ├── containerStyles.ts       # Container and layout styles
    ├── formStyles.ts            # Form element styles
    ├── navigationStyles.ts      # Navigation button styles
    ├── modalStyles.ts           # Modal styles
    └── previewStyles.ts         # Preview styles
```

## Component Hierarchy

```
CreateEventScreen (index.tsx)
├── EventFormHeader
├── EventFormProgress
└── Form Sections (conditionally rendered based on activeSection)
    ├── BasicInfoSection
    ├── DateTimeSection (TODO)
    ├── LocationSection (TODO)
    ├── TicketsSection (TODO)
    ├── SpeakersSection (TODO)
    └── SettingsSection (TODO)
```

## State Management

The form state is managed using custom hooks:

- `useEventForm`: Manages form data, validation, and navigation between sections
- `useEventSubmission`: Handles form submission, image uploads, and navigation after submission

## Data Flow

1. User input is captured in section components
2. Section components call `updateFormData` to update the form state
3. Form validation is triggered automatically when form data changes
4. Navigation between sections is controlled by the `navigateSection` function
5. Form submission is handled by the `handleSubmit` function

## Styling

Styles are organized into separate files by category:

- `containerStyles`: Container and layout styles
- `formStyles`: Form element styles
- `navigationStyles`: Navigation button styles
- `modalStyles`: Modal styles
- `previewStyles`: Preview styles

## Future Improvements

1. Implement remaining section components
2. Implement modal components
3. Add unit tests for components and hooks
4. Add form state persistence (save draft functionality)
5. Improve accessibility
6. Add animation for section transitions