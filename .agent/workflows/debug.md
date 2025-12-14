---
description: Debugging procedures and troubleshooting guide
---

# Debugging Workflow

This workflow provides systematic approaches to debugging common issues.

## General Debugging Strategy

1. **Reproduce the issue** consistently
2. **Isolate the problem** to the smallest possible scope
3. **Form a hypothesis** about the cause
4. **Test the hypothesis** with targeted changes
5. **Verify the fix** with tests
6. **Document the solution** for future reference

## Development Environment Issues

### Application Won't Start

**Check 1: Dependencies**
// turbo
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Check 2: Port conflicts**
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux

# Kill the process if needed
```

**Check 3: Environment variables**
```bash
# Verify .env file exists and is properly formatted
cat .env

# Check for required variables
npm run env:check
```

### Build Failures

**Check build logs**:
```bash
npm run build -- --verbose
```

Common causes:
- TypeScript errors
- Missing dependencies
- Incorrect import paths
- Environment variable issues

**Fix TypeScript errors**:
```bash
# Check TypeScript errors
npx tsc --noEmit

# Generate types
npm run generate:types
```

## Runtime Errors

### JavaScript Errors

**Enable source maps**:
Ensure `devtool: 'source-map'` in webpack config

**Use browser DevTools**:
1. Open DevTools (F12)
2. Check Console tab for errors
3. Use Sources tab to set breakpoints
4. Inspect Network tab for failed requests

**Debug with VS Code**:
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

### API Errors

**Check network requests**:
1. Open DevTools Network tab
2. Filter by XHR/Fetch
3. Inspect request/response
4. Check status codes and headers

**Debug API calls**:
```javascript
// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

**Common API issues**:
- CORS errors → Check server CORS configuration
- 401/403 → Check authentication/authorization
- 404 → Verify endpoint URL and routing
- 500 → Check server logs for stack trace

### Database Issues

**Check database connection**:
```bash
# Test connection
npm run db:ping

# View connection string (sanitized)
npm run db:info
```

**Debug queries**:
```javascript
// Enable query logging
// Prisma
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Sequelize
const sequelize = new Sequelize({
  logging: console.log,
});
```

**Common database issues**:
- Connection timeout → Check network/firewall
- Query timeout → Optimize query or add indexes
- Migration errors → Check migration files
- Data integrity → Verify foreign key constraints

## Performance Issues

### Slow Page Load

**Measure performance**:
// turbo
```bash
npm run lighthouse
```

**Profile in DevTools**:
1. Open Performance tab
2. Click Record
3. Perform actions
4. Stop recording
5. Analyze flame graph

**Common causes**:
- Large bundle size → Code splitting needed
- Unoptimized images → Use next/image or optimization
- Blocking scripts → Use async/defer
- Too many requests → Bundle or use HTTP/2

### Memory Leaks

**Detect memory leaks**:
1. Open DevTools Memory tab
2. Take heap snapshot
3. Perform actions
4. Take another snapshot
5. Compare snapshots

**Common causes**:
- Event listeners not removed
- Timers not cleared
- Closures holding references
- Large caches not cleaned

**Fix example**:
```javascript
// Bad
useEffect(() => {
  window.addEventListener('resize', handleResize);
});

// Good
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## Testing Issues

### Flaky Tests

**Identify flaky tests**:
```bash
# Run test multiple times
npm run test -- --testNamePattern="flaky test" --runInBand --repeat=10
```

**Common causes**:
- Race conditions → Add proper waits
- Shared state → Isolate test data
- Time-dependent code → Mock timers
- Network requests → Mock API calls

**Fix race conditions**:
```javascript
// Bad
await click(button);
expect(element).toBeVisible();

