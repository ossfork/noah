## What & why

<!-- What does this change do, and why? Link any related issue. -->

## Testing

<!-- How did you verify it? -->

- [ ] `cargo test --workspace` passes
- [ ] `npx tsc --noEmit` passes (if the frontend changed)

## Checklist

- [ ] Conventional commit messages (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`)
- [ ] No backend / billing / account code — this is the bring-your-own-key build
- [ ] Destructive operations stay gated behind explicit user approval
