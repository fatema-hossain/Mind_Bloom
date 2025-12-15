# ⚠️ Important: Repository History Was Updated

The repository history has been cleaned to remove large `node_modules` files that were accidentally committed. **All collaborators need to sync their local repositories.**

---

## Option 1: Re-clone (Recommended - Easiest)

If you don't have any uncommitted local changes:

```bash
cd ..
rm -rf Mind_Bloom
git clone https://github.com/fatema-hossain/Mind_Bloom.git
cd Mind_Bloom
```

---

## Option 2: Reset Your Local Repository

If you prefer to keep your local folder:

### Step 1: Backup any uncommitted work
```bash
git stash
```

### Step 2: Fetch and reset to remote
```bash
git fetch origin
git reset --hard origin/main
```

### Step 3: Re-apply your changes (if you stashed any)
```bash
git stash pop
```

---

## After Syncing: Install Dependencies

The `node_modules` folder is no longer tracked in git. You need to install dependencies locally:

```bash
cd mindBloom/frontend
npm install
```

---

## What Changed?

- Removed `node_modules/` from git history (was causing GitHub push failures due to file size limits)
- Added a proper `.gitignore` file to prevent this from happening again

---

## Questions?

If you encounter any issues, reach out to the team or re-clone the repository.

