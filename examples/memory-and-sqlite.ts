import { Vulcan } from '../src'
import { SQLiteStorage } from '../src/memory/sqlite'

// 1. Initialize persistent SQLite storage
const storage = new SQLiteStorage('./scratch/agent-sessions.db')

// 2. Create agent attached to persistent memory storage
const agent = Vulcan.createAgent({
  name: 'memory-agent',
  instructions: 'You remember details shared by the user in previous turns.',
  storageAdapter: storage,
})

async function main() {
  const sessionId = 'user_session_101'

  console.log('--- Turn 1: Sharing information ---')
  const res1 = await Vulcan.run(agent, 'Hi, my favorite color is teal and my project name is Vulcan.', { sessionId })
  console.log('Agent:', res1.output)

  console.log('\n--- Turn 2: Querying memory ---')
  const res2 = await Vulcan.run(agent, 'What is my favorite color and project name?', { sessionId })
  console.log('Agent:', res2.output)

  await storage.close()
}

main().catch(console.error)
