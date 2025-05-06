# Mini-Analytics

## Установка

```bash
pnpm install
```

## Билд (Сборка)

```bash
pnpm --filter tracker-client build
```

## Запуск сервера

```bash
pnpm --filter backend dev
```

- `http://localhost:50000/1.html` – тестовые страницы

- `http://localhost:8888/tracker` – трекер

- `http://localhost:8888/track` – приём событий

## P.S

### Что было сложным

- Тайминг буфера – аккуратно совместить правила «не чаще раза в секунду» и «если ≥ 3 событий».

- **Graceful shutdown** – beforeunload не гарантирует, что обычный fetch завершится, поэтому пришлось добавить `sendBeacon` и `keepalive`.

### Почему Fastify?

- Меньше кода и зависимостей, чем Express.
- Плагин `@fastify/mongodb` убирает ручную возню с коннектом.

### Как расширять дальше

1. **Агрегации**: делаете cron-джобу, которая каждую минуту сворачивает `tracks` → коллекцию `daily_stats`.
2. **Админ-панель**: React + Recharts, собственный API `/stats`.
3. **Анонимные пользователи**: добавляете в трекер генерацию `visitorId` (UUID в `localStorage`) и передаёте его вместе с каждым событием.

---