// Good
await click(button);
await waitFor(() => expect(element).toBeVisible());
```

### Test Coverage Gaps

**Identify uncovered code**:
```bash
npm run test:coverage
```

Open `coverage/lcov-report/index.html` to see visual report

**Prioritize coverage**:
1. Critical business logic
2. Complex algorithms
3. Error handling paths
4. Edge cases

## Mobile-Specific Debugging

### React Native

**Enable remote debugging**:
1. Shake device or press Cmd+D (iOS) / Cmd+M (Android)
2. Select "Debug"
3. Open Chrome DevTools

**View logs**:
```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android
```

**Common issues**:
- Metro bundler not running → `npm start`
- Native module errors → `cd ios && pod install`
- Build failures → Clean build folder

### iOS Debugging

**View Xcode logs**:
```bash
# Build and run with logs
npx react-native run-ios --verbose
```

**Common issues**:
- Code signing → Check provisioning profiles
- Build errors → Clean build folder (Cmd+Shift+K)
- Simulator issues → Reset simulator

### Android Debugging

**View Android Studio logs**:
```bash
# Build and run with logs
npx react-native run-android --verbose

# View logcat
adb logcat
```

**Common issues**:
- Gradle errors → `cd android && ./gradlew clean`
- SDK version mismatch → Update build.gradle
- Emulator issues → Wipe data and restart

## Production Debugging

### Error Tracking

**Use error monitoring** (Sentry, Bugsnag, etc.):
```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Add context to errors**:
```javascript
Sentry.setUser({ id: user.id, email: user.email });
Sentry.setContext('action', { type: 'checkout', step: 2 });
```

### Logging

**Structured logging**:
```javascript
const logger = {
  info: (message, meta) => console.log(JSON.stringify({ level: 'info', message, ...meta })),
  error: (message, error, meta) => console.error(JSON.stringify({ 
    level: 'error', 
    message, 
    error: error.stack,
    ...meta 
  })),
};
```

**Log correlation**:
```javascript
// Add request ID to all logs
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

### Performance Monitoring

**Add performance tracking**:
```javascript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## Debugging Tools

### Browser DevTools
- **Console**: Errors, warnings, logs
- **Sources**: Breakpoints, step debugging
- **Network**: Request/response inspection
- **Performance**: Profiling, flame graphs
- **Memory**: Heap snapshots, leak detection
- **Application**: Storage, cache, service workers

### VS Code Extensions
- **Debugger for Chrome**: Debug in VS Code
- **ESLint**: Catch errors while coding
- **Error Lens**: Inline error messages
- **GitLens**: Understand code history

### Command Line Tools
```bash
# Network debugging
curl -v https://api.example.com

# DNS lookup
nslookup example.com

# Port scanning
nmap localhost

# Process monitoring
top / htop
```

## Common Error Patterns

### "Cannot read property 'X' of undefined"
**Cause**: Accessing property on undefined/null object
**Fix**: Add null checks or optional chaining
```javascript
// Bad
const name = user.profile.name;

// Good
const name = user?.profile?.name ?? 'Unknown';
```

### "Module not found"
**Cause**: Missing dependency or incorrect import path
**Fix**: 
```bash
npm install missing-package
# or fix import path
```

### "CORS error"
**Cause**: Cross-origin request blocked
**Fix**: Configure CORS on server
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
}));
```

### "Maximum call stack size exceeded"
**Cause**: Infinite recursion
**Fix**: Add base case or check recursion depth

## Debugging Checklist

When stuck, systematically check:
- [ ] Error message and stack trace
- [ ] Browser console for errors
- [ ] Network tab for failed requests
- [ ] Environment variables
- [ ] Recent code changes (git diff)
- [ ] Dependencies up to date
- [ ] Database connection and data
- [ ] Logs (application and server)
- [ ] Similar issues in documentation/GitHub

## Getting Help

If still stuck:
1. **Search existing issues** on GitHub
2. **Check documentation** for the library/framework
3. **Ask on Stack Overflow** with minimal reproducible example
4. **Review recent commits** for breaking changes
5. **Pair program** with a colleague

## Documentation

After fixing an issue:
1. Document the solution in code comments
2. Update troubleshooting guide if common issue
3. Create ADR if architectural decision made
4. Share knowledge with team
