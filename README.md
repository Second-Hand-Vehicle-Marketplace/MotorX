# MotorX

MotorX is a second-hand vehicle marketplace with an API backend, a background worker, and shared TypeScript contracts.

## Repository Layout

```text
MotorX/
├── apps/
│   ├── frontend/
│   ├── backend/
│   └── worker/
├── packages/
│   └── shared-contracts/
├── infrastructure/
│   ├── docker/
│   └── nginx/
├── docs/
├── .github/workflows/
├── docker-compose.yml
├── .env.example
├── package.json
├── README.md
├── sprints.md
└── team-work-plan.md
```

## Current Focus

- `apps/backend`: Express API with modular domain folders.
- `apps/worker`: ETL worker and inventory upload pipeline.
- `packages/shared-contracts`: shared DTOs, interfaces, and enums.

## Notes

The repository keeps the README and work-plan documents at the root while the old monolithic scaffold is replaced by the workspace layout above.
