#!/bin/bash
# Script to remove .env.development from Git history
# This keeps the file locally but removes it from all commits

set -e  # Exit on error

echo "🔒 Removing .env.development from Git history..."
echo ""
echo "⚠️  WARNING: This will rewrite Git history!"
echo "⚠️  Make sure you've coordinated with any collaborators."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Backup the file locally
echo "📦 Backing up .env.development..."
cp .env.development .env.development.backup
echo "✅ Backup created: .env.development.backup"

# Method 1: Using git filter-branch (works without additional tools)
echo ""
echo "🧹 Removing .env.development from all commits..."
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.development" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up refs
echo ""
echo "🗑️  Cleaning up Git references..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Restore the local file
echo ""
echo "📂 Restoring local .env.development..."
if [ -f .env.development.backup ]; then
    mv .env.development.backup .env.development
    echo "✅ Local file restored"
fi

# Verify removal
echo ""
echo "🔍 Verifying removal..."
if git rev-list --all --objects | grep -q "\.env\.development"; then
    echo "❌ File still found in history. Manual intervention needed."
    exit 1
else
    echo "✅ File successfully removed from Git history"
fi

echo ""
echo "📝 Next steps:"
echo "1. Force push to remote: git push origin --force --all"
echo "2. Force push tags: git push origin --force --tags"
echo "3. Create security commit: git commit --allow-empty -m 'chore: remove exposed environment variables from git'"
echo "4. Rotate Firebase API keys immediately!"
echo ""
echo "⚠️  CRITICAL: You MUST rotate your Firebase credentials now!"
