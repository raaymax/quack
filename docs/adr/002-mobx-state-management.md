# ADR 002: MobX for State Management

## Status

Accepted

## Context

The React frontend needs reactive state management for a chat application with real-time updates. The state is complex: channels, messages, users, threads, read receipts, search results, and input drafts all need to stay synchronized. Options considered included Redux, Zustand, MobX, and React Context + useReducer.

## Decision

Use **MobX** with `makeAutoObservable` for all frontend state management, organized as a tree of model classes rooted at `AppModel`.

The state tree:
- `AppModel` — Root model aggregating all sub-models.
- Domain models (`ChannelsModel`, `MessagesModel`, `UsersModel`, etc.) — Each manages a specific domain.
- Entity models (`ChannelModel`, `MessageModel`, `UserModel`) — Individual entity state.

Components are wrapped with `observer()` from `mobx-react-lite` for fine-grained reactive re-rendering.

## Consequences

- **Positive:** Minimal boilerplate — `makeAutoObservable(this)` makes all properties observable and all methods actions automatically.
- **Positive:** Fine-grained reactivity — Only components observing changed properties re-render, which is important for chat performance with many messages.
- **Positive:** Class-based models map naturally to domain entities, enabling encapsulation of business logic within models.
- **Positive:** No action dispatch ceremony — mutate state directly in model methods.
- **Negative:** `observer()` wrapper required on every component that reads observable state.
- **Negative:** Debugging is less transparent than Redux (no action log by default).
- **Negative:** Team members need to understand MobX reactivity rules (what is tracked, when).
