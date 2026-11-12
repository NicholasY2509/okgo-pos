# ADR-0013: Marketing Maintenance Mode Toggle via Dedicated MarketingSetting Model

- **Status:** Accepted
- **Date:** 2026-11-12
- **Deciders:** User & Antigravity

## Context

The public marketing landing page was previously replaced with a static maintenance notice during updates. To allow operational flexibility, the system requires dynamic toggling of maintenance mode from the admin portal, enabling administrators to activate or deactivate the maintenance screen on demand without deploying code.

The application adheres to Domain-Driven Design (DDD) with a strict 5-layer separation (`Schema ➡️ Repository ➡️ Service ➡️ Action ➡️ Hook ➡️ Component`) and isolates domain concepts within `modules/`.

## Decision

We introduce a dedicated `MarketingSetting` model in `prisma/schema/marketing.prisma` and implement the 5-layer architecture under `modules/marketing/` (`marketing-setting.ts`, `marketing-setting-repository.ts`, `marketing-setting-service.ts`, `marketing-setting-action.ts`, `use-marketing-setting.ts`, and `marketing-maintenance-toggle.tsx`).

The maintenance toggle is placed in the admin interface under `/admin/brand-settings`. The public marketing route (`app/(marketing)/page.tsx`) queries `MarketingSettingService.get()`: when maintenance mode is active, it displays the maintenance notice; otherwise, it renders the marketing landing page.

## Consequences

### Easier

- Zero deployments required to switch the public marketing landing page between live and maintenance modes.
- Isolates marketing configuration from unrelated branch/brand operational settings.
- Follows the established 5-layer form and mutation architecture uniformly.

### Harder

- Requires managing an additional database table (`MarketingSetting`) and corresponding repository/service layers.
- Adds a database read on rendering the public marketing page (mitigated by fast indexed lookup of the single settings row).

## Alternatives considered

### Extend BrandSetting model with isMarketingMaintenance

Placing the toggle inside `BrandSetting` (`prisma/schema/main.prisma`) would merge landing page state with branch operational business hours (`businessStartTime`, `businessEndTime`), polluting brand-level business hours with marketing-specific concerns.

### Static environment variable

Using an environment variable like `NEXT_PUBLIC_MAINTENANCE_MODE` would require server restarts or redeployments, defeating the requirement for dynamic admin toggleability.
