# CSV test templates

Three files, numbered in the order you should import them (each depends on the one before it):

## 1. `1-raw-materials-template.csv`
Go to **Raw Materials → Import CSV**.
- `vendor` doesn't need to exist yet — if the name doesn't match an existing vendor, one gets
  created automatically (you can fill in its real contact details afterward from the Vendors page).
- `isPerishable` must be exactly `true` or `false`.
- `category`, `leadTimeDays` are optional — sensible defaults are used if left blank.

## 2. `2-products-template.csv`
Go to **Products → Import CSV** (or use the guided **Add Product** flow instead if you also want
to attach a recipe/BOM while creating each product — CSV import here only creates the product
itself, no ingredients).
- `status` must be `active`, `inactive`, or `discontinued` (defaults to `active` if blank).

## 3. `3-sales-history-template.csv`
Go to **Billing → Import Sales History**.
- `Product` must match a product name **exactly** (case-insensitive) — so do step 2 first.
- `Date` must be `YYYY-MM-DD`, and can't be in the future.
- `Unit Price` is optional — leave it blank to use the product's current price automatically.
- This is what feeds the demand forecast: a product needs at least 28 real calendar days of
  history (from its first sale to today) before its forecast switches from a generic estimate to
  one based on your own data — the example dates already span that range.

## Notes
- Every row in every file is just an example — replace the values with your real data before
  importing. The row shapes/column names must stay exactly as they are (that's what the app
  reads), but any header order works since each column is matched by name, not position.
- If a row fails during import, the app tells you exactly which row and why before you commit
  anything — nothing is saved until you click Import.
