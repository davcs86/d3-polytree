#!/bin/bash
# Provision davcs86/agent-plugins skills into cloud sessions.
#
# Why: Claude Code on the web does not load plugins synced from claude.ai, nor
# marketplaces declared in .claude/settings.json (no workspace-trust dialog in
# cloud). Plain skills under ~/.claude/skills/ are live-watched, so installing
# them here makes them available in the same session.
#
# Skills are installed flat (/feature-gap, not /repo-surveyor:feature-gap);
# plugin-shaped dirs would need /reload-plugins. Fail-open: a network or git
# error never blocks session start — the previous install (if any) is kept.
set -uo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

REPO_URL="https://github.com/davcs86/agent-plugins"
REF="main"
PLUGINS=(repo-surveyor design-buddy context-forge)

SKILLS_DIR="$HOME/.claude/skills"
AGENTS_DIR="$HOME/.claude/agents"
CACHE="$HOME/.cache/agent-plugins"
MARKER=".agent-plugins-managed"

log() { echo "[agent-plugins] $*" >&2; }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if GIT_LFS_SKIP_SMUDGE=1 timeout 90 git clone --quiet --depth 1 --branch "$REF" \
  "$REPO_URL" "$tmp/src" 2>"$tmp/err"; then
  rm -rf "$CACHE" && mkdir -p "$(dirname "$CACHE")" && mv "$tmp/src" "$CACHE"
elif [ -d "$CACHE" ]; then
  log "clone failed, reusing cached copy: $(tr '\n' ' ' <"$tmp/err")"
else
  log "clone failed and no cache; skipping: $(tr '\n' ' ' <"$tmp/err")"
  exit 0
fi

mkdir -p "$SKILLS_DIR" "$AGENTS_DIR"
for plugin in "${PLUGINS[@]}"; do
  root="$CACHE/plugins/$plugin"
  [ -d "$root/skills" ] || { log "plugin '$plugin' not found at $REF"; continue; }

  for skill in "$root"/skills/*/; do
    name="$(basename "$skill")"
    dest="$SKILLS_DIR/$name"
    # Never clobber a skill this hook did not install.
    if [ -e "$dest" ] && [ ! -f "$dest/$MARKER" ]; then
      log "skip $name: $dest exists and is not managed by this hook"
      continue
    fi
    stage="$SKILLS_DIR/.$name.tmp"
    rm -rf "$stage" && cp -R "$skill" "$stage" && echo "$plugin@$REF" >"$stage/$MARKER"
    rm -rf "$dest" && mv "$stage" "$dest"
  done

  if [ -d "$root/agents" ]; then
    # Agents have no live detection; installed for the next session. The
    # manifest records which files this hook owns so user agents are kept.
    for agent in "$root"/agents/*.md; do
      base="$(basename "$agent")"
      if [ -e "$AGENTS_DIR/$base" ] && ! grep -qxF "$base" "$AGENTS_DIR/$MARKER" 2>/dev/null; then
        log "skip agent $base: exists and is not managed by this hook"
        continue
      fi
      cp "$agent" "$AGENTS_DIR/$base"
      grep -qxF "$base" "$AGENTS_DIR/$MARKER" 2>/dev/null || echo "$base" >>"$AGENTS_DIR/$MARKER"
    done
  fi
  log "installed $plugin ($(git -C "$CACHE" rev-parse --short HEAD 2>/dev/null || echo cached))"
done
exit 0
