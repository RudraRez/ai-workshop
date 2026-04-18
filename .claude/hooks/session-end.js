#!/usr/bin/env node
/**
 * session-end.js — runs when Claude Code session ends
 *
 * Responsibilities:
 * 1. Remind Claude to write learnings to MEMORY.md
 * 2. Find any open IN_PROGRESS tasks and warn
 * 3. Print session end summary
 */

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const LOGS_PATH = path.join(ROOT, 'logs')

function findOpenTasks() {
  const open = []
  if (!fs.existsSync(LOGS_PATH)) return open

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scanDir(fullPath)
      } else if (entry.name.endsWith('.md') && entry.name !== 'LOG-TEMPLATE.md') {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const isOpen = (
          content.includes('**Status:** IN_PROGRESS') ||
          content.includes('**Status:** PENDING') ||
          content.includes('**Status:** WAITING_INPUT')
        )
        if (isOpen) {
          const match = content.match(/\*\*Status:\*\* (\w+)/)
          const status = match ? match[1] : 'UNKNOWN'
          open.push({ file: path.relative(ROOT, fullPath), status })
        }
      }
    }
  }

  scanDir(LOGS_PATH)
  return open
}

// Main
console.log('\n━━━ Session End ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`[session-end] ${new Date().toISOString()}`)

const open = findOpenTasks()
if (open.length > 0) {
  console.log('\n⚠  OPEN TASKS — update status before ending:')
  open.forEach(({ file, status }) => {
    console.log(`   [${status}] ${file}`)
  })
}

console.log('\n📝 BEFORE YOU CLOSE THIS SESSION:')
console.log('   1. Write learnings to .claude/MEMORY.md')
console.log('      Format: ## [#N] YYYY-MM-DD — Category: Title')
console.log('   2. Update any IN_PROGRESS task log statuses')
console.log('   3. Commit MEMORY.md: git commit -m "chore: update agent memory"')
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
