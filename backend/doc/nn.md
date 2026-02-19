# Backend Status Notes

Date: 2026-02-14

## Deferred Issue
- Product listing endpoint `GET /api/v1/products` returns an empty list unless `isActive=true` is explicitly provided. Example:
  - `GET /api/v1/products` -> empty list
  - `GET /api/v1/products?isActive=true` -> returns products

## Next Steps
- Investigate why `QueryProductsSchema` + controller default handling does not preserve `isActive=true` when omitted.
- Ensure the default behavior matches expected product listing (active products).

