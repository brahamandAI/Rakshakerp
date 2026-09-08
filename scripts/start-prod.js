#!/usr/bin/env node
/**
 * Production start guard — prevents PM2 crash loops when `.next` is missing
 * (e.g. restart mid-build).
 */
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const root = path.join(__dirname, '..')
const buildId = path.join(root, '.next', 'BUILD_ID')

if (!fs.existsSync(buildId)) {
  console.error(
    '[employee-onboarding-portal] No production build found (.next/BUILD_ID missing). Run `npm run build` before start.'
  )
  process.exit(1)
}

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')
const child = spawn(process.execPath, [nextBin, 'start'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 1)
  }
})
