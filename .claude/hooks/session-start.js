#!/usr/bin/env node
/**
 * session-start.js — runs when Claude Code session begins
 *
 * Responsibilities:
 * 1. Load MEMORY.md into context
 * 2. Check context health (MCP budget, session state)
 * 3. Surface any WAITING_INPUT tasks from previous session
 * 4. Print session start summary
 */

const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const MEMORY_PATH = path.join(ROOT, '.claude', 'MEMORY.md')
const LOGS_PATH = path.join(ROOT, 'logs')

function readMemory() {
  if (!fs.existsSync(MEMORY_PATH)) {
    console.log('[session-start] No MEMORY.md found — starting fresh.')
    return null
  }
  const content = fs.readFileSync(MEMORY_PATH, 'utf-8')
  const entries = (content.match(/^## \[#\d+\]/gm) || []).length
  console.log(`[session-start] MEMORY.md loaded — ${entries} prior entries.`)
  return content
}

function findWaitingInputTasks() {
  const waiting = []
  if (!fs.existsSync(LOGS_PATH)) return waiting

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scanDir(fullPath)
      } else if (entry.name.endsWith('.md') && entry.name !== 'LOG-TEMPLATE.md') {
        const content = fs.readFileSync(fullPath, 'utf-8')
        if (content.includes('**Status:** WAITING_INPUT') || content.includes('Status: WAITING_INPUT')) {
          waiting.push(path.relative(ROOT, fullPath))
        }
      }
    }
  }

  scanDir(LOGS_PATH)
  return waiting
}

function findInProgressTasks() {
  const inProgress = []
  if (!fs.existsSync(LOGS_PATH)) return inProgress

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scanDir(fullPath)
      } else if (entry.name.endsWith('.md') && entry.name !== 'LOG-TEMPLATE.md') {
        const content = fs.readFileSync(fullPath, 'utf-8')
        if (content.includes('**Status:** IN_PROGRESS') || content.includes('Status: IN_PROGRESS')) {
          inProgress.push(path.relative(ROOT, fullPath))
        }
      }
    }
  }

  scanDir(LOGS_PATH)
  return inProgress
}

// Main
console.log('\n━━━ Session Start ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`[session-start] ${new Date().toISOString()}`)
console.log(`[session-start] Working directory: ${ROOT}`)

readMemory()

const waiting = findWaitingInputTasks()
if (waiting.length > 0) {
  console.log('\n⏸  TASKS WAITING FOR YOUR INPUT:')
  waiting.forEach(f => console.log(`   ${f}`))
  console.log('   → Review these before starting new work.')
}

const inProgress = findInProgressTasks()
if (inProgress.length > 0) {
  console.log('\n⚙  IN-PROGRESS TASKS FROM PRIOR SESSION:')
  inProgress.forEach(f => console.log(`   ${f}`))
  console.log('   → These may need completion or status update.')
}

console.log('\n→  Type /status for full project state.')
console.log('→  Type /logs to see all task files.')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
