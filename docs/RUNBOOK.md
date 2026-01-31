# Runbook

**Updated:** 2026-01-31

## Deployment

### Platform
GitHub Pages (static hosting)

### Deploy Process

1. **Build the site:**
   ```bash
   npm run build
   ```

2. **Output:** `dist/` directory

3. **GitHub Actions** handles deployment automatically on push to `main`

### Manual Deploy (if needed)
```bash
npm run build
# Push dist/ to gh-pages branch or configure GitHub Pages to use dist/
```

## Monitoring

### Health Check
- Visit https://andcreate.github.io/
- Verify cards load and links work
- Check WebGL background renders

### Performance
- Build size: ~320KB JS, ~15KB CSS (gzipped: ~110KB + ~4KB)
- Lighthouse score target: 90+

## Common Issues

### Issue: Build Fails
**Symptoms:** `tsc -b` or `vite build` errors

**Solutions:**
1. Check TypeScript errors: `npx tsc --noEmit`
2. Clear cache: `rm -rf node_modules/.vite`
3. Reinstall: `rm -rf node_modules && npm install`

### Issue: Fonts Not Loading
**Symptoms:** Fallback font displayed

**Solutions:**
1. Check Google Fonts link in `index.html`
2. Verify font name: "LINE Seed JP"
3. Check network tab for blocked requests

### Issue: WebGL Not Rendering
**Symptoms:** Black background, no light rays

**Solutions:**
1. Check browser WebGL support
2. Look for console errors (OGL library)
3. Try reducing `dpr` in LightRays component

### Issue: Cards Not Clickable
**Symptoms:** Click doesn't open URL

**Solutions:**
1. Check `url` property in `gridItems`
2. Verify `handleCardClick` in ChromaGrid.tsx
3. Check for overlay blocking clicks (pointer-events)

## Rollback

### Via Git
```bash
git log --oneline -10  # Find commit to rollback to
git revert <commit>    # Create revert commit
git push               # Trigger redeploy
```

### Via GitHub
1. Go to repository → Actions
2. Find last successful deploy
3. Re-run workflow

## Contact

Repository: https://github.com/andcreate/andcreate.github.io
