import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

console.log('📦 Vulcan SDK — Publish Readiness Check\n')

function runCommand(command: string, stepName: string): boolean {
  console.log(`⏳ Step: ${stepName}...`)
  try {
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ ${stepName} passed.\n`)
    return true
  } catch (error) {
    console.error(`❌ ${stepName} failed. Please resolve the issues before publishing.\n`)
    return false
  }
}

async function main() {
  // 1. Verify build
  if (!runCommand('npm run build', 'Building package (tsup)')) {
    process.exit(1)
  }

  // 2. Verify tests
  if (!runCommand('npm test', 'Running test suites (jest)')) {
    process.exit(1)
  }

  // 3. Verify npm name scope
  const packageJsonPath = path.resolve(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { name: string }
  const name = packageJson.name

  console.log(`🔍 Package Name: ${name}`)
  if (name.startsWith('@vulcan-ai/')) {
    console.warn(`⚠️  WARNING: You are using the default scope "${name}".`)
    console.warn(`   Unless you own the "@vulcan-ai" organization on npm, publishing will fail.`)
    console.warn(`   Please update the "name" field in package.json to your own username/scope (e.g. "@its-rahul-r15/vulcan-sdk").\n`)
  } else {
    console.log(`✅ Package name scope looks good to publish.\n`)
  }

  // 4. Verify login status
  console.log('⏳ Checking npm login status...')
  try {
    const user = execSync('npm whoami', { encoding: 'utf8' }).trim()
    console.log(`✅ Logged in as npm user: "${user}"\n`)
    
    console.log('🚀 READY TO PUBLISH!')
    console.log('👉 To publish this package to npm, run the following command:')
    console.log(`\n   npm publish --access public\n`)
  } catch (error) {
    console.warn('⚠️  Not logged in to npm.')
    console.log('👉 Please log in to your npm account first by running:')
    console.log('\n   npm login\n')
    console.log('👉 After logging in successfully, run the publish command:')
    console.log('\n   npm publish --access public\n')
  }
}

main().catch(console.error)
