// QuickStartTemplate/projects/QuickStartTemplate-contracts/nft_mint_server/server.js
// Local entry: starts the API on port 3001 for dev. All routes/config live in app.js.

import app from './app.js'

const port = process.env.PORT || 3001

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend listening at http://localhost:${port}`)
})
