# Core Lessons (Universal)

Lessons ที่ใช้ได้กับทุก project - curated จาก 55+ lessons

---

## 1. Git & Commits

### Conventional Commits
```
type(scope): message
```
Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`

### Git Rules
- **Never force push to main** - rewrites history, dangerous
- **Always pull --rebase before push** - keeps clean linear history
- **Use specific paths** - `git add file1 file2` not `git add -A`
- **No AI signatures** - keep commits clean

### Push Pattern
```bash
git add <files>
git commit -m "type(scope): message"
git pull --rebase origin main
git push origin main
```

---

## 2. Planning & Communication

### Ask vs Execute
| Type | Action |
|------|--------|
| **Execution** (obvious) | Just do it - create dirs, move files, run commands |
| **Strategy** (decisions) | Always ask - update config, change rules, modify workflow |

### Planning Rules
- **Plan before execute** - ask questions first, get requirements
- **Use Q&A tool** - AskUserQuestion for real-time questions, not issue comments
- **Ask "What should X show?"** - understand expected output before implementing
- **Don't think for user** - if uncertain, ask instead of assume

### Context Matters
- Rules have context - don't apply blindly
- One lesson doesn't override previous ones
- Think about which lesson applies to current situation

---

## 3. Quality & Process

### Priority Order
```
1. User's explicit instruction (highest)
2. Project config (claude.md)
3. System defaults (lowest)
```

### Quality Principles
- **Quality > Speed** - get it right, not fast
- **Practice what you preach** - follow your own rules
- **Human review required** - never trust AI output blindly
- **Honest feedback** - admit mistakes, don't make excuses

### Retrospective
- AI Diary is **mandatory**
- Honest self-reflection improves learning
- Two-way feedback (AI ↔ User)

---

## 4. Code Design

### Generic > Specific
- Design generic systems instead of hardcoding
- Ask: "Can this be more general?"
- Overcustomization reduces flexibility

### Simplicity > Helpers
- Don't create helpers when native tools suffice
- Abstraction adds complexity
- Keep code simple and direct

### Dynamic > Static
- Don't hardcode values that change
- Search/find is more robust than hardcoded IDs
- Future-proof by being dynamic

### Separate Concerns
- Config rarely changes, content grows
- Keep configuration separate from growing content
- Generic config = reusable

---

## 5. Testing

### Testability Killers
```go
// BAD - kills test process
log.Fatalf("error: %v", err)

// GOOD - testable
return fmt.Errorf("error: %w", err)
```

Check for: `log.Fatalf`, `log.Fatal`, `os.Exit` in functions you need to test

### Async Testing
```go
// BAD - fragile, slow
time.Sleep(2 * time.Second)

// GOOD - channel-based
done := make(chan bool, 1)
select {
case <-done:
    // success
case <-time.After(100 * time.Millisecond):
    t.Error("timeout")
}
```

### Test Naming
```
Test<Method>_<Scenario>
```
Examples: `TestCreate_Success`, `TestLogin_InvalidPassword`

### testDeps Pattern
```go
type testDeps struct {
    repo    *mocks.Repository
    service *mocks.Service
}

func newTestDeps() *testDeps {
    return &testDeps{...}
}
```

### Full Test Suite Before Commit (CRITICAL)
```bash
# ALWAYS run before commit
go test ./...

# NOT just the new package
go test ./pkg/<new-feature>/...  # WRONG - misses integration breaks
```

**Why:** Adding dependencies to existing modules breaks their tests.
Package-level tests pass, but consuming modules fail.

---

## 6. Data Handling

### Context-Aware Processing
| Data Type | Escape? | Truncate? |
|-----------|---------|-----------|
| User names | Yes | Optional |
| Service names | Yes | Optional |
| URLs | No | No |
| Emails | Maybe | No |

Think about each data type before applying blanket transformations.

### Persistence
Ask about storage **early** in planning:
- Does this data need to persist?
- Memory vs File vs Database?
- How much data? How often accessed?

---

## 7. Common Mistakes to Avoid

| Mistake | Prevention |
|---------|------------|
| Commit without permission | Wait for explicit "commit" |
| Push without pull --rebase | Use combined command |
| Skip workflow steps | Check before each action |
| Assume instead of ask | Use AskUserQuestion |
| Apply rules blindly | Consider context |
| Over-engineer | Keep it simple |

---

## Quick Reference

### Must Remember
1. `git pull --rebase` before push
2. Ask before strategy decisions
3. Priority: User > config > system
4. Practice what you preach
5. AI Diary is mandatory

### Red Flags
- `log.Fatalf()` in testable code
- Hardcoded IDs or values
- `git add -A` or `git push --force`
- Assuming instead of asking
- Skipping quality gates

---

**Version:** 1.0

**Source:** 55+ lessons (2025-12-07 → 2025-12-14)
