User wants to work with notes. Use the note-writer agent.

Input: $ARGUMENTS

If input is a note ID (e.g. "001", "002"):
→ Read the note file from `.cortex/notes/` that starts with that ID (e.g. `001-*.md`)
→ Analyze the note content, find gaps and ambiguities
→ Ask clarifying questions
→ Write the clarified version back to the same file, preserving the original in a <details> block

If input is empty:
→ List existing notes and let user pick one to clarify

If input is raw text (not a number):
→ Create a new note with that text, then analyze and clarify it
