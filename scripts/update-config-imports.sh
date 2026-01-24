#!/bin/bash

###############################################################################
# Firebase to Supabase Config Import Updater
#
# This script updates all imports from Firebase config services to Supabase.
# Run from project root: bash scripts/update-config-imports.sh
#
# What it does:
# - Updates 5 files with new import paths
# - Creates backup of each file before modification
# - Prints summary of changes
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================================="
echo "Firebase → Supabase Config Import Updater"
echo "=================================================="
echo ""

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    echo "Usage: bash scripts/update-config-imports.sh"
    exit 1
fi

# Files to update
FILES=(
    "src/utils/giuros.ts"
    "src/components/admin/AdminGiuros.tsx"
    "src/components/admin/EconomyMetrics.tsx"
    "src/components/admin/IncomeConfig.tsx"
    "src/components/admin/AdminConfig.tsx"
)

# Backup directory
BACKUP_DIR="backups/config-migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Step 1: Creating backups...${NC}"
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        echo "  ✓ Backed up: $file"
    else
        echo -e "  ${RED}✗ File not found: $file${NC}"
    fi
done
echo ""

echo -e "${YELLOW}Step 2: Updating imports...${NC}"

# Update src/utils/giuros.ts
FILE="src/utils/giuros.ts"
if [ -f "$FILE" ]; then
    sed -i.tmp "s|from './configService'|from '../services/db/config'|g" "$FILE"
    rm "${FILE}.tmp" 2>/dev/null || true
    echo "  ✓ Updated: $FILE"
    echo "    - Changed: './configService' → '../services/db/config'"
else
    echo -e "  ${RED}✗ Not found: $FILE${NC}"
fi

# Update src/components/admin/AdminGiuros.tsx
FILE="src/components/admin/AdminGiuros.tsx"
if [ -f "$FILE" ]; then
    sed -i.tmp "s|from '../../utils/configService'|from '../../services/db/config'|g" "$FILE"
    rm "${FILE}.tmp" 2>/dev/null || true
    echo "  ✓ Updated: $FILE"
    echo "    - Changed: '../../utils/configService' → '../../services/db/config'"
else
    echo -e "  ${RED}✗ Not found: $FILE${NC}"
fi

# Update src/components/admin/EconomyMetrics.tsx
FILE="src/components/admin/EconomyMetrics.tsx"
if [ -f "$FILE" ]; then
    sed -i.tmp "s|from '../../utils/configService'|from '../../services/db/config'|g" "$FILE"
    rm "${FILE}.tmp" 2>/dev/null || true
    echo "  ✓ Updated: $FILE"
    echo "    - Changed: '../../utils/configService' → '../../services/db/config'"
else
    echo -e "  ${RED}✗ Not found: $FILE${NC}"
fi

# Update src/components/admin/IncomeConfig.tsx
FILE="src/components/admin/IncomeConfig.tsx"
if [ -f "$FILE" ]; then
    sed -i.tmp "s|from '../../utils/configService'|from '../../services/db/config'|g" "$FILE"
    rm "${FILE}.tmp" 2>/dev/null || true
    echo "  ✓ Updated: $FILE"
    echo "    - Changed: '../../utils/configService' → '../../services/db/config'"
else
    echo -e "  ${RED}✗ Not found: $FILE${NC}"
fi

# Update src/components/admin/AdminConfig.tsx
FILE="src/components/admin/AdminConfig.tsx"
if [ -f "$FILE" ]; then
    sed -i.tmp "s|from '../../utils/adminConfig'|from '../../services/db/config'|g" "$FILE"
    rm "${FILE}.tmp" 2>/dev/null || true
    echo "  ✓ Updated: $FILE"
    echo "    - Changed: '../../utils/adminConfig' → '../../services/db/config'"
else
    echo -e "  ${RED}✗ Not found: $FILE${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Verifying changes...${NC}"

# Check for any remaining Firebase config imports
REMAINING=$(grep -r "from.*configService\|from.*adminConfig" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v ".bak" | grep -v "node_modules" || true)

if [ -z "$REMAINING" ]; then
    echo -e "  ${GREEN}✓ All imports successfully updated!${NC}"
else
    echo -e "  ${YELLOW}⚠ Some imports may still reference old services:${NC}"
    echo "$REMAINING"
fi

echo ""
echo "=================================================="
echo -e "${GREEN}Migration Complete!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Run: npm run type-check"
echo "2. Run: npm run lint"
echo "3. Run: npm test"
echo "4. Test in browser (npm run dev)"
echo "5. Commit changes: git commit -m 'feat(config): migrate from Firebase to Supabase'"
echo ""
echo "Backups saved to: $BACKUP_DIR"
echo ""
echo "To rollback, run:"
echo "  cp $BACKUP_DIR/* src/"
echo ""
