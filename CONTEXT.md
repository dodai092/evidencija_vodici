# Evidencija glossary

### Other (language)

Language bucket for every tour language that is not English or Spanish, French included. Filter label "Oth", data key `oth`.

_Avoid_: FRA, "foreign", folding unknown languages into English

**Why:** Non-English/Spanish languages were silently counted as ENG, inflating it. French no longer gets its own bucket.

### Private tour

Paid tour of type `war PR`, `food PR`, `best`, `old` or `big`. `best` is private only.

_Avoid_: counting `best` as shared

### Shared tour

Paid tour of type `war` or `food`. `war PR` and `food PR` are private, not shared.
