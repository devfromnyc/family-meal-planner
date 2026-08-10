# Grocery List — Design Spec

**Date:** 2026-08-11  
**Status:** Approved

## Goal

From a week’s planned meals, build a grocery list by aggregating ingredients. Preview live from the week, then save a snapshot for shopping with check-offs.

## Behavior

1. **Entry:** “Create grocery list” on Week (current viewed week). **Grocery** nav for saved lists.
2. **Preview:** Aggregate ingredients from all filled plan slots in `[start, end]`.
3. **Merge:** Same normalized name + same unit + parseable numeric quantities → sum into one line. Otherwise keep **separate lines**, each showing source meal title(s).
4. **No unit conversion** when units differ (user does the math).
5. **Save:** New `grocery_lists` row + items snapshot. Opening a list allows check/uncheck.
6. Regenerating from the week always creates a **new** saved list.

## Data

- `grocery_lists`: userId, startDate, endDate, title, timestamps
- `grocery_list_items`: listId, name, quantityDisplay, unit, mealTitles (json), checked, sortOrder
