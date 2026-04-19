## v2.4.0

We're excited to announce v2.4.0, featuring dark mode support, significant performance improvements, and important security enhancements. This release also includes a breaking API change—please review before upgrading.

### 💥 Breaking Changes

- **Standardized API field naming convention** — All API responses now use `snake_case` for field names. Update any client code that references `userId` to use `user_id` instead. Affected endpoints: `/api/users`, `/api/users/:id`, and `POST /api/users`. (#136)

### ✨ Features

- **Dark mode support** — The app now automatically follows your system's color scheme preference, with an option to manually toggle between light and dark themes in settings. Your preference is saved locally. (#142)

- **Rate limiting on authentication endpoints** — Added protection against brute force attacks with configurable rate limits: 5 login attempts and 3 registration attempts per minute. (#141)

### 🐛 Bug Fixes

- **Fixed memory leak in WebSocket handler** — Resolved an out-of-memory issue affecting long-running connections. Event listeners are now properly cleaned up when connections close. Thanks to everyone who reported this in #134. (#138)

- **Fixed timezone handling in event scheduler** — Events are now correctly scheduled in the user's local timezone instead of UTC, preventing scheduling confusion for users outside UTC. (#143)

### ⚡ Performance

- **Optimized dashboard loading** — Reduced load time by 60% through database query optimization, including new compound indexes and elimination of N+1 queries. (#139)

### 📚 Documentation

- **Added webhook API documentation** — Comprehensive documentation for all webhook endpoints including payload formats, authentication requirements, and retry behavior. (#140)

### 📦 Dependencies

- **Upgraded to Node.js 20 LTS** — Brings improved performance, native fetch API support, and the latest security patches. (#145)

---

**Contributors:** @apilead, @docwriter, @mikefixer, @perfguru, @sarahdev, @securitypro

**Full Changelog:** [v2.3.0...v2.4.0](https://github.com/example/repo/compare/v2.3.0...v2.4.0)
