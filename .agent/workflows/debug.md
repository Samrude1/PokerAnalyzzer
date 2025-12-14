---
description: Universal debugging and troubleshooting methodology
---

# Universal Debugging Workflow

A systematic, scientific approach to solving software defects in any environment.

## 1. The Debugging Loop

1. **Reproduce**: Find the exact steps to trigger the bug consistently.
   - *Tip*: If you can't reproduce it, you can't fix it.
2. **Isolate**: Remove variables until you have the "Minimal Reproducible Example".
3. **Hypothesize**: Predict *why* it is breaking based on evidence.
4. **Experiment**: Test your hypothesis (logging, breakpoints, code changes).
5. **Fix**: Implement the solution.
6. **Verify**: Prove the fix works and didn't break anything else (Regression Test).

## 2. Environment Debugging

### Application Failures
- **Check Logs**: Server logs, browser console, system events. Look for "Error", "Exception", "Fatal".
- **Check Config**: Are `.env` variables correct? Is the port open?
- **Check Dependencies**: Did a package update break compatibility?

### Build Failures
- **Clean Build**: Delete `node_modules`, `dist`, `target` and reinstall/rebuild.
- **Verbose Mode**: Run build commands with `--verbose` or `--debug`.

## 3. Toolset

- **Interactive Debuggers**: VS Code, Chrome DevTools, PDB. Set breakpoints, don't just print.
- **Network Inspectors**: Wireshark, Postman, Network Tab. Verify payload and headers.
- **Logging**: Structured logs (JSON) are easier to filter than plain text.

## 4. Performance Issues

- **Profiling**: Use CPU/Memory profilers to find bottlenecks.
- **Metrics**: Look at Latency, Throughput, Error Rate.
- **Database**: Check 'Slow Query Logs' and `EXPLAIN ANALYZE`.

## 5. Getting Help

When stuck (The "Rubber Duck" method):
1. Explain the problem out loud line-by-line.
2. Search error messages exactly as they appear.
3. Check Stack Overflow / GitHub Issues.
4. Ask a colleague, providing:
   - What you expected.
   - What actually happened.
   - Your reproduction steps.
