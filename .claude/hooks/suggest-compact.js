#!/usr/bin/env node
/**
 * suggest-compact.js — context health monitor
 *
 * Checks approximate context usage indicators and suggests /compact
 * before the context window degrades silently.
 *
 * Triggers a warning when:
 * - Session log indicates > 10 large files read
 * - MEMORY.md is > 200 lines (adds significant tokens)
 * - > 5 log files are IN_PROGRESS (lots of context loaded)
 */

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const MEMORY_PATH = path.join(ROOT, '.claude', 'MEMORY.md')
const LOGS_PATH = path.join(ROOT, 'logs')

function checkMemorySize() {
  if (!fs.existsSync(MEMORY_PATH)) return 0
  const content = fs.readFileSync(MEMORY_PATH, 'utf-8')
  return content.split('\n').length
}

function countOpenLogs() {
  let count = 0
  if (!fs.existsSync(LOGS_PATH)) return count

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scanDir(fullPath)
      } else if (entry.name.endsWith('.md') && entry.name !== 'LOG-TEMPLATE.md') {
        const content = fs.readFileSync(fullPath, 'utf-8')
        if (
          content.includes('**Status:** IN_PROGRESS') ||
          content.includes('**Status:** WAITING_INPUT')
        ) {
          count++
        }
      }
    }
  }

  scanDir(LOGS_PATH)
  return count
}

const memoryLines = checkMemorySize()
const openLogs = countOpenLogs()

const warnings = []

if (memoryLines > 200) {
  warnings.push(`MEMORY.md is ${memoryLines} lines — consider summarising older entries into DECISIONS.md`)
}

if (openLogs > 5) {
  warnings.push(`${openLogs} tasks are IN_PROGRESS/WAITING_INPUT — high context load`)
}

if (warnings.length > 0) {
  console.log('\n⚠  CONTEXT HEALTH WARNING')
  warnings.forEach(w => console.log(`   • ${w}`))
  console.log('\n   Consider running /compact before the next large task.')
  console.log('   Before compacting: write pending learnings to MEMORY.md.\n')
}
