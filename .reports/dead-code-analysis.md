# Dead Code Analysis Report

**Generated:** 2026-01-31

## Summary

| Category | Count |
|----------|-------|
| Unused Files | 6 |
| Unused Dependencies | 2 |
| Safe to Delete | 8 items |

## Unused Files

### Components (確実に未使用)

| File | Reason | Safe to Delete |
|------|--------|----------------|
| `src/components/AndCreateType.tsx` | インポートなし | ✅ |
| `src/components/FaultyTerminal/FaultyTerminal.tsx` | LightRaysに置き換え済み | ✅ |
| `src/components/FuzzyText/FuzzyText.tsx` | インポートなし | ✅ |
| `src/components/TargetCursor/TargetCursor.tsx` | インポートなし | ✅ |

### Utilities (確実に未使用)

| File | Reason | Safe to Delete |
|------|--------|----------------|
| `src/lib/utils.ts` | プロジェクト内でインポートなし | ✅ |

### Build Artifacts

| File | Reason | Safe to Delete |
|------|--------|----------------|
| `vite.config.d.ts` | 自動生成ファイル、不要 | ✅ |

## Unused Dependencies

### Production Dependencies

| Package | Reason | Safe to Remove |
|---------|--------|----------------|
| `class-variance-authority` | コード内でインポートなし | ✅ |
| `lucide-react` | コード内でインポートなし | ✅ |

### Dev Dependencies (False Positives - 削除しない)

| Package | Reason |
|---------|--------|
| `tailwindcss` | CSS内で使用 (@import "tailwindcss") |
| `tw-animate-css` | CSS内で使用 |

## Active Files (使用中)

以下のファイルは使用中のため削除しないでください:

- `src/main.tsx` - エントリーポイント
- `src/App.tsx` - ルートコンポーネント
- `src/index.css` - グローバルスタイル
- `src/components/Hero.tsx` - 背景コンポーネント
- `src/components/LightRays.tsx` - WebGLエフェクト
- `src/components/LightRays.css` - LightRaysスタイル
- `src/components/ChromaGrid.tsx` - カードグリッド
- `src/components/ChromaGrid.css` - ChromaGridスタイル
- `src/vite-env.d.ts` - Vite型定義

## Recommended Cleanup Commands

### Step 1: Remove unused files
```bash
rm src/components/AndCreateType.tsx
rm -r src/components/FaultyTerminal
rm -r src/components/FuzzyText
rm -r src/components/TargetCursor
rm src/lib/utils.ts
rmdir src/lib
rm vite.config.d.ts
```

### Step 2: Remove unused dependencies
```bash
npm uninstall class-variance-authority lucide-react
```

### Step 3: Verify build
```bash
npm run build
```

## Estimated Impact

- **削除されるファイル数:** 6
- **削除される依存関係:** 2
- **node_modules削減:** ~500KB (推定)
